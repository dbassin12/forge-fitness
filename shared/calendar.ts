/**
 * "Phone reminders" without any server setup: every enabled reminder becomes a repeating event
 * with an alert in the phone's own calendar, which then notifies even when Forge is closed.
 * Shared by the app (direct download) and /api/calendar (opens the iPhone "Add All" screen).
 */
import { defaultText, parseTime, ruleTimes, type ReminderRule, type ReminderType } from './reminder-rules.js'

export type CoachVoice = 'hype' | 'calm' | 'drill' | 'zen'

export interface CalendarRule {
  id: string
  type: Exclude<ReminderType, 'custom'>
  days: number[]
  times?: string[]
  every?: { start: string; end: string; minutes: number }
  meal?: 'breakfast' | 'lunch' | 'dinner'
}

export interface CalendarConfig {
  v: 1
  /** Enabled reminders only. */
  rules: CalendarRule[]
  /** Workout length (the workout event lasts this long). */
  minutes: number
  coach?: CoachVoice
  /** First local date to schedule from (YYYY-MM-DD, the phone's today). */
  from: string
}

const DAY_CODES = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU']
const TYPES: CalendarRule['type'][] = ['workout', 'streak', 'water', 'meal', 'snack', 'checkin', 'weighin', 'review']
const pad = (n: number) => String(n).padStart(2, '0')

export function escText(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n')
}

/** Fold lines longer than 75 octets (continuation lines start with a space). */
export function fold(line: string): string {
  const enc = new TextEncoder()
  if (enc.encode(line).length <= 75) return line
  const out: string[] = []
  let cur = ''
  let size = 0
  for (const ch of line) {
    const n = enc.encode(ch).length
    if (size + n > (out.length ? 74 : 75)) {
      out.push(cur)
      cur = ''
      size = 0
    }
    cur += ch
    size += n
  }
  out.push(cur)
  return out.join('\r\n ')
}

function stamp(d: Date): string {
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
}

/** ISO weekday (1 = Monday) of a YYYY-MM-DD date. */
function weekday(date: string): number {
  const [y, m, d] = date.split('-').map(Number)
  const wd = new Date(Date.UTC(y, m - 1, d)).getUTCDay()
  return wd === 0 ? 7 : wd
}

function addDays(date: string, n: number): string {
  const [y, m, d] = date.split('-').map(Number)
  const t = new Date(Date.UTC(y, m - 1, d + n))
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`
}

/** The first date on or after `from` that falls on one of `days`. */
export function firstOn(from: string, days: number[]): string {
  for (let k = 0; k < 7; k++) {
    const d = addDays(from, k)
    if (days.includes(weekday(d))) return d
  }
  return from
}

const VOICE: Record<CoachVoice, { workout: string; streak: string }> = {
  hype: { workout: '🔥 Workout time — let’s go!', streak: '🔥 Trained today? If not, 5 minutes keeps the fire alive!' },
  calm: { workout: '🙂 Workout time, whenever you’re ready', streak: '🙂 Trained today? A gentle 5 minutes still counts.' },
  drill: { workout: '🪖 Workout time. Move it, recruit!', streak: '🪖 No workout yet? Five minutes. Now.' },
  zen: { workout: '🧘 Time to move. Breathe, then begin.', streak: '🧘 Trained today? Five mindful minutes keep your rhythm.' },
}

/** Calendar wording: the streak saver can't know if you trained, so it asks. */
export function eventText(rule: CalendarRule, coach?: CoachVoice): { title: string; body: string; url: string } {
  const base = defaultText(rule)
  if (rule.type === 'workout') return { ...base, title: coach ? VOICE[coach].workout : '💪 Workout time', body: "Open Forge and tap Start. Short on time? The 5- or 10-minute version still counts." }
  if (rule.type === 'streak') return { ...base, title: coach ? VOICE[coach].streak : '🔥 Trained today? If not, 5 minutes saves your streak', body: 'Skip this one if you already worked out. Even a 5-minute express workout counts.' }
  return base
}

/** One VEVENT per reminder time, repeating on the rule's days, with an alert when it starts. */
export function buildReminderCalendar(cfg: CalendarConfig & { origin: string }, now = new Date()): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Forge//Phone reminders//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Forge reminders',
  ]
  for (const rule of cfg.rules) {
    const days = [...new Set(rule.days)].filter((d) => d >= 1 && d <= 7).sort()
    if (!days.length) continue
    const text = eventText(rule, cfg.coach)
    const link = `${cfg.origin}/${text.url.replace(/^\//, '')}`
    const length = rule.type === 'workout' ? Math.max(5, Math.min(120, Math.round(cfg.minutes))) : 5
    const rrule = days.length === 7 ? 'FREQ=DAILY' : `FREQ=WEEKLY;BYDAY=${days.map((d) => DAY_CODES[d - 1]).join(',')}`
    const start = firstOn(cfg.from, days)
    for (const time of ruleTimes(rule as ReminderRule)) {
      const t = parseTime(time)
      if (!t) continue
      lines.push(
        'BEGIN:VEVENT',
        `UID:forge-${rule.id}-${time.replace(':', '')}@forge-fitness`,
        `DTSTAMP:${stamp(now)}`,
        // Floating local time: rings at this clock time wherever the phone is.
        `DTSTART:${start.replace(/-/g, '')}T${pad(t.hour)}${pad(t.minute)}00`,
        `DURATION:PT${length}M`,
        `RRULE:${rrule}`,
        `SUMMARY:${escText(text.title)}`,
        `DESCRIPTION:${escText(`${text.body}\n\nOpen Forge: ${link}`)}`,
        `URL:${link}`,
        'CATEGORIES:Forge',
        'TRANSP:TRANSPARENT',
        'BEGIN:VALARM',
        'ACTION:DISPLAY',
        `DESCRIPTION:${escText(text.title)}`,
        'TRIGGER:PT0M',
        'END:VALARM',
        'END:VEVENT',
      )
    }
  }
  lines.push('END:VCALENDAR')
  return lines.map(fold).join('\r\n') + '\r\n'
}

/** Only what the calendar needs from the reminder settings (enabled, non-custom rules). */
export function calendarConfig(o: { rules: ReminderRule[]; minutes: number; coach?: CoachVoice; from: string }): CalendarConfig {
  return {
    v: 1,
    rules: o.rules
      .filter((r): r is ReminderRule & { type: CalendarRule['type'] } => r.enabled && r.type !== 'custom')
      .map(({ id, type, days, times, every, meal }) => ({ id, type, days, ...(times ? { times } : {}), ...(every ? { every } : {}), ...(meal ? { meal } : {}) })),
    minutes: o.minutes,
    ...(o.coach ? { coach: o.coach } : {}),
    from: o.from,
  }
}

/** Number of calendar events (reminder series) a config makes. */
export function eventCount(cfg: CalendarConfig): number {
  return cfg.rules.reduce((n, r) => n + ruleTimes(r as ReminderRule).length, 0)
}

// ---- Compact link encoding (base64url JSON) -----------------------------------------------------

export function encodeCalendarConfig(cfg: CalendarConfig): string {
  const bytes = new TextEncoder().encode(JSON.stringify(cfg))
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/
const DATE = /^\d{4}-\d{2}-\d{2}$/
const ID = /^[A-Za-z0-9_-]{1,40}$/

/** Parse and validate a link's config; null when anything is off (it comes from a URL). */
export function decodeCalendarConfig(s: string): CalendarConfig | null {
  if (!s || s.length > 6000) return null
  try {
    const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/'))
    const raw = JSON.parse(new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)))) as Partial<CalendarConfig>
    if (raw.v !== 1 || !Array.isArray(raw.rules) || raw.rules.length > 20) return null
    if (typeof raw.minutes !== 'number' || raw.minutes < 1 || raw.minutes > 180) return null
    if (typeof raw.from !== 'string' || !DATE.test(raw.from)) return null
    if (raw.coach !== undefined && !['hype', 'calm', 'drill', 'zen'].includes(raw.coach)) return null
    const rules: CalendarRule[] = []
    for (const r of raw.rules as Partial<CalendarRule>[]) {
      if (!r || typeof r.id !== 'string' || !ID.test(r.id) || !TYPES.includes(r.type as CalendarRule['type'])) return null
      if (!Array.isArray(r.days) || !r.days.length || r.days.some((d) => !Number.isInteger(d) || d < 1 || d > 7)) return null
      if (r.times !== undefined && (!Array.isArray(r.times) || r.times.length > 12 || r.times.some((t) => typeof t !== 'string' || !HHMM.test(t)))) return null
      if (r.every !== undefined && (!HHMM.test(r.every.start) || !HHMM.test(r.every.end) || typeof r.every.minutes !== 'number' || r.every.minutes < 15 || r.every.minutes > 480)) return null
      if (r.meal !== undefined && !['breakfast', 'lunch', 'dinner'].includes(r.meal)) return null
      rules.push({ id: r.id, type: r.type as CalendarRule['type'], days: r.days, ...(r.times ? { times: r.times } : {}), ...(r.every ? { every: r.every } : {}), ...(r.meal ? { meal: r.meal } : {}) })
    }
    return { v: 1, rules, minutes: raw.minutes, ...(raw.coach ? { coach: raw.coach } : {}), from: raw.from }
  } catch {
    return null
  }
}
