import { checkPasscode } from '../../server/auth.js'
import { ensureVapid, sendPush } from '../../server/push.js'
import { MAX_DEVICES, readRegistry, updateRegistry, type DeviceRecord } from '../../server/registry.js'
import { AckSchema, DeviceOnlySchema, SyncSchema } from '../../server/schemas.js'
import { STALE_MS } from '../../server/tick.js'

/**
 * /api/push/config       GET  — public VAPID key + scheduler health (no auth)
 * /api/push/sync         POST — register/refresh this phone: subscription, time zone, rules
 * /api/push/ack          POST — "done for today" (e.g. workout:2026-10-05) silences related reminders
 * /api/push/test         POST — send a test notification right now
 * /api/push/unsubscribe  POST — forget this phone
 * POSTs require the x-forge-passcode header (APP_PASSCODE).
 */

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } })

function actionOf(req: Request): string {
  return new URL(req.url).pathname.split('/').filter(Boolean).pop() ?? ''
}

export async function GET(req: Request): Promise<Response> {
  if (actionOf(req) !== 'config') return json({ error: 'not found' }, 404)
  if (!process.env.BLOB_READ_WRITE_TOKEN && !process.env.BLOB_STORE_ID) {
    return json({ ok: false, error: 'Blob storage is not connected to this project yet.', configured: { blob: false, passcode: !!process.env.APP_PASSCODE } }, 503)
  }
  const publicKey = await updateRegistry((reg) => {
    const { vapid, created } = ensureVapid(reg)
    return { result: vapid.publicKey, changed: created }
  })
  const { reg } = await readRegistry()
  const now = Date.now()
  const github = reg.ticks?.github
  return json({
    ok: true,
    publicKey,
    configured: { blob: true, passcode: !!process.env.APP_PASSCODE, cronSecret: !!process.env.CRON_SECRET },
    scheduler: { lastTick: reg.lastTick ?? null, ticks: reg.ticks ?? {}, githubStale: !github || now - github > STALE_MS },
    devices: reg.devices.length,
  })
}

export async function POST(req: Request): Promise<Response> {
  const action = actionOf(req)
  const auth = checkPasscode(req)
  if (!auth.ok) return json({ error: auth.error }, auth.status)
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return json({ error: 'invalid JSON' }, 400)
  }
  const now = Date.now()

  if (action === 'sync') {
    const parsed = SyncSchema.safeParse(body)
    if (!parsed.success) return json({ error: 'invalid request', issues: parsed.error.issues.slice(0, 5) }, 400)
    const s = parsed.data
    const result = await updateRegistry((reg) => {
      let d = reg.devices.find((x) => x.id === s.deviceId || x.subscription.endpoint === s.subscription.endpoint)
      if (!d) {
        if (reg.devices.length >= MAX_DEVICES) {
          // Make room by forgetting the phone that checked in longest ago.
          reg.devices.sort((a, b) => a.lastSeenAt - b.lastSeenAt).shift()
        }
        d = { id: s.deviceId, subscription: s.subscription, tz: s.tz, rules: [], lastSent: {}, acks: [], createdAt: now, updatedAt: now, lastSeenAt: now, failures: 0 } satisfies DeviceRecord
        reg.devices.push(d)
      }
      // New or edited rules start their watermark now, so changes never fire a backlog.
      for (const r of s.rules) {
        const old = d.rules.find((x) => x.id === r.id)
        if (!old || JSON.stringify(old) !== JSON.stringify(r)) d.lastSent[r.id] = now
      }
      d.id = s.deviceId
      d.subscription = s.subscription
      d.tz = s.tz
      d.rules = s.rules
      d.context = s.context
      d.updatedAt = now
      d.lastSeenAt = now
      d.failures = 0
      return { result: { ok: true, devices: reg.devices.length }, changed: true }
    })
    return json(result)
  }

  if (action === 'ack') {
    const parsed = AckSchema.safeParse(body)
    if (!parsed.success) return json({ error: 'invalid request' }, 400)
    const { deviceId, key } = parsed.data
    const found = await updateRegistry((reg) => {
      const d = reg.devices.find((x) => x.id === deviceId)
      if (!d) return { result: false, changed: false }
      if (d.acks.includes(key)) return { result: true, changed: false }
      d.acks = [...d.acks, key].slice(-40)
      d.lastSeenAt = now
      return { result: true, changed: true }
    })
    return json({ ok: found }, found ? 200 : 404)
  }

  if (action === 'test') {
    const parsed = DeviceOnlySchema.safeParse(body)
    if (!parsed.success) return json({ error: 'invalid request' }, 400)
    const { reg } = await readRegistry()
    const d = reg.devices.find((x) => x.id === parsed.data.deviceId)
    if (!d) return json({ error: 'This phone is not registered yet — turn reminders on first.' }, 404)
    const { vapid } = ensureVapid(reg)
    const res = await sendPush(d, { title: '✅ Forge reminders are on', body: "This is a test. You'll get your reminders right here.", url: '/#/more/reminders', tag: 'test', type: 'test' }, vapid)
    if (res === 'gone') {
      await updateRegistry((r) => {
        r.devices = r.devices.filter((x) => x.id !== d.id)
        return { result: null, changed: true }
      })
      return json({ error: 'This phone’s push subscription expired. Turn reminders off and on again.' }, 410)
    }
    return json({ ok: res === 'ok' }, res === 'ok' ? 200 : 502)
  }

  if (action === 'unsubscribe') {
    const parsed = DeviceOnlySchema.safeParse(body)
    if (!parsed.success) return json({ error: 'invalid request' }, 400)
    await updateRegistry((reg) => {
      const before = reg.devices.length
      reg.devices = reg.devices.filter((x) => x.id !== parsed.data.deviceId)
      return { result: null, changed: reg.devices.length !== before }
    })
    return json({ ok: true })
  }

  return json({ error: 'not found' }, 404)
}
