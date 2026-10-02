import type { ISODate } from '@/domain/types'

const pad = (n: number) => String(n).padStart(2, '0')

/** Local calendar date for a JS Date (no UTC shifting). */
export function toISODate(d: Date): ISODate {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function todayISO(now: Date = new Date()): ISODate {
  return toISODate(now)
}

/** Parse `YYYY-MM-DD` as a local date at noon (noon avoids DST edge cases). */
export function parseISODate(iso: ISODate): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d, 12, 0, 0, 0)
}

export function addDays(iso: ISODate, n: number): ISODate {
  const d = parseISODate(iso)
  d.setDate(d.getDate() + n)
  return toISODate(d)
}

/** ISO weekday: 1 = Monday … 7 = Sunday. */
export function isoWeekday(iso: ISODate): number {
  const js = parseISODate(iso).getDay() // 0 = Sunday
  return js === 0 ? 7 : js
}

/** Monday of the week containing `iso`. */
export function startOfWeek(iso: ISODate): ISODate {
  return addDays(iso, 1 - isoWeekday(iso))
}

export function daysBetween(a: ISODate, b: ISODate): number {
  return Math.round((parseISODate(b).getTime() - parseISODate(a).getTime()) / 86_400_000)
}

export function lastNDays(n: number, end: ISODate = todayISO()): ISODate[] {
  return Array.from({ length: n }, (_, i) => addDays(end, i - (n - 1)))
}

export const WEEKDAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const

export function formatShortDate(iso: ISODate): string {
  return parseISODate(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function minutesToClock(min: number): string {
  const h = Math.floor(min / 60)
  const m = Math.round(min % 60)
  return `${pad(h)}:${pad(m)}`
}

export function clockToMinutes(clock: string): number {
  const [h, m] = clock.split(':').map(Number)
  return h * 60 + (m || 0)
}

/** 1-based day of the year (handy as a daily rotation seed). */
export function dayOfYear(iso: ISODate = todayISO()): number {
  const d = parseISODate(iso)
  const start = new Date(d.getFullYear(), 0, 1, 12)
  return Math.round((d.getTime() - start.getTime()) / 86_400_000) + 1
}
