import { get, put } from '@vercel/blob'
import type { ReminderRule } from '../shared/reminders.js'

export interface PushSub {
  endpoint: string
  expirationTime?: number | null
  keys: { p256dh: string; auth: string }
}

export interface DeviceRecord {
  id: string
  subscription: PushSub
  tz: string
  rules: ReminderRule[]
  /** Per rule: fire time of the last occurrence sent (the watermark). */
  lastSent: Record<string, number>
  /** Recent acknowledgements like "workout:2026-10-05". */
  acks: string[]
  createdAt: number
  updatedAt: number
  lastSeenAt: number
  failures: number
  context?: { sessionMinutes?: number }
}

export interface Registry {
  version: 1
  devices: DeviceRecord[]
  lastTick?: { at: number; source: string; sent: number }
  /** Last recorded run per scheduler ("github", "vercel-cron", "cron"). */
  ticks?: Record<string, number>
  lastHealthAlert?: number
  /** Generated VAPID keys (used when the env doesn't provide them). */
  vapid?: { publicKey: string; privateKey: string }
}

export const MAX_DEVICES = 5

export function registryPath(): string {
  return `push/${process.env.VERCEL_ENV ?? 'development'}/registry.json`
}

export function emptyRegistry(): Registry {
  return { version: 1, devices: [] }
}

/** Fresh read straight from origin storage (bypassing the CDN cache). */
export async function readRegistry(): Promise<{ reg: Registry; etag?: string }> {
  const res = await get(registryPath(), { access: 'private', useCache: false })
  if (!res || res.statusCode !== 200) return { reg: emptyRegistry() }
  const text = await new Response(res.stream).text()
  const parsed = JSON.parse(text) as Registry
  return { reg: { ...emptyRegistry(), ...parsed, devices: parsed.devices ?? [] }, etag: res.blob.etag }
}

/** Conditional write: fails if someone else changed the file since we read it. */
export async function writeRegistry(reg: Registry, etag?: string): Promise<void> {
  await put(registryPath(), JSON.stringify(reg), {
    access: 'private',
    contentType: 'application/json',
    addRandomSuffix: false,
    cacheControlMaxAge: 60,
    ...(etag ? { ifMatch: etag } : { allowOverwrite: false }),
  })
}

/**
 * Read → modify → conditional write, retried once on a concurrent change. `fn` returns
 * `{ changed: false }` to skip the write (keeps Blob operations to a minimum).
 */
export async function updateRegistry<T>(fn: (reg: Registry) => Promise<{ result: T; changed: boolean }> | { result: T; changed: boolean }): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    const { reg, etag } = await readRegistry()
    const { result, changed } = await fn(reg)
    if (!changed) return result
    try {
      await writeRegistry(reg, etag)
      return result
    } catch (e) {
      if (attempt >= 1) throw e
    }
  }
}
