import webpush from 'web-push'
import type { DeviceRecord, Registry } from './registry.js'

export interface PushPayload {
  title: string
  body: string
  url: string
  tag: string
  type: string
  date?: string
  meal?: string
}

export interface Vapid {
  publicKey: string
  privateKey: string
}

/** VAPID "subject" must be a URL or mailto: — we use the app's own address, never a personal email. */
export function vapidSubject(): string {
  const host = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL || 'forge-fitness.vercel.app'
  return `https://${host.replace(/^https?:\/\//, '')}`
}

/** Keys from env when set; otherwise generated once and kept in the private registry. */
export function ensureVapid(reg: Registry): { vapid: Vapid; created: boolean } {
  const pub = process.env.VAPID_PUBLIC_KEY
  const priv = process.env.VAPID_PRIVATE_KEY
  if (pub && priv) return { vapid: { publicKey: pub, privateKey: priv }, created: false }
  if (reg.vapid) return { vapid: reg.vapid, created: false }
  const keys = webpush.generateVAPIDKeys()
  reg.vapid = { publicKey: keys.publicKey, privateKey: keys.privateKey }
  return { vapid: reg.vapid, created: true }
}

export type SendResult = 'ok' | 'gone' | 'error'

export async function sendPush(device: DeviceRecord, payload: PushPayload, vapid: Vapid): Promise<SendResult> {
  try {
    await webpush.sendNotification(device.subscription, JSON.stringify(payload), {
      vapidDetails: { subject: vapidSubject(), publicKey: vapid.publicKey, privateKey: vapid.privateKey },
      TTL: 60 * 60,
      urgency: 'normal',
      topic: payload.tag.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 32) || undefined,
    })
    return 'ok'
  } catch (e) {
    const status = (e as { statusCode?: number }).statusCode
    return status === 404 || status === 410 ? 'gone' : 'error'
  }
}
