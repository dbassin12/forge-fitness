import { buildReminderCalendar, decodeCalendarConfig } from '../shared/calendar.js'

/**
 * /api/calendar?c=<reminders>  GET — the phone's reminders as a calendar file.
 * Stateless: everything comes from the link, nothing is stored, no access code needed. Opening it
 * on an iPhone shows Calendar's "Add All" screen (the Home Screen app can't import files itself).
 */
export function GET(req: Request): Response {
  const url = new URL(req.url)
  const cfg = decodeCalendarConfig(url.searchParams.get('c') ?? '')
  if (!cfg || !cfg.rules.length) {
    return new Response('This reminders link is incomplete. Open Forge → Settings → Reminders and tap "Add to my calendar" again.', {
      status: 400,
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
    })
  }
  // Event links always point back at this deployment, never at anything taken from the URL.
  const ics = buildReminderCalendar({ ...cfg, origin: url.origin })
  return new Response(ics, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'inline; filename="forge-reminders.ics"',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
