import { useLiveQuery } from 'dexie-react-hooks'
import { buildReminderCalendar, calendarConfig, encodeCalendarConfig, eventCount, eventText, firstOn, type CalendarConfig } from '@shared/calendar'
import { ruleTimes } from '@shared/reminder-rules'
import { APP } from '@/app/brand'
import { isIOS } from '@/app/pwa'
import { usePrefs } from '@/app/prefs'
import { kvGet, kvSet } from '@/db/db'
import type { Profile } from '@/domain/types'
import { todayISO } from '@/lib/dates'
import { downloadBlob } from './backup'
import type { ReminderSettings } from './reminders'

/** "calendar" = phone reminders through the phone's calendar (no setup); "push" = smart notifications (server). */
export type ReminderMode = 'calendar' | 'push'

export interface CalendarExport {
  at: number
  /** Fingerprint of what was exported, to spot changes since. */
  key: string
  events: number
}

const MODE_KEY = 'reminders.mode'
export const CALENDAR_KEY = 'reminders.calendar'

export function useReminderMode(pushEnabled: boolean | undefined): ReminderMode | undefined {
  return useLiveQuery(async () => (await kvGet<ReminderMode>(MODE_KEY)) ?? (pushEnabled ? 'push' : 'calendar'), [pushEnabled])
}

export async function setReminderMode(mode: ReminderMode): Promise<void> {
  await kvSet(MODE_KEY, mode)
}

export function useCalendarExport(): CalendarExport | null | undefined {
  return useLiveQuery(async () => (await kvGet<CalendarExport>(CALENDAR_KEY)) ?? null, [])
}

export function configFor(settings: ReminderSettings, profile: Profile): CalendarConfig {
  return calendarConfig({ rules: settings.rules, minutes: profile.sessionMinutes, coach: usePrefs.getState().coach, from: todayISO(), app: APP.id })
}

/** What matters for "has anything changed since you added it" (not the start date). */
export function configKey(cfg: CalendarConfig): string {
  return JSON.stringify([cfg.rules, cfg.minutes, cfg.coach ?? null, cfg.app ?? null])
}

/**
 * Put the reminders in the phone's calendar. Call it straight from a tap: on iPhone it opens
 * Calendar's "Add All" screen through a link (the Home Screen app can't import files itself);
 * elsewhere it downloads the .ics file.
 */
export function addRemindersToCalendar(settings: ReminderSettings, profile: Profile): 'opened' | 'downloaded' | 'offline' | 'empty' {
  const cfg = configFor(settings, profile)
  if (!cfg.rules.length) return 'empty'
  let how: 'opened' | 'downloaded'
  if (isIOS()) {
    if (!navigator.onLine) return 'offline'
    window.open(`/api/calendar?c=${encodeCalendarConfig(cfg)}`, '_blank')
    how = 'opened'
  } else {
    const ics = buildReminderCalendar({ ...cfg, origin: location.origin })
    downloadBlob(new Blob([ics], { type: 'text/calendar;charset=utf-8' }), `${APP.id}-reminders.ics`)
    how = 'downloaded'
  }
  void kvSet(CALENDAR_KEY, { at: Date.now(), key: configKey(cfg), events: eventCount(cfg) } satisfies CalendarExport)
  return how
}

/** One-tap alternative for Google Calendar users: the workout reminder as a repeating event. */
export function googleCalendarLink(settings: ReminderSettings, profile: Profile): string | null {
  const cfg = configFor(settings, profile)
  const rule = cfg.rules.find((r) => r.type === 'workout')
  const time = rule ? ruleTimes(rule as Parameters<typeof ruleTimes>[0])[0] : undefined
  if (!rule || !time) return null
  const date = firstOn(cfg.from, rule.days).replace(/-/g, '')
  const [h, m] = time.split(':').map(Number)
  const endMin = h * 60 + m + Math.max(5, cfg.minutes)
  const pad = (n: number) => String(n).padStart(2, '0')
  const start = `${date}T${pad(h)}${pad(m)}00`
  const end = `${date}T${pad(Math.floor(endMin / 60) % 24)}${pad(endMin % 60)}00`
  const codes = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU']
  const text = eventText(rule, cfg.coach, cfg.app)
  const q = new URLSearchParams({
    action: 'TEMPLATE',
    text: text.title,
    details: `${text.body}\n\nOpen ${APP.name}: ${location.origin}/${text.url.replace(/^\//, '')}`,
    dates: `${start}/${end}`,
    recur: `RRULE:FREQ=WEEKLY;BYDAY=${rule.days.map((d) => codes[d - 1]).join(',')}`,
  })
  return `https://calendar.google.com/calendar/render?${q.toString()}`
}

/** Calendar reminders are set up and still match the current settings. */
export function calendarUpToDate(exp: CalendarExport | null | undefined, settings: ReminderSettings | undefined, profile: Profile | undefined): boolean {
  return !!exp && !!settings && !!profile && exp.key === configKey(configFor(settings, profile))
}
