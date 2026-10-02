import { beforeEach, describe, expect, it, vi } from 'vitest'

// A stand-in for the Anthropic SDK: records every request and replays scripted responses.
const sdk = vi.hoisted(() => {
  class AnthropicError extends Error {}
  class APIError extends AnthropicError {
    constructor(
      public status?: number,
      message = 'api error',
    ) {
      super(message)
    }
  }
  class BadRequestError extends APIError {}
  class AuthenticationError extends APIError {}
  class PermissionDeniedError extends APIError {}
  class NotFoundError extends APIError {}
  class RateLimitError extends APIError {}
  class InternalServerError extends APIError {}
  class APIConnectionError extends APIError {}
  class APIConnectionTimeoutError extends APIConnectionError {}
  class APIUserAbortError extends APIError {}

  const cap = (image = true) => ({
    image_input: { supported: image },
    structured_outputs: { supported: true },
    effort: { supported: true, low: { supported: true }, medium: { supported: true }, high: { supported: true }, max: { supported: true }, xhigh: null },
  })
  const state = {
    models: [] as unknown[],
    parseCalls: [] as Record<string, unknown>[],
    streamCalls: [] as Record<string, unknown>[],
    parseResult: null as unknown,
    streamEvents: [] as unknown[],
    streamStop: 'end_turn',
    /** Errors thrown by the next requests, in order (undefined = succeed). */
    failures: [] as (Error | undefined)[],
    listError: null as Error | null,
    cap,
  }

  class Anthropic {
    static AnthropicError = AnthropicError
    static APIError = APIError
    static BadRequestError = BadRequestError
    static AuthenticationError = AuthenticationError
    static PermissionDeniedError = PermissionDeniedError
    static NotFoundError = NotFoundError
    static RateLimitError = RateLimitError
    static InternalServerError = InternalServerError
    static APIConnectionError = APIConnectionError
    static APIConnectionTimeoutError = APIConnectionTimeoutError
    static APIUserAbortError = APIUserAbortError

    models = {
      list: () => {
        if (state.listError) throw state.listError
        return (async function* () {
          yield* state.models
        })()
      },
      retrieve: async (id: string) => {
        const m = (state.models as { id: string }[]).find((x) => x.id === id)
        if (!m) throw new NotFoundError(404, 'not found')
        return m
      },
    }

    beta = {
      messages: {
        parse: async (params: Record<string, unknown>) => {
          state.parseCalls.push(params)
          const err = state.failures.shift()
          if (err) throw err
          return state.parseResult
        },
        stream: (params: Record<string, unknown>) => {
          state.streamCalls.push(params)
          const err = state.failures.shift()
          const events = [...state.streamEvents]
          let i = 0
          return {
            [Symbol.asyncIterator]: () => ({
              next: async () => {
                if (err) throw err
                return i < events.length ? { done: false, value: events[i++] } : { done: true, value: undefined }
              },
            }),
            finalMessage: async () => ({ model: 'claude-opus-test', stop_reason: state.streamStop, usage: { input_tokens: 10, output_tokens: 5, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 } }),
          }
        },
      },
    }
  }
  return { Anthropic, state, AnthropicError, BadRequestError, AuthenticationError }
})

vi.mock('@anthropic-ai/sdk', () => ({ default: sdk.Anthropic }))

const { GET, POST } = await import('../../api/ai/[action].js')
const { pickModel, normalizeTurns, resetAiState, cleanEstimate } = await import('../../server/ai.js')
const { resetRateLimits } = await import('../../server/ratelimit.js')
const { sniffImage } = await import('../../server/schemas.js')

const s = sdk.state
const model = (id: string, created: string, image = true) => ({ id, display_name: id.replace(/-/g, ' '), created_at: created, type: 'model', capabilities: s.cap(image), max_tokens: 64000, max_input_tokens: 1_000_000 })
const req = (path: string, body?: unknown, code = 'letmein123') =>
  new Request(`https://forge.test/api/ai/${path}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { 'x-forge-passcode': code, 'content-type': 'application/json', 'x-forwarded-for': '203.0.113.7' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })

// A 1×1 JPEG's first bytes, padded to look like a real upload.
const JPEG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0x10, 0x4a, 0x46, 0x49, 0x46]), Buffer.alloc(200, 7)]).toString('base64')

const estimate = {
  isFood: true,
  notes: 'Assumed 1 tsp butter.',
  items: [
    { name: 'Scrambled eggs', portion: '2 large eggs', grams: 100, kcal: 182, protein: 12.6, carbs: 1.2, fat: 13.9, fiber: 0, produceServings: 0, confidence: 'high' },
    { name: 'Toast with butter', portion: '1 slice', grams: 38, kcal: 120, protein: 4, carbs: 15, fat: 4.5, fiber: 2, produceServings: 0, confidence: 'medium' },
  ],
}

beforeEach(() => {
  resetAiState()
  resetRateLimits()
  process.env.APP_PASSCODE = 'letmein123'
  process.env.ANTHROPIC_API_KEY = 'sk-test'
  delete process.env.AI_MODEL
  s.models = [
    model('claude-opus-8-1-20250805', '2025-08-05T00:00:00Z'),
    model('claude-opus-9-1', '2026-09-01T00:00:00Z'),
    model('claude-opus-9-1-fast', '2026-09-02T00:00:00Z'),
    model('claude-opus-9-2-preview-noimg', '2026-09-20T00:00:00Z', false),
    model('claude-haiku-9', '2026-09-25T00:00:00Z'),
  ]
  s.parseCalls = []
  s.streamCalls = []
  s.failures = []
  s.listError = null
  s.parseResult = { model: 'claude-opus-9-1', stop_reason: 'end_turn', parsed_output: estimate }
  s.streamEvents = [
    { type: 'message_start', message: {} },
    { type: 'content_block_start', index: 0, content_block: { type: 'thinking', thinking: '' } },
    { type: 'content_block_delta', index: 1, delta: { type: 'text_delta', text: 'Do 3 rounds ' } },
    { type: 'content_block_delta', index: 1, delta: { type: 'text_delta', text: 'of push-ups.' } },
    { type: 'message_stop' },
  ]
  s.streamStop = 'end_turn'
})

async function readEvents(res: Response): Promise<{ type: string; text?: string; error?: string }[]> {
  const text = await res.text()
  return text
    .split('\n')
    .filter(Boolean)
    .map((l) => JSON.parse(l))
}

describe('AI API', () => {
  it('reports whether AI is set up without calling Anthropic', async () => {
    const res = await GET(req('config'))
    expect(await res.json()).toEqual({ ok: true, configured: { apiKey: true, passcode: true } })
    delete process.env.ANTHROPIC_API_KEY
    expect(((await (await GET(req('config'))).json()) as { configured: { apiKey: boolean } }).configured.apiKey).toBe(false)
    expect((await GET(req('nope'))).status).toBe(404)
  })

  it('requires the access code and an API key', async () => {
    expect((await POST(req('check', {}, 'wrong'))).status).toBe(401)
    delete process.env.ANTHROPIC_API_KEY
    const res = await POST(req('check', {}))
    expect(res.status).toBe(503)
    expect(((await res.json()) as { error: string }).error).toMatch(/ANTHROPIC_API_KEY/)
    expect((await POST(req('unknown', {}))).status).toBe(404)
  })

  it('picks the newest plain Opus model that reads images, or the pinned one', async () => {
    const res = await POST(req('check', {}))
    expect(await res.json()).toEqual({ ok: true, model: 'claude opus 9 1' })
    expect(pickModel([])).toBeNull()
    resetAiState()
    process.env.AI_MODEL = 'claude-haiku-9'
    expect(await (await POST(req('check', {}))).json()).toEqual({ ok: true, model: 'claude haiku 9' })
    resetAiState()
    process.env.AI_MODEL = 'claude-missing'
    const missing = await POST(req('check', {}))
    expect(missing.status).toBe(502)
    expect(((await missing.json()) as { error: string }).error).toMatch(/AI_MODEL/)
  })

  it('turns a rejected key into a clear message', async () => {
    s.listError = new sdk.AuthenticationError(401, 'invalid x-api-key')
    const res = await POST(req('check', {}))
    expect(res.status).toBe(502)
    expect(((await res.json()) as { error: string }).error).toMatch(/API key was rejected/)
  })

  it('estimates food from text with structured output and refusal fallbacks', async () => {
    const res = await POST(req('food-text', { text: '2 eggs and toast with butter' }))
    expect(res.status).toBe(200)
    const body = (await res.json()) as { ok: boolean; estimate: typeof estimate }
    expect(body.ok).toBe(true)
    expect(body.estimate.items.map((i) => i.name)).toEqual(['Scrambled eggs', 'Toast with butter'])
    const call = s.parseCalls[0]!
    expect(call.model).toBe('claude-opus-9-1')
    expect(call.betas).toEqual(['server-side-fallback-2026-07-01'])
    expect(call.fallbacks).toBe('default')
    expect(call).not.toHaveProperty('thinking')
    expect((call.output_config as { effort: string }).effort).toBe('low')
    expect((call.output_config as { format: { type: string } }).format.type).toBe('json_schema')
    expect(JSON.stringify(call.messages)).toContain('2 eggs and toast with butter')
    expect((await POST(req('food-text', { text: 'x' }))).status).toBe(400)
  })

  it('estimates food from a photo, checking the bytes are an image', async () => {
    expect((await POST(req('food-photo', { image: Buffer.alloc(300, 1).toString('base64'), mediaType: 'image/jpeg' }))).status).toBe(400)
    const res = await POST(req('food-photo', { image: JPEG, mediaType: 'image/png', note: 'half eaten' }))
    expect(res.status).toBe(200)
    const call = s.parseCalls[0]!
    expect((call.output_config as { effort: string }).effort).toBe('medium')
    const content = (call.messages as { content: { type: string; source?: { media_type: string } }[] }[])[0]!.content
    expect(content[0]!.type).toBe('image')
    expect(content[0]!.source!.media_type).toBe('image/jpeg')
    expect(JSON.stringify(content[1])).toContain('half eaten')
  })

  it('explains an unreadable answer', async () => {
    s.failures = [new sdk.AnthropicError('Failed to parse structured output: SyntaxError')]
    const res = await POST(req('food-text', { text: 'a sandwich' }))
    expect(res.status).toBe(502)
    expect(((await res.json()) as { error: string }).error).toMatch(/couldn’t be read/)
  })

  it('reports a refusal instead of an empty estimate', async () => {
    s.parseResult = { model: 'claude-opus-9-1', stop_reason: 'refusal', parsed_output: null, stop_details: { category: null } }
    const res = await POST(req('food-text', { text: 'a sandwich' }))
    expect(res.status).toBe(422)
    expect(((await res.json()) as { refused: boolean }).refused).toBe(true)
  })

  it('retries once without the optional extras when a model rejects them, and remembers', async () => {
    s.failures = [new sdk.BadRequestError(400, 'fallbacks: not supported')]
    expect((await POST(req('food-text', { text: 'an apple' }))).status).toBe(200)
    expect(s.parseCalls).toHaveLength(2)
    expect(s.parseCalls[1]).not.toHaveProperty('fallbacks')
    expect(s.parseCalls[1]).not.toHaveProperty('betas')
    await POST(req('food-text', { text: 'a pear' }))
    expect(s.parseCalls[2]).not.toHaveProperty('fallbacks')
  })

  it('does not retry a request that is bad for other reasons', async () => {
    s.failures = [new sdk.BadRequestError(400, 'image too large'), new sdk.BadRequestError(400, 'image too large')]
    const res = await POST(req('food-text', { text: 'an apple' }))
    expect(res.status).toBe(400)
    expect(s.parseCalls).toHaveLength(2)
    s.failures = []
    await POST(req('food-text', { text: 'a pear' }))
    expect(s.parseCalls[2]).toHaveProperty('fallbacks', 'default')
  })

  it('streams the coach reply as NDJSON with a cached prompt and fresh app context', async () => {
    const res = await POST(
      req('coach', {
        messages: [
          { role: 'assistant', text: 'Hi! Ask me anything.' },
          { role: 'user', text: 'My knees hurt.' },
          { role: 'user', text: 'What can I do instead of lunges?' },
        ],
        context: 'Goal: lose fat. Protein left today: 60 g.',
      }),
    )
    expect(res.headers.get('content-type')).toMatch(/ndjson/)
    const events = await readEvents(res)
    expect(events.filter((e) => e.type === 'text').map((e) => e.text).join('')).toBe('Do 3 rounds of push-ups.')
    expect(events.at(-1)).toMatchObject({ type: 'done', model: 'claude-opus-test' })
    const call = s.streamCalls[0]!
    expect((call.system as { cache_control: unknown }[])[0]!.cache_control).toEqual({ type: 'ephemeral' })
    expect((call.output_config as { effort: string }).effort).toBe('low')
    const msgs = call.messages as { role: string; content: unknown }[]
    expect(msgs.map((m) => m.role)).toEqual(['user', 'system'])
    expect(JSON.stringify(msgs[0]!.content)).toContain('My knees hurt.\\n\\nWhat can I do instead of lunges?')
    expect(JSON.stringify(msgs[0]!.content)).toContain('ephemeral')
    expect(msgs[1]!.content).toContain('<app_context>')
    expect(msgs[1]!.content).toContain('Protein left today: 60 g.')
  })

  it('puts the context inside the question for models without the extras', async () => {
    s.failures = [new sdk.BadRequestError(400, "role 'system' is not supported")]
    const res = await POST(req('coach', { messages: [{ role: 'user', text: 'Hi' }], context: 'Goal: build muscle.' }))
    await readEvents(res)
    const msgs = s.streamCalls[1]!.messages as { role: string; content: { text: string }[] }[]
    expect(msgs.map((m) => m.role)).toEqual(['user'])
    expect(msgs[0]!.content[0]!.text).toContain('Goal: build muscle.')
    expect(msgs[0]!.content[1]!.text).toBe('Hi')
  })

  it('flags a refused coach reply so the partial text is discarded', async () => {
    s.streamStop = 'refusal'
    const events = await readEvents(await POST(req('coach', { messages: [{ role: 'user', text: 'Hi' }], context: '' })))
    expect(events.at(-1)).toEqual({ type: 'refusal' })
  })

  it('rate-limits each phone', async () => {
    for (let i = 0; i < 20; i++) expect((await POST(req('food-text', { text: 'an apple' }))).status).toBe(200)
    const res = await POST(req('food-text', { text: 'an apple' }))
    expect(res.status).toBe(429)
    expect(res.headers.get('retry-after')).toBeTruthy()
  })
})

describe('AI helpers', () => {
  it('keeps recent turns, starting with the user and ending with a question', () => {
    const turns = Array.from({ length: 21 }, (_, i) => ({ role: i % 2 ? ('assistant' as const) : ('user' as const), text: `t${i}` }))
    const out = normalizeTurns([...turns, { role: 'assistant', text: 'trailing' }], 6)
    expect(out[0]!.role).toBe('user')
    expect(out.at(-1)!.text).toBe('t20')
    expect(out.length).toBeLessThanOrEqual(6)
    expect(normalizeTurns([{ role: 'assistant', text: 'hello' }])).toEqual([])
  })

  it('clamps wild estimates', () => {
    const e = cleanEstimate({ isFood: true, notes: ' ok ', items: [{ ...estimate.items[0]!, kcal: 99999, protein: -5, grams: Number.NaN, confidence: ' High' }] })
    expect(e.items[0]).toMatchObject({ kcal: 5000, protein: 0, grams: 0, confidence: 'high' })
    expect(cleanEstimate({ ...estimate, items: [{ ...estimate.items[0]!, confidence: 'unsure' }] }).items[0]!.confidence).toBe('medium')
    expect(e.notes).toBe('ok')
  })

  it('sniffs image types from bytes', () => {
    expect(sniffImage(JPEG)).toBe('image/jpeg')
    expect(sniffImage(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).toString('base64'))).toBe('image/png')
    expect(sniffImage(Buffer.from('RIFF\0\0\0\0WEBPVP8 ').toString('base64'))).toBe('image/webp')
    expect(sniffImage(Buffer.from('GIF89a').toString('base64'))).toBeNull()
  })
})
