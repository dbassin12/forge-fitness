import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DateTime } from 'luxon'

// In-memory stand-ins for Vercel Blob and web-push.
const store = vi.hoisted(() => ({ body: null as string | null, etag: 0, writes: 0, reads: 0, sent: [] as unknown[] }))

vi.mock('@vercel/blob', () => ({
  get: vi.fn(async () => {
    store.reads++
    if (store.body === null) return null
    return { statusCode: 200, stream: new Response(store.body).body, blob: { etag: `"${store.etag}"` }, headers: new Headers() }
  }),
  put: vi.fn(async (_path: string, body: string, opts: { ifMatch?: string; allowOverwrite?: boolean }) => {
    if (opts.ifMatch && opts.ifMatch !== `"${store.etag}"`) throw new Error('precondition failed')
    if (!opts.ifMatch && store.body !== null && !opts.allowOverwrite) throw new Error('already exists')
    store.body = body
    store.etag++
    store.writes++
    return { etag: `"${store.etag}"` }
  }),
}))

vi.mock('web-push', () => ({
  default: {
    generateVAPIDKeys: () => ({ publicKey: 'BPUBLIC', privateKey: 'PRIVATE' }),
    sendNotification: vi.fn(async (sub: { endpoint: string }, payload: string) => {
      if (sub.endpoint.includes('gone')) throw Object.assign(new Error('gone'), { statusCode: 410 })
      store.sent.push(JSON.parse(payload))
      return { statusCode: 201 }
    }),
  },
}))

const { GET, POST } = await import('../../api/push/[action].js')
const { runTick } = await import('../../server/tick.js')
const { githubClaimsOk, checkPasscode } = await import('../../server/auth.js')
const { presetRules } = await import('../../shared/reminders.js')

const sub = { endpoint: 'https://push.example.com/abc', keys: { p256dh: 'p256dh-key-xxxxxxxx', auth: 'auth-secret' } }
const req = (path: string, body?: unknown, code = 'letmein123') =>
  new Request(`https://forge.test/api/push/${path}`, { method: body ? 'POST' : 'GET', headers: { 'x-forge-passcode': code, 'content-type': 'application/json' }, body: body ? JSON.stringify(body) : undefined })

beforeEach(() => {
  store.body = null
  store.etag = 0
  store.writes = 0
  store.reads = 0
  store.sent = []
  process.env.APP_PASSCODE = 'letmein123'
  process.env.BLOB_READ_WRITE_TOKEN = 'test'
})

describe('push API', () => {
  it('serves the public key (generating VAPID keys once)', async () => {
    const res = await GET(req('config'))
    expect(res.status).toBe(200)
    const body = (await res.json()) as { publicKey: string; scheduler: { githubStale: boolean } }
    expect(body.publicKey).toBe('BPUBLIC')
    expect(body.scheduler.githubStale).toBe(true)
    expect(store.writes).toBe(1)
    await GET(req('config'))
    expect(store.writes).toBe(1)
  })

  it('requires the access code', async () => {
    const res = await POST(req('sync', { deviceId: 'device-123456' }, 'wrong'))
    expect(res.status).toBe(401)
    delete process.env.APP_PASSCODE
    expect((await POST(req('sync', {}))).status).toBe(503)
  })

  it('registers a phone, validates input, acks and unsubscribes', async () => {
    const rules = presetRules('gentle', { trainingDays: [1, 3, 5], workoutTime: '07:00' })
    expect((await POST(req('sync', { deviceId: 'x', subscription: sub, tz: 'Mars/Base', rules }))).status).toBe(400)
    const ok = await POST(req('sync', { deviceId: 'device-123456', subscription: sub, tz: 'America/New_York', rules }))
    expect(ok.status).toBe(200)
    const reg = JSON.parse(store.body!)
    expect(reg.devices).toHaveLength(1)
    expect(Object.keys(reg.devices[0].lastSent).sort()).toEqual(rules.map((r) => r.id).sort())
    expect((await POST(req('ack', { deviceId: 'device-123456', key: 'workout:2026-10-05' }))).status).toBe(200)
    expect(JSON.parse(store.body!).devices[0].acks).toEqual(['workout:2026-10-05'])
    expect((await POST(req('test', { deviceId: 'device-123456' }))).status).toBe(200)
    expect(store.sent).toHaveLength(1)
    await POST(req('unsubscribe', { deviceId: 'device-123456' }))
    expect(JSON.parse(store.body!).devices).toHaveLength(0)
  })
})

describe('tick', () => {
  const NY = 'America/New_York'
  const at = (iso: string) => DateTime.fromISO(iso, { zone: NY }).toMillis()

  async function register(endpoint = sub.endpoint, id = 'device-123456') {
    const rules = presetRules('gentle', { trainingDays: [1, 3, 5], workoutTime: '07:00' })
    await POST(req('sync', { deviceId: id, subscription: { ...sub, endpoint }, tz: NY, rules }))
    // Pretend it was registered a day earlier so the watermarks are in the past.
    const reg = JSON.parse(store.body!)
    for (const d of reg.devices) for (const k of Object.keys(d.lastSent)) d.lastSent[k] = at('2026-10-04T12:00')
    store.body = JSON.stringify(reg)
  }

  it('sends due reminders once and stays quiet on idle ticks', async () => {
    await register()
    const writes = store.writes
    const r1 = await runTick(at('2026-10-05T06:52'), 'github') // Monday, workout at 06:50
    expect(r1.sent).toBe(1)
    expect((store.sent[0] as { type: string }).type).toBe('workout')
    const r2 = await runTick(at('2026-10-05T07:07'), 'github')
    expect(r2.sent).toBe(0)
    expect(r2.wrote).toBe(false)
    expect(store.writes).toBe(writes + 1)
  })

  it('honours acks and drops expired subscriptions', async () => {
    await register()
    await register('https://push.example.com/gone', 'device-gone-1')
    await POST(req('ack', { deviceId: 'device-123456', key: 'workout:2026-10-05' }))
    const r = await runTick(at('2026-10-05T19:31'), 'github') // streak saver at 19:30 → acked
    expect(r.sent).toBe(0)
    expect(r.removed).toBe(1)
    expect(JSON.parse(store.body!).devices.map((d: { id: string }) => d.id)).toEqual(['device-123456'])
  })

  it('warns once a day when the GitHub scheduler stalls', async () => {
    await register()
    await runTick(at('2026-10-05T03:00'), 'github')
    const r = await runTick(at('2026-10-05T12:00') + 10 * 3_600_000, 'vercel-cron')
    expect(r.alerted).toBe(true)
    expect(store.sent.some((p) => (p as { type: string }).type === 'health')).toBe(true)
    const again = await runTick(at('2026-10-05T12:00') + 11 * 3_600_000, 'vercel-cron')
    expect(again.alerted).toBe(false)
  })
})

describe('scheduler auth', () => {
  const good = { repository_id: '1266981387', ref: 'refs/heads/main', event_name: 'schedule', workflow_ref: 'dbassin12/mitzvah-calendar/.github/workflows/fitness-reminders.yml@refs/heads/main' }
  it('only trusts the reminders workflow on main in this repo', () => {
    expect(githubClaimsOk(good)).toBe(true)
    expect(githubClaimsOk({ ...good, ref: 'refs/heads/feature' })).toBe(false)
    expect(githubClaimsOk({ ...good, repository_id: '42' })).toBe(false)
    expect(githubClaimsOk({ ...good, event_name: 'pull_request' })).toBe(false)
    expect(githubClaimsOk({ ...good, workflow_ref: 'evil/repo/.github/workflows/x.yml@refs/heads/main' })).toBe(false)
  })

  it('locks out repeated wrong codes', () => {
    process.env.APP_PASSCODE = 'letmein123'
    const r = () => checkPasscode(new Request('https://x.test', { headers: { 'x-forge-passcode': 'nope', 'x-forwarded-for': '9.9.9.9' } }))
    for (let i = 0; i < 5; i++) expect(r().ok).toBe(false)
    const locked = r()
    expect(!locked.ok && locked.status).toBe(429)
  })
})
