/**
 * Reminder rules, presets and default wording, shared by the app (rules editor, in-app reminders,
 * .ics) and the server tick. No date library here, so the app shell can use these without
 * loading the scheduler; the time-zone maths lives in ./reminders.ts.
 */

export type ReminderType = 'workout' | 'streak' | 'water' | 'meal' | 'snack' | 'checkin' | 'weighin' | 'review' | 'custom'

/** Which app a reminder belongs to: Forge at `/`, Bloom (yoga) at `/bloom/`. */
export type ReminderApp = 'forge' | 'bloom'

/** Path prefix of each app's pages. */
export const APP_PATH: Record<ReminderApp, string> = { forge: '/', bloom: '/bloom/' }

export interface ReminderRule {
  id: string
  type: ReminderType
  /** ISO weekdays, 1 = Monday … 7 = Sunday. */
  days: number[]
  /** Fixed local times, "HH:MM". */
  times?: string[]
  /** …or a repeating window, e.g. every 120 minutes from 10:00 to 20:00. */
  every?: { start: string; end: string; minutes: number }
  enabled: boolean
  /** Skip an occurrence once the phone has acked `${ack}:${localDate}` (e.g. "workout"). */
  ack?: string
  meal?: 'breakfast' | 'lunch' | 'dinner'
  title?: string
  body?: string
}

export interface Occurrence {
  ruleId: string
  type: ReminderType
  /** Local calendar date of the occurrence (YYYY-MM-DD in the device's zone). */
  date: string
  time: string
  fireAt: number
}

/** Send up to 5 minutes early (scheduler granularity) and at most an hour late. */
export const SEND_EARLY_MS = 5 * 60_000
export const SEND_LATE_MS = 60 * 60_000

const HHMM = /^([01]\d|2[0-3]):([0-5]\d)$/

export function parseTime(t: string): { hour: number; minute: number } | null {
  const m = HHMM.exec(t)
  return m ? { hour: Number(m[1]), minute: Number(m[2]) } : null
}

const pad = (n: number) => String(n).padStart(2, '0')

export function ruleTimes(rule: ReminderRule): string[] {
  if (rule.every) {
    const s = parseTime(rule.every.start)
    const e = parseTime(rule.every.end)
    const step = Math.max(15, Math.round(rule.every.minutes))
    if (!s || !e) return []
    const out: string[] = []
    for (let m = s.hour * 60 + s.minute; m <= e.hour * 60 + e.minute && out.length < 48; m += step) out.push(`${pad(Math.floor(m / 60))}:${pad(m % 60)}`)
    return out
  }
  return (rule.times ?? []).filter((t) => HHMM.test(t))
}

/**
 * Occurrences of a rule on one local date. Luxon resolves DST: a time that doesn't exist (spring
 * forward) moves later by the gap; an ambiguous one (fall back) uses the earlier instant.
 */
export type ReminderStyleName = 'gentle' | 'coach'

const WEEKDAYS = [1, 2, 3, 4, 5]
const ALL = [1, 2, 3, 4, 5, 6, 7]

function minus(time: string, minutes: number): string {
  const t = parseTime(time) ?? { hour: 7, minute: 0 }
  const m = (((t.hour * 60 + t.minute - minutes) % 1440) + 1440) % 1440
  return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`
}

/** Starting rule sets. Everything stays editable in the app. Bloom starts without weigh-in nudges. */
export function presetRules(style: ReminderStyleName, o: { trainingDays: number[]; workoutTime: string; app?: ReminderApp }): ReminderRule[] {
  const scale = o.app !== 'bloom'
  const training = o.trainingDays.length ? o.trainingDays : [1, 3, 5]
  const streakTime = parseTime(o.workoutTime) && parseTime(o.workoutTime)!.hour >= 18 ? '21:00' : '19:30'
  const base: ReminderRule[] = [
    { id: 'workout', type: 'workout', days: training, times: [minus(o.workoutTime, 10)], enabled: true, ack: 'workout' },
    { id: 'streak', type: 'streak', days: training, times: [streakTime], enabled: true, ack: 'workout' },
    { id: 'weighin', type: 'weighin', days: [6], times: ['08:30'], enabled: scale, ack: 'weighin' },
    { id: 'review', type: 'review', days: [7], times: ['18:00'], enabled: true },
    { id: 'water', type: 'water', days: ALL, every: { start: '10:00', end: '20:00', minutes: 120 }, enabled: false, ack: 'water' },
    { id: 'lunch', type: 'meal', meal: 'lunch', days: ALL, times: ['13:30'], enabled: false, ack: 'meal-lunch' },
    { id: 'dinner', type: 'meal', meal: 'dinner', days: ALL, times: ['19:45'], enabled: false, ack: 'meal-dinner' },
    { id: 'snack', type: 'snack', days: WEEKDAYS, times: ['11:00', '15:30'], enabled: false },
    { id: 'checkin', type: 'checkin', days: ALL, times: ['21:00'], enabled: false },
  ]
  if (style === 'coach') return base.map((r) => ({ ...r, enabled: r.type !== 'weighin' || scale }))
  return base
}

/** Fallback notification text (the service worker personalizes it when it can). */
export function defaultText(rule: Pick<ReminderRule, 'type' | 'meal' | 'title' | 'body'>, app: ReminderApp = 'forge'): { title: string; body: string; url: string } {
  if (app === 'bloom') return bloomText(rule)
  switch (rule.type) {
    case 'workout':
      return { title: '💪 Time to train', body: "Today's workout is ready — tap to start.", url: '/#/workout' }
    case 'streak':
      return { title: '🔥 Keep your streak alive', body: 'Your workout is still waiting. Even a 5-minute express session counts.', url: '/#/today' }
    case 'water':
      return { title: '💧 Water break', body: 'Have a glass of water.', url: '/#/eat' }
    case 'meal':
      return { title: `🍽️ Log your ${rule.meal ?? 'meal'}`, body: 'Takes 10 seconds. Tap to log it.', url: '/#/eat/add' }
    case 'snack':
      return { title: '🚶 Movement snack', body: 'Stand up for a 3-minute move. Your back will thank you.', url: '/#/workout?snack=3' }
    case 'checkin':
      return { title: '🌙 Evening check-in', body: "Log today's food and water while you remember.", url: '/#/eat' }
    case 'weighin':
      return { title: '⚖️ Weigh-in day', body: 'Step on the scale before breakfast, then log it.', url: '/#/progress' }
    case 'review':
      return { title: '📈 Your week in review', body: 'See how the week went and plan the next one.', url: '/#/progress' }
    case 'custom':
      return { title: rule.title || 'Forge reminder', body: rule.body || '', url: '/#/today' }
  }
}

/** Bloom's softer wording; links open Bloom's own pages. */
function bloomText(rule: Pick<ReminderRule, 'type' | 'meal' | 'title' | 'body'>): { title: string; body: string; url: string } {
  const at = (hash: string) => `${APP_PATH.bloom}#/${hash}`
  switch (rule.type) {
    case 'workout':
      return { title: '🧘 Time for your practice', body: 'Your mat is waiting. Tap to begin, at your own pace.', url: at('workout') }
    case 'streak':
      return { title: '🌸 A moment for you', body: 'Your practice is still here. Even five gentle minutes count.', url: at('today') }
    case 'water':
      return { title: '💧 Water break', body: 'A glass of water, and one slow breath.', url: at('eat') }
    case 'meal':
      return { title: `🍽️ Log your ${rule.meal ?? 'meal'}`, body: 'Takes a few seconds. Tap to log it.', url: at('eat/add') }
    case 'snack':
      return { title: '🌿 Stretch break', body: 'Three minutes to loosen your neck, shoulders and back.', url: at('workout?snack=3') }
    case 'checkin':
      return { title: '🌙 Wind down', body: 'A few slow breaths before bed? Tap for a calming breath.', url: at('breathe') }
    case 'weighin':
      return { title: '⚖️ Weekly check-in', body: 'Weigh in before breakfast if you like, then log it.', url: at('progress') }
    case 'review':
      return { title: '🌱 Your week in review', body: 'See how your week went and plan gently for the next.', url: at('progress') }
    case 'custom':
      return { title: rule.title || 'Bloom reminder', body: rule.body || '', url: at('today') }
  }
}

export const REMINDER_LABEL: Record<ReminderType, string> = {
  workout: 'Workout time',
  streak: 'Streak saver',
  water: 'Water',
  meal: 'Meal logging',
  snack: 'Movement snacks',
  checkin: 'Evening check-in',
  weighin: 'Weekly weigh-in',
  review: 'Weekly review',
  custom: 'Custom',
}

const BLOOM_REMINDER_LABEL: Record<ReminderType, string> = {
  ...REMINDER_LABEL,
  workout: 'Practice time',
  streak: 'Gentle nudge',
  snack: 'Stretch breaks',
  checkin: 'Wind down',
}

/** A reminder's name as each app says it. */
export function reminderLabel(type: ReminderType, app: ReminderApp = 'forge'): string {
  return (app === 'bloom' ? BLOOM_REMINDER_LABEL : REMINDER_LABEL)[type]
}
