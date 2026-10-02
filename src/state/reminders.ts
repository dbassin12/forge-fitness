import { useLiveQuery } from 'dexie-react-hooks'
import { kvGet, kvSet } from '@/db/db'
import type { Profile } from '@/domain/types'
import { isIOS, isStandalone } from '@/app/pwa'
import { uid } from '@/lib/id'
import { presetRules, type ReminderRule } from '@shared/reminder-rules'

export type ReminderStyleChoice = 'gentle' | 'coach' | 'custom'

export interface ReminderSettings {
  /** Push reminders switched on (subscribed and registered with the server). */
  enabled: boolean
  style: ReminderStyleChoice
  rules: ReminderRule[]
  deviceId: string
  lastSyncAt?: number
  lastSyncedHash?: string
}

const KEY = 'reminders'

export function defaultReminderSettings(profile: Profile): ReminderSettings {
  const style = profile.reminderStyle === 'coach' ? 'coach' : 'gentle'
  return { enabled: false, style, rules: presetRules(style, { trainingDays: profile.trainingDays, workoutTime: profile.preferredTime }), deviceId: uid('dev').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 40) }
}

export function useReminderSettings(profile: Profile | null | undefined): ReminderSettings | undefined {
  return useLiveQuery(async () => {
    if (!profile) return undefined
    return (await kvGet<ReminderSettings>(KEY)) ?? defaultReminderSettings(profile)
  }, [profile])
}

export async function loadReminderSettings(profile: Profile): Promise<ReminderSettings> {
  return (await kvGet<ReminderSettings>(KEY)) ?? defaultReminderSettings(profile)
}

export async function saveReminderSettings(s: ReminderSettings): Promise<void> {
  await kvSet(KEY, s)
}

// ---- Access code (shared with the AI coach) -----------------------------------------------

export function usePasscode(): string | null | undefined {
  return useLiveQuery(async () => (await kvGet<{ passcode?: string }>('auth'))?.passcode ?? null, [])
}

export async function getPasscode(): Promise<string | undefined> {
  return (await kvGet<{ passcode?: string }>('auth'))?.passcode
}

export async function setPasscode(passcode: string | null): Promise<void> {
  await kvSet('auth', passcode ? { passcode } : {})
}

// ---- Server calls ---------------------------------------------------------------------------

export interface PushConfig {
  ok: boolean
  error?: string
  publicKey?: string
  configured?: { blob: boolean; passcode: boolean; cronSecret?: boolean }
  scheduler?: { lastTick: { at: number; source: string; sent: number } | null; ticks: Record<string, number>; githubStale: boolean }
  devices?: number
}

export async function fetchPushConfig(): Promise<PushConfig> {
  try {
    const res = await fetch('/api/push/config', { cache: 'no-store' })
    const body = (await res.json().catch(() => null)) as PushConfig | null
    if (!body) return { ok: false, error: "The reminder server isn't available here yet. It starts working once Forge is deployed on Vercel." }
    return res.ok ? body : { ...body, ok: false, error: body.error ?? `Server error (${res.status})` }
  } catch {
    return { ok: false, error: "Can't reach the Forge server. Check your connection." }
  }
}

async function post(path: string, body: unknown): Promise<{ ok: boolean; status: number; error?: string }> {
  const passcode = await getPasscode()
  try {
    const res = await fetch(`/api/push/${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forge-passcode': passcode ?? '' },
      body: JSON.stringify(body),
    })
    const json = (await res.json().catch(() => ({}))) as { error?: string }
    return { ok: res.ok, status: res.status, error: json.error }
  } catch {
    return { ok: false, status: 0, error: "Can't reach the Forge server." }
  }
}

export type PushSupport = { ok: true } | { ok: false; reason: 'ios-install' | 'unsupported' | 'denied' }

export function pushSupport(): PushSupport {
  if (isIOS() && !isStandalone()) return { ok: false, reason: 'ios-install' }
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return { ok: false, reason: 'unsupported' }
  if (Notification.permission === 'denied') return { ok: false, reason: 'denied' }
  return { ok: true }
}

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(b64)
  const out = new Uint8Array(new ArrayBuffer(raw.length))
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out
}

const hash = (s: unknown) => JSON.stringify(s)

/** Register (or refresh) this phone with the server. */
export async function syncPush(s: ReminderSettings, profile: Profile, force = false): Promise<{ ok: boolean; error?: string }> {
  if (!s.enabled) return { ok: true }
  const reg = await navigator.serviceWorker.ready
  const sub = await reg.pushManager.getSubscription()
  if (!sub) return { ok: false, error: 'Notifications were switched off for this app. Turn reminders on again.' }
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
  const payload = { deviceId: s.deviceId, subscription: sub.toJSON(), tz, rules: s.rules, context: { sessionMinutes: profile.sessionMinutes } }
  const h = hash(payload)
  // Only talk to the server when something changed, plus a weekly heartbeat.
  if (!force && s.lastSyncedHash === h && Date.now() - (s.lastSyncAt ?? 0) < 7 * 86_400_000) return { ok: true }
  const r = await post('sync', payload)
  if (r.ok) await saveReminderSettings({ ...s, lastSyncAt: Date.now(), lastSyncedHash: h })
  return { ok: r.ok, error: r.error }
}

export async function enablePush(s: ReminderSettings, profile: Profile): Promise<{ ok: boolean; error?: string }> {
  const support = pushSupport()
  if (!support.ok) return { ok: false, error: support.reason === 'ios-install' ? 'Add Forge to your Home Screen first.' : support.reason === 'denied' ? 'Notifications are blocked in your settings.' : 'This browser cannot receive push notifications.' }
  const perm = await Notification.requestPermission()
  if (perm !== 'granted') return { ok: false, error: 'Notifications were not allowed.' }
  const cfg = await fetchPushConfig()
  if (!cfg.ok || !cfg.publicKey) return { ok: false, error: cfg.error ?? 'Server not ready.' }
  const reg = await navigator.serviceWorker.ready
  if (!(await reg.pushManager.getSubscription())) {
    await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(cfg.publicKey) })
  }
  const next = { ...s, enabled: true }
  const r = await syncPush(next, profile, true)
  if (r.ok) await saveReminderSettings({ ...next, lastSyncAt: Date.now() })
  return r
}

export async function disablePush(s: ReminderSettings): Promise<void> {
  await post('unsubscribe', { deviceId: s.deviceId })
  try {
    const reg = await navigator.serviceWorker.ready
    await (await reg.pushManager.getSubscription())?.unsubscribe()
  } catch {
    /* ignore */
  }
  await saveReminderSettings({ ...s, enabled: false, lastSyncedHash: undefined })
}

export async function sendTestPush(s: ReminderSettings): Promise<{ ok: boolean; error?: string }> {
  const r = await post('test', { deviceId: s.deviceId })
  return { ok: r.ok, error: r.error }
}

/** "Done for today" — silences reminders tied to it (fire-and-forget; only when push is on). */
export async function ackReminder(kind: 'workout' | 'water' | 'weighin' | 'meal-lunch' | 'meal-dinner', date: string): Promise<void> {
  const s = await kvGet<ReminderSettings>(KEY)
  if (!s?.enabled) return
  const sent = (await kvGet<string[]>('reminders.acked')) ?? []
  const key = `${kind}:${date}`
  if (sent.includes(key)) return
  const r = await post('ack', { deviceId: s.deviceId, key })
  if (r.ok) await kvSet('reminders.acked', [...sent, key].slice(-60))
}
