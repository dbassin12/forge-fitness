import { authorizeTick } from '../server/auth.js'
import { runTick } from '../server/tick.js'

/**
 * The reminder clock. Called every 15 minutes by the GitHub Actions workflow (OIDC token), daily by
 * the Vercel cron as a safety net, or by cron-job.org with CRON_SECRET for minute-exact timing.
 */
async function handle(req: Request): Promise<Response> {
  const auth = await authorizeTick(req)
  if (!auth.ok) return Response.json({ error: auth.error }, { status: auth.status })
  if (!process.env.BLOB_READ_WRITE_TOKEN && !process.env.BLOB_STORE_ID) return Response.json({ error: 'Blob storage is not connected' }, { status: 503 })
  const result = await runTick(Date.now(), auth.source)
  return Response.json({ ok: true, source: auth.source, ...result }, { headers: { 'Cache-Control': 'no-store' } })
}

export const GET = handle
export const POST = handle
