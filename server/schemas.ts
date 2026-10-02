import { z } from 'zod'
import { isValidZone } from '../shared/reminders.js'

const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/)

export const RuleSchema = z.object({
  id: z.string().min(1).max(40),
  type: z.enum(['workout', 'streak', 'water', 'meal', 'snack', 'checkin', 'weighin', 'review', 'custom']),
  days: z.array(z.number().int().min(1).max(7)).max(7),
  times: z.array(hhmm).max(12).optional(),
  every: z.object({ start: hhmm, end: hhmm, minutes: z.number().int().min(15).max(720) }).optional(),
  enabled: z.boolean(),
  ack: z.string().max(40).optional(),
  meal: z.enum(['breakfast', 'lunch', 'dinner']).optional(),
  title: z.string().max(80).optional(),
  body: z.string().max(200).optional(),
})

export const SubscriptionSchema = z.object({
  endpoint: z.string().url().max(1000),
  expirationTime: z.number().nullable().optional(),
  keys: z.object({ p256dh: z.string().min(10).max(200), auth: z.string().min(4).max(100) }),
})

const DeviceId = z.string().regex(/^[A-Za-z0-9_-]{8,64}$/)

export const SyncSchema = z.object({
  deviceId: DeviceId,
  subscription: SubscriptionSchema,
  tz: z.string().max(64).refine(isValidZone, 'unknown time zone'),
  rules: z.array(RuleSchema).max(30),
  context: z.object({ sessionMinutes: z.number().int().min(1).max(180).optional() }).optional(),
})

export const AckSchema = z.object({
  deviceId: DeviceId,
  key: z.string().regex(/^[a-z-]{2,30}:\d{4}-\d{2}-\d{2}$/),
})

export const DeviceOnlySchema = z.object({ deviceId: DeviceId })

// ---- AI -------------------------------------------------------------------------------------

export const FoodTextSchema = z.object({ text: z.string().trim().min(2).max(500) })

/** A phone photo already shrunk to ~1024 px; ~3 MB of base64 is far more than that needs. */
export const FoodPhotoSchema = z.object({
  image: z.string().min(100).max(3_000_000).regex(/^[A-Za-z0-9+/]+={0,2}$/),
  mediaType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  note: z.string().trim().max(200).optional(),
})

export const CoachSchema = z.object({
  messages: z
    .array(z.object({ role: z.enum(['user', 'assistant']), text: z.string().max(4000) }))
    .min(1)
    .max(40),
  context: z.string().max(8000),
})

/** What the bytes actually are (the declared type is only a hint). */
export function sniffImage(base64: string): 'image/jpeg' | 'image/png' | 'image/webp' | null {
  const b = Buffer.from(base64.slice(0, 24), 'base64')
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg'
  if (b[0] === 0x89 && b.toString('latin1', 1, 4) === 'PNG') return 'image/png'
  if (b.toString('latin1', 0, 4) === 'RIFF' && b.toString('latin1', 8, 12) === 'WEBP') return 'image/webp'
  return null
}
