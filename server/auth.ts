import { createHash, timingSafeEqual } from 'node:crypto'
import { createRemoteJWKSet, jwtVerify } from 'jose'

export function safeEqual(a: string, b: string): boolean {
  const ha = createHash('sha256').update(a).digest()
  const hb = createHash('sha256').update(b).digest()
  return timingSafeEqual(ha, hb)
}

export type AuthResult = { ok: true } | { ok: false; status: number; error: string }

const failures = new Map<string, { n: number; until: number }>()

export function clientIp(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown'
}

/** The phone proves it's David's by sending the access code he set as APP_PASSCODE. */
export function checkPasscode(req: Request): AuthResult {
  const expected = process.env.APP_PASSCODE
  if (!expected) return { ok: false, status: 503, error: 'Server not set up yet: add APP_PASSCODE in the Vercel project settings.' }
  const ip = clientIp(req)
  const f = failures.get(ip)
  if (f && f.until > Date.now()) return { ok: false, status: 429, error: 'Too many wrong codes. Try again in a few minutes.' }
  const given = req.headers.get('x-forge-passcode') ?? ''
  if (given && safeEqual(given, expected)) {
    failures.delete(ip)
    return { ok: true }
  }
  const n = (f?.n ?? 0) + 1
  failures.set(ip, { n, until: n >= 5 ? Date.now() + 10 * 60_000 : 0 })
  return { ok: false, status: 401, error: 'Wrong access code.' }
}

const GITHUB_ISSUER = 'https://token.actions.githubusercontent.com'
const jwks = createRemoteJWKSet(new URL(`${GITHUB_ISSUER}/.well-known/jwks`))

export const OIDC_AUDIENCE = 'forge-fitness'
/** dbassin12/forge-fitness (the id survives renames and transfers). */
export const DEFAULT_REPOSITORY_ID = '1402038559'
export const WORKFLOW_PATH = '.github/workflows/fitness-reminders.yml'

export interface GithubClaims {
  repository?: string
  repository_id?: string
  ref?: string
  event_name?: string
  workflow_ref?: string
}

/** Pure claim checks (signature, issuer and audience are verified by jose). */
export function githubClaimsOk(c: GithubClaims, repositoryId = process.env.GITHUB_REPOSITORY_ID ?? DEFAULT_REPOSITORY_ID): boolean {
  return (
    c.repository_id === repositoryId &&
    c.ref === 'refs/heads/main' &&
    (c.event_name === 'schedule' || c.event_name === 'workflow_dispatch') &&
    !!c.workflow_ref &&
    c.workflow_ref.endsWith(`/${WORKFLOW_PATH}@refs/heads/main`)
  )
}

/**
 * Who may run the reminder tick: the GitHub Actions workflow in this repo (short-lived OIDC token,
 * nothing to configure) or anything holding CRON_SECRET (Vercel cron, cron-job.org).
 */
export async function authorizeTick(req: Request): Promise<{ ok: true; source: string } | { ok: false; status: number; error: string }> {
  const h = req.headers.get('authorization') ?? ''
  if (!h.startsWith('Bearer ')) return { ok: false, status: 401, error: 'missing bearer token' }
  const token = h.slice(7).trim()
  const secret = process.env.CRON_SECRET
  if (secret && safeEqual(token, secret)) {
    const ua = req.headers.get('user-agent') ?? ''
    return { ok: true, source: ua.includes('vercel-cron') ? 'vercel-cron' : 'cron' }
  }
  if (token.split('.').length === 3) {
    try {
      const { payload } = await jwtVerify(token, jwks, { issuer: GITHUB_ISSUER, audience: OIDC_AUDIENCE })
      if (githubClaimsOk(payload as GithubClaims)) return { ok: true, source: 'github' }
      return { ok: false, status: 403, error: 'token is not from the reminders workflow on main' }
    } catch {
      return { ok: false, status: 401, error: 'invalid token' }
    }
  }
  return { ok: false, status: 401, error: 'invalid token' }
}
