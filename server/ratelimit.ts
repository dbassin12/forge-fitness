/**
 * A small sliding-window limiter kept in function memory. It isn't shared between server
 * instances, so it's a guard against runaway loops and stolen codes, not an exact quota —
 * the access code and the spend limit in the Anthropic console are the real protection.
 */
const hits = new Map<string, number[]>()
const MAX_KEYS = 500

export function rateLimit(key: string, limit: number, windowMs: number, now = Date.now()): { ok: boolean; retryAfterSec: number } {
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs)
  if (recent.length >= limit) {
    hits.set(key, recent)
    return { ok: false, retryAfterSec: Math.max(1, Math.ceil((recent[0]! + windowMs - now) / 1000)) }
  }
  recent.push(now)
  hits.delete(key)
  hits.set(key, recent)
  if (hits.size > MAX_KEYS) hits.delete(hits.keys().next().value!)
  return { ok: true, retryAfterSec: 0 }
}

export function resetRateLimits(): void {
  hits.clear()
}
