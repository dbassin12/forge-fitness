import Anthropic from '@anthropic-ai/sdk'
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod'
import type { BetaContentBlockParam, BetaMessageParam } from '@anthropic-ai/sdk/resources/beta/messages/messages'
import type { ModelInfo } from '@anthropic-ai/sdk/resources/models'
import { z } from 'zod'
import type { ChatTurn, CoachEvent, FoodEstimate } from '../shared/ai.js'

export type { ChatTurn, CoachEvent, FoodEstimate } from '../shared/ai.js'

// ---- Client and model ----------------------------------------------------------------------

export class AiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
  }
}

let client: Anthropic | null = null

export function aiClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) throw new AiError(503, 'AI is off: add ANTHROPIC_API_KEY in the Vercel project settings.')
  client ??= new Anthropic({ maxRetries: 1, timeout: 55_000 })
  return client
}

export interface ResolvedModel {
  id: string
  name: string
  /** Effort levels the model accepts (empty when unknown — then effort isn't sent). */
  effort: Set<Effort>
}

export type Effort = 'low' | 'medium' | 'high'

const MODEL_TTL_MS = 6 * 3600_000
let cachedModel: { model: ResolvedModel; at: number } | null = null

function toResolved(m: ModelInfo): ResolvedModel {
  const e = m.capabilities?.effort
  const effort = new Set<Effort>()
  if (e?.supported) for (const level of ['low', 'medium', 'high'] as const) if (e[level]?.supported) effort.add(level)
  return { id: m.id, name: m.display_name || m.id, effort }
}

/**
 * The newest Claude Opus model this key can use that reads images and supports structured
 * outputs. Undated ids are preferred over dated snapshots and routing variants.
 */
export function pickModel(models: ModelInfo[]): ModelInfo | null {
  const usable = models.filter(
    (m) => m.id.startsWith('claude-opus-') && m.capabilities?.image_input?.supported !== false && m.capabilities?.structured_outputs?.supported !== false,
  )
  const plain = usable.filter((m) => /^claude-opus-\d+(-\d+)?$/.test(m.id))
  const pool = plain.length ? plain : usable
  return [...pool].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))[0] ?? null
}

/** AI_MODEL pins a model; otherwise the newest Opus is looked up and remembered for a few hours. */
export async function resolveModel(c: Anthropic, now = Date.now()): Promise<ResolvedModel> {
  if (cachedModel && now - cachedModel.at < MODEL_TTL_MS) return cachedModel.model
  const pinned = process.env.AI_MODEL?.trim()
  let model: ResolvedModel
  if (pinned) {
    try {
      model = toResolved(await c.models.retrieve(pinned))
    } catch (e) {
      if (e instanceof Anthropic.AuthenticationError || e instanceof Anthropic.PermissionDeniedError) throw e
      if (e instanceof Anthropic.NotFoundError) throw new AiError(502, `AI_MODEL "${pinned}" isn't available to this API key.`)
      model = { id: pinned, name: pinned, effort: new Set() }
    }
  } else {
    const all: ModelInfo[] = []
    for await (const m of c.models.list({ limit: 100 })) all.push(m)
    const best = pickModel(all)
    if (!best) throw new AiError(502, 'No Claude Opus model is available to this API key. Set AI_MODEL to pick one.')
    model = toResolved(best)
  }
  cachedModel = { model, at: now }
  return model
}

export function resetAiState(): void {
  client = null
  cachedModel = null
  noExtras.clear()
}

/** Server-side refusal fallbacks: if the model declines, the API re-runs the request on a suitable model. */
const FALLBACK_BETA = 'server-side-fallback-2026-07-01'
const noExtras = new Set<string>()

function effortFor(model: ResolvedModel, want: Effort): { effort?: Effort } {
  return model.effort.has(want) ? { effort: want } : {}
}

/**
 * Runs with the optional extras (refusal fallbacks, mid-conversation system messages) first.
 * A model that rejects them gets one plain retry, and is remembered if that works.
 */
async function withExtras<T>(model: ResolvedModel, run: (extras: boolean) => Promise<T>): Promise<T> {
  const extras = !noExtras.has(model.id)
  try {
    return await run(extras)
  } catch (e) {
    if (!extras || !(e instanceof Anthropic.BadRequestError)) throw e
    const result = await run(false)
    noExtras.add(model.id)
    return result
  }
}

/** A short, safe message for the phone, plus the HTTP status to use. */
export function describeError(e: unknown): { status: number; error: string } {
  if (e instanceof AiError) return { status: e.status, error: e.message }
  if (e instanceof Anthropic.AuthenticationError) return { status: 502, error: 'The Anthropic API key was rejected. Check ANTHROPIC_API_KEY in Vercel.' }
  if (e instanceof Anthropic.PermissionDeniedError) return { status: 502, error: 'This API key isn’t allowed to use the model. Check your Anthropic console.' }
  if (e instanceof Anthropic.RateLimitError) return { status: 429, error: 'Claude is rate-limited right now. Try again in a minute.' }
  if (e instanceof Anthropic.BadRequestError) return { status: 400, error: `Claude couldn’t process that: ${e.message.slice(0, 160)}` }
  if (e instanceof Anthropic.APIConnectionTimeoutError) return { status: 504, error: 'Claude took too long. Try again.' }
  if (e instanceof Anthropic.APIUserAbortError) return { status: 499, error: 'Cancelled.' }
  if (e instanceof Anthropic.APIConnectionError) return { status: 504, error: 'Couldn’t reach Claude. Try again.' }
  if (e instanceof Anthropic.InternalServerError) return { status: 503, error: 'Claude is overloaded right now. Try again shortly.' }
  if (e instanceof Anthropic.APIError) return { status: 502, error: `Claude error (${e.status ?? 'unknown'}).` }
  // e.g. a reply cut off before its JSON was complete
  if (e instanceof Anthropic.AnthropicError) return { status: 502, error: 'Claude’s answer couldn’t be read. Try again.' }
  return { status: 500, error: 'Something went wrong. Try again.' }
}

// ---- Food estimates -------------------------------------------------------------------------

export const FoodItemSchema = z.object({
  name: z.string(),
  portion: z.string(),
  grams: z.number(),
  kcal: z.number(),
  protein: z.number(),
  carbs: z.number(),
  fat: z.number(),
  fiber: z.number(),
  produceServings: z.number(),
  // A plain string: the enum would only be a hint in the schema, so it's normalised afterwards.
  confidence: z.string(),
})

export const FoodEstimateSchema = z.object({
  isFood: z.boolean(),
  items: z.array(FoodItemSchema),
  notes: z.string(),
})

export type FoodEstimateResult = { ok: true; estimate: FoodEstimate; model: string } | { ok: false; refused: true }

export const FOOD_SYSTEM = `You estimate the nutrition of meals for Forge, a personal calorie and protein tracking app. The user lives in the United States, so think in typical US portions, products and restaurant sizes unless they say otherwise.

You receive either a photo of food (sometimes with a short note) or a short description such as "2 eggs, toast with butter, coffee with milk". Return your best estimate of what was eaten, split into separate items the way a person would log them.

How to estimate:
- One item per distinct food or drink. Combine only things eaten as one unit: a sandwich is one item; a plate of chicken, rice and broccoli is three.
- Use the quantities the user gives. When they don't give one, assume a typical single adult serving and mark it in the portion text, e.g. "1 cup (est.)".
- In photos, judge size from the plate (a dinner plate is about 10–11 inches), cutlery, hands and packaging, and count the pieces you can see.
- Include cooking fat, sauces, dressings, cheese, sugar and drinks when they're visible or strongly implied (fried food, sautéed vegetables, restaurant dishes), and mention those assumptions in notes.
- Use standard reference values (USDA-style) for whole foods and typical published values for chain-restaurant or packaged items you can identify.
- grams is the estimated edible weight as served; for drinks use millilitres as grams.
- kcal, protein, carbs, fat and fiber are totals for the whole item, not per 100 g. Keep them consistent: kcal should be close to 4 × protein + 4 × carbs + 9 × fat (alcohol adds 7 kcal per gram).
- produceServings counts the fruit and vegetables in the item at about 80 g per serving (potatoes don't count; a side salad is about 1). Use 0 when there are none.
- confidence is "high" when the food and amount are clear, "medium" when the amount is a guess, and "low" when the food itself is uncertain.
- Names are short and plain (at most about 40 characters), like "Scrambled eggs" or "Whole-wheat toast with butter". Portions are human-friendly, like "2 large eggs" or "1 slice (35 g)".
- notes holds one or two short sentences with the key assumptions or what would make the estimate more accurate, e.g. "Assumed 1 tbsp oil for cooking. Tell me the cup size for a better estimate." Use an empty string when there's nothing useful to add.

If the photo or text clearly isn't food or drink, set isFood to false, return no items, and use notes to say briefly what you see. For any normal meal, never refuse: when unsure, give your best estimate with low confidence.`

const r1 = (n: number, max: number) => Math.round(Math.min(max, Math.max(0, Number.isFinite(n) ? n : 0)) * 10) / 10

/** Clamp and round whatever came back so the phone never stores a wild number. */
export function cleanEstimate(e: z.infer<typeof FoodEstimateSchema>): FoodEstimate {
  return {
    isFood: e.isFood,
    notes: e.notes.trim().slice(0, 300),
    items: e.items.slice(0, 12).map((i) => ({
      name: i.name.trim().slice(0, 60) || 'Food',
      portion: i.portion.trim().slice(0, 60),
      grams: Math.round(r1(i.grams, 3000)),
      kcal: Math.round(r1(i.kcal, 5000)),
      protein: r1(i.protein, 400),
      carbs: r1(i.carbs, 800),
      fat: r1(i.fat, 400),
      fiber: r1(i.fiber, 150),
      produceServings: r1(i.produceServings, 10),
      confidence: (['high', 'medium', 'low'] as const).find((c) => c === i.confidence.trim().toLowerCase()) ?? 'medium',
    })),
  }
}

export interface FoodInput {
  text?: string
  image?: { data: string; mediaType: 'image/jpeg' | 'image/png' | 'image/webp' }
  note?: string
}

export async function estimateFood(c: Anthropic, model: ResolvedModel, input: FoodInput, signal?: AbortSignal): Promise<FoodEstimateResult> {
  const content: BetaContentBlockParam[] = []
  if (input.image) {
    content.push({ type: 'image', source: { type: 'base64', media_type: input.image.mediaType, data: input.image.data } })
    content.push({ type: 'text', text: input.note ? `My note about this meal: ${input.note}` : 'Estimate the nutrition of this meal.' })
  } else {
    content.push({ type: 'text', text: `What I ate: ${input.text ?? ''}` })
  }
  // Photos need a closer look than a typed list.
  const effort = effortFor(model, input.image ? 'medium' : 'low')
  const res = await withExtras(model, (extras) =>
    c.beta.messages.parse(
      {
        model: model.id,
        max_tokens: 8000,
        system: FOOD_SYSTEM,
        messages: [{ role: 'user', content }],
        output_config: { ...effort, format: betaZodOutputFormat(FoodEstimateSchema) },
        ...(extras ? { betas: [FALLBACK_BETA], fallbacks: 'default' as const } : {}),
      },
      { signal },
    ),
  )
  if (res.stop_reason === 'refusal') return { ok: false, refused: true }
  if (!res.parsed_output) throw new AiError(502, 'Couldn’t read the estimate. Try again.')
  return { ok: true, estimate: cleanEstimate(res.parsed_output), model: res.model }
}

// ---- Coach chat ------------------------------------------------------------------------------

export const COACH_SYSTEM = `You are Coach, the AI coach inside Forge: a personal calisthenics, nutrition and habit app that one person uses on their phone. You help them train consistently, eat better and stay motivated, in very little time.

Who you're talking to
- A busy adult who trains at home. Unless the app context says otherwise, their equipment is bodyweight, a pair of fixed 20 lb dumbbells (and possibly one slightly heavier dumbbell they may find later), plus household items such as a chair, a sturdy table, a wall and stairs. There's no gym, barbell, machine or cable station, so never program them. A pull-up bar exists only if the context lists one.
- Sessions are short (often 10–20 minutes), so favour supersets, circuits, EMOMs and two-to-five-minute "exercise snacks" over long programs.
- Each request includes an <app_context> block from the app with their profile, goal, targets, today's plan and recent logs. Treat it as accurate app data (it may be a few minutes old) and use it to personalise answers, such as the protein left for today or the exercises in today's session. Never invent numbers that aren't there; if something important is missing, ask or answer in general terms.

How to answer
- Be warm, direct and practical, like a good personal trainer texting a client. Lead with the answer.
- Keep replies short: usually two to six sentences or a short list, under about 150 words, unless they ask for detail or a full plan.
- Write plain text for a phone screen. Short "- " bullet lists and the occasional **bold** phrase are fine; no headings, tables, code blocks or links.
- Use US units (lb, oz, cups, °F) unless they use metric.
- Give specific, doable actions: sets × reps or seconds, tempo, rest, a food with its protein grams, a time of day.
- Their dumbbells are fixed weights, so progress with reps, tempo (a three-second lowering), pauses, one-and-a-half reps, single-arm or single-leg versions, harder variations and shorter rests, not heavier weights.

What Forge can do (point them to it when useful)
- Train tab: today's session sized to their time; a Swap button on any exercise for alternatives that fit their equipment and aches; "Short on time?" for 5-, 10- or 15-minute versions; quick exercise snacks.
- Exercise library: animated, voiced tutorials with form cues, common mistakes, and easier or harder versions.
- Eat tab: food search, barcode scanning, photo or text logging with AI estimates, water tracking, a weekly meal plan with a grocery list, and a Lite mode that only tracks protein, vegetables and water.
- Progress tab: weight trend, workouts per week, calories and protein, personal records, body measurements and progress photos, plus a fitness retest every four weeks.
- More tab: reminders and notifications, training schedule, equipment, diet and other settings.
You can't change their plan, logs or settings yourself, so tell them where to tap. Forge adjusts the plan automatically from the reps they log and the "too easy / just right / too hard" feedback after each workout.

Nutrition approach
- Protein first (their daily target is in the context), plenty of vegetables and fruit, mostly minimally processed food, enough water, and a modest calorie deficit or surplus that matches the goal. No crash diets, cleanses or meal skipping as a strategy, and never suggest eating below about 1,200 kcal a day.
- Respect their diet style from the context: for example kosher-style means no pork or shellfish and never meat with dairy in the same meal; vegetarian and vegan mean what they say.
- Supplements: creatine monohydrate, vitamin D and protein powder are reasonable to mention. Don't push anything beyond the basics, and never recommend prohibited or unsafe substances.

Safety
- You're not a doctor and you don't diagnose. For sharp or worsening pain, chest pain, dizziness, fainting, or shortness of breath beyond normal effort, tell them to stop and get medical care. For persistent pain or an injury, suggest a doctor or physical therapist and offer pain-free alternatives in the meantime.
- If they mention an ache (knees, back, shoulders, wrists), choose joint-friendly options and say why.
- If they seem to be struggling with food or body image (extreme restriction, purging, compulsive exercise), respond kindly, don't give weight-loss advice, and encourage them to talk to a professional.
- Stay on fitness, nutrition, sleep, habits and using Forge. For unrelated requests, say briefly that you're their fitness coach and steer back.`

/**
 * At most `max` recent turns, starting with the user, roles alternating (neighbours merged) and
 * ending with the user's question.
 */
export function normalizeTurns(turns: ChatTurn[], max = 16): ChatTurn[] {
  const out: ChatTurn[] = []
  for (const t of turns) {
    const text = t.text.trim()
    if (!text) continue
    if (!out.length && t.role !== 'user') continue
    const last = out[out.length - 1]
    if (last && last.role === t.role) last.text += `\n\n${text}`
    else out.push({ role: t.role, text })
  }
  while (out.length && out[out.length - 1]!.role !== 'user') out.pop()
  let start = Math.max(0, out.length - max)
  while (start < out.length && out[start]!.role !== 'user') start++
  return out.slice(start)
}

/**
 * Earlier turns go back as plain text. The latest question carries a cache breakpoint so the next
 * turn re-reads the conversation from cache, and the fresh app snapshot goes after it as a
 * system message (or inside the question for models without mid-conversation system messages).
 */
export function coachMessages(turns: ChatTurn[], context: string, extras: boolean): BetaMessageParam[] {
  const ctx = `<app_context>\n${context.trim()}\n</app_context>`
  const msgs: BetaMessageParam[] = turns.map((t, i) => {
    if (i < turns.length - 1) return { role: t.role, content: t.text }
    const question = { type: 'text' as const, text: t.text, cache_control: { type: 'ephemeral' as const } }
    return { role: 'user', content: extras ? [question] : [{ type: 'text', text: ctx }, question] }
  })
  if (extras) msgs.push({ role: 'system', content: ctx })
  return msgs
}

/**
 * Streams the coach's reply. The stream is opened (and its first event read) before anything is
 * returned, so a rejected request can still be retried or turned into a normal HTTP error.
 */
export async function openCoachStream(c: Anthropic, model: ResolvedModel, turns: ChatTurn[], context: string, signal?: AbortSignal): Promise<AsyncGenerator<CoachEvent>> {
  const open = async (extras: boolean) => {
    const stream = c.beta.messages.stream(
      {
        model: model.id,
        max_tokens: 6000,
        system: [{ type: 'text', text: COACH_SYSTEM, cache_control: { type: 'ephemeral' } }],
        messages: coachMessages(turns, context, extras),
        ...(model.effort.has('low') ? { output_config: { effort: 'low' as const } } : {}),
        ...(extras ? { betas: [FALLBACK_BETA], fallbacks: 'default' as const } : {}),
      },
      { signal },
    )
    const it = stream[Symbol.asyncIterator]()
    const first = await it.next()
    return { stream, it, first }
  }
  const { stream, it, first } = await withExtras(model, open)

  async function* events(): AsyncGenerator<CoachEvent> {
    let r = first
    while (!r.done) {
      const ev = r.value
      if (ev.type === 'content_block_delta' && ev.delta.type === 'text_delta' && ev.delta.text) yield { type: 'text', text: ev.delta.text }
      r = await it.next()
    }
    const final = await stream.finalMessage()
    const u = final.usage
    console.log(`coach ${final.model} in=${u.input_tokens} cache_read=${u.cache_read_input_tokens ?? 0} cache_write=${u.cache_creation_input_tokens ?? 0} out=${u.output_tokens} stop=${final.stop_reason}`)
    // The whole chain declined (fallbacks included): the partial text must not be shown as an answer.
    if (final.stop_reason === 'refusal') yield { type: 'refusal' }
    else yield { type: 'done', truncated: final.stop_reason === 'max_tokens' || undefined, model: final.model }
  }
  return events()
}
