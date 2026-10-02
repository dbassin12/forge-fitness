import { defaultText, dueOccurrences, localDate, type Occurrence, type ReminderRule } from '../shared/reminders.js'
import { ensureVapid, sendPush, type PushPayload, type SendResult, type Vapid } from './push.js'
import { readRegistry, writeRegistry, type DeviceRecord, type Registry } from './registry.js'

/** Idle ticks only write a heartbeat this often (Blob write budget). */
export const HEARTBEAT_MS = 3 * 60 * 60_000
/** The GitHub scheduler counts as stalled after this long without a heartbeat. */
export const STALE_MS = 6 * 60 * 60_000
export const MAX_FAILURES = 10
const ACK_DAYS = 14

export function buildPayload(rule: ReminderRule, occ: Occurrence): PushPayload {
  const t = defaultText(rule)
  return { ...t, tag: `${rule.type}-${occ.date}`, type: rule.type, date: occ.date, ...(rule.meal ? { meal: rule.meal } : {}) }
}

export interface TickDeps {
  read: typeof readRegistry
  write: typeof writeRegistry
  send: (d: DeviceRecord, p: PushPayload, v: Vapid) => Promise<SendResult>
}

export interface TickResult {
  sent: number
  removed: number
  devices: number
  wrote: boolean
  alerted: boolean
}

interface Updates {
  watermarks: Map<string, Record<string, number>>
  failures: Map<string, number>
  removed: Set<string>
}

function apply(reg: Registry, u: Updates, now: number, source: string, sent: number) {
  reg.devices = reg.devices.filter((d) => !u.removed.has(d.id))
  for (const d of reg.devices) {
    const w = u.watermarks.get(d.id)
    if (w) for (const [rule, at] of Object.entries(w)) d.lastSent[rule] = Math.max(d.lastSent[rule] ?? 0, at)
    const f = u.failures.get(d.id)
    if (f !== undefined) d.failures = f
    // Forget acks older than two weeks.
    const cutoff = localDate(now - ACK_DAYS * 86_400_000, d.tz)
    d.acks = d.acks.filter((a) => (a.split(':').pop() ?? '') >= cutoff)
  }
  reg.lastTick = { at: now, source, sent }
  reg.ticks = { ...(reg.ticks ?? {}), [source]: now }
}

/**
 * One scheduler run: send every due reminder exactly once, drop dead subscriptions, and (only when
 * something changed or the heartbeat is due) write the registry back with a conditional write.
 */
export async function runTick(now: number, source: string, deps: TickDeps = { read: readRegistry, write: writeRegistry, send: sendPush }): Promise<TickResult> {
  const { reg, etag } = await deps.read()
  const { vapid, created } = ensureVapid(reg)
  const u: Updates = { watermarks: new Map(), failures: new Map(), removed: new Set() }
  let sent = 0
  for (const d of reg.devices) {
    let failures = d.failures ?? 0
    for (const occ of dueOccurrences(d.rules, d.tz, now, d.lastSent, d.acks)) {
      const rule = d.rules.find((r) => r.id === occ.ruleId)
      if (!rule) continue
      const res = await deps.send(d, buildPayload(rule, occ), vapid)
      if (res === 'gone') {
        u.removed.add(d.id)
        break
      }
      if (res === 'ok') {
        u.watermarks.set(d.id, { ...(u.watermarks.get(d.id) ?? {}), [occ.ruleId]: occ.fireAt })
        failures = 0
        sent++
      } else failures++
    }
    if (failures !== (d.failures ?? 0)) u.failures.set(d.id, failures)
    if (failures >= MAX_FAILURES) u.removed.add(d.id)
  }

  // Dead-man check: the daily Vercel cron notices a stalled GitHub scheduler and says so (once a day).
  let alerted = false
  const githubAt = reg.ticks?.github
  if (source === 'vercel-cron' && githubAt && now - githubAt > STALE_MS && now - (reg.lastHealthAlert ?? 0) > 20 * 60 * 60_000) {
    for (const d of reg.devices) {
      if (u.removed.has(d.id)) continue
      await deps.send(
        d,
        { title: '⏰ Reminders may be late', body: 'The GitHub scheduler stopped. Open Forge → More → Reminders for the one-tap fix.', url: '/#/more/reminders', tag: 'scheduler-health', type: 'health' },
        vapid,
      )
    }
    reg.lastHealthAlert = now
    alerted = true
  }

  const changed = created || alerted || sent > 0 || u.removed.size > 0 || u.failures.size > 0
  const heartbeatDue = now - (reg.ticks?.[source] ?? 0) >= HEARTBEAT_MS
  if (!changed && !heartbeatDue) return { sent, removed: 0, devices: reg.devices.length, wrote: false, alerted }

  apply(reg, u, now, source, sent)
  try {
    await deps.write(reg, etag)
  } catch {
    // Someone (the phone) wrote in between: merge our watermarks into the fresh copy instead of resending.
    const fresh = await deps.read()
    if (created && !fresh.reg.vapid) fresh.reg.vapid = reg.vapid
    if (alerted) fresh.reg.lastHealthAlert = now
    apply(fresh.reg, u, now, source, sent)
    await deps.write(fresh.reg, fresh.etag)
  }
  return { sent, removed: u.removed.size, devices: reg.devices.length, wrote: true, alerted }
}
