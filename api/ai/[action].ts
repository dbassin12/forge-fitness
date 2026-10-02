import { checkPasscode, clientIp } from '../../server/auth.js'
import { aiClient, describeError, estimateFood, normalizeTurns, openCoachStream, resolveModel, type FoodInput } from '../../server/ai.js'
import { rateLimit } from '../../server/ratelimit.js'
import { CoachSchema, FoodPhotoSchema, FoodTextSchema, sniffImage } from '../../server/schemas.js'

/**
 * /api/ai/config      GET  — is AI set up on the server? (no auth, no Anthropic call)
 * /api/ai/check       POST — test the key and report which model answers
 * /api/ai/food-text   POST — "2 eggs and toast" → itemised nutrition estimate
 * /api/ai/food-photo  POST — meal photo → itemised nutrition estimate
 * /api/ai/coach       POST — streaming coach reply (NDJSON events)
 * POSTs require the x-forge-passcode header (APP_PASSCODE).
 */

const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  Response.json(body, { status, headers: { 'Cache-Control': 'no-store', ...headers } })

function actionOf(req: Request): string {
  return new URL(req.url).pathname.split('/').filter(Boolean).pop() ?? ''
}

const LIMITS: Record<string, [number, number]> = {
  check: [10, 10 * 60_000],
  food: [20, 10 * 60_000],
  coach: [30, 10 * 60_000],
}

export async function GET(req: Request): Promise<Response> {
  if (actionOf(req) !== 'config') return json({ error: 'not found' }, 404)
  return json({ ok: true, configured: { apiKey: !!process.env.ANTHROPIC_API_KEY, passcode: !!process.env.APP_PASSCODE } })
}

export async function POST(req: Request): Promise<Response> {
  const action = actionOf(req)
  const group = action === 'food-text' || action === 'food-photo' ? 'food' : action
  const limit = LIMITS[group]
  if (!limit) return json({ error: 'not found' }, 404)
  const auth = checkPasscode(req)
  if (!auth.ok) return json({ error: auth.error }, auth.status)
  if (!process.env.ANTHROPIC_API_KEY) return json({ error: 'AI is off: add ANTHROPIC_API_KEY in the Vercel project settings.' }, 503)
  const rl = rateLimit(`${group}:${clientIp(req)}`, limit[0], limit[1])
  if (!rl.ok) return json({ error: `Slow down a little — try again in ${rl.retryAfterSec} s.` }, 429, { 'Retry-After': String(rl.retryAfterSec) })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return json({ error: 'invalid JSON' }, 400)
  }

  try {
    const c = aiClient()
    const model = await resolveModel(c)

    if (action === 'check') return json({ ok: true, model: model.name })

    if (action === 'food-text' || action === 'food-photo') {
      let input: FoodInput
      if (action === 'food-text') {
        const p = FoodTextSchema.safeParse(body)
        if (!p.success) return json({ error: 'Describe what you ate in 2–500 characters.' }, 400)
        input = { text: p.data.text }
      } else {
        const p = FoodPhotoSchema.safeParse(body)
        if (!p.success) return json({ error: 'That photo couldn’t be read. Try another one.' }, 400)
        const mediaType = sniffImage(p.data.image)
        if (!mediaType) return json({ error: 'Only JPEG, PNG or WebP photos work.' }, 400)
        input = { image: { data: p.data.image, mediaType }, note: p.data.note || undefined }
      }
      const result = await estimateFood(c, model, input, req.signal)
      if (!result.ok) return json({ ok: false, refused: true, error: 'Claude declined to estimate this one. Try describing it in words.' }, 422)
      return json(result)
    }

    // coach
    const p = CoachSchema.safeParse(body)
    if (!p.success) return json({ error: 'invalid request' }, 400)
    const turns = normalizeTurns(p.data.messages)
    if (!turns.length) return json({ error: 'Ask a question first.' }, 400)
    const abort = new AbortController()
    const events = await openCoachStream(c, model, turns, p.data.context, AbortSignal.any([req.signal, abort.signal]))
    const enc = new TextEncoder()
    const line = (o: unknown) => enc.encode(`${JSON.stringify(o)}\n`)
    const stream = new ReadableStream<Uint8Array>({
      async pull(controller) {
        try {
          const r = await events.next()
          if (r.done) controller.close()
          else controller.enqueue(line(r.value))
        } catch (e) {
          controller.enqueue(line({ type: 'error', error: describeError(e).error }))
          controller.close()
        }
      },
      cancel() {
        abort.abort()
      },
    })
    return new Response(stream, { headers: { 'Content-Type': 'application/x-ndjson; charset=utf-8', 'Cache-Control': 'no-store', 'X-Accel-Buffering': 'no' } })
  } catch (e) {
    const { status, error } = describeError(e)
    if (status >= 500) console.error(`ai ${action} failed`, e instanceof Error ? e.message : e)
    return json({ error }, status)
  }
}
