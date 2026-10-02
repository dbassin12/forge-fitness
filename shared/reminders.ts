/** When reminders fire: DST-safe time-zone maths with luxon. Re-exports the rules module. */
import { DateTime } from 'luxon'
import { parseTime, ruleTimes, SEND_EARLY_MS, SEND_LATE_MS, type Occurrence, type ReminderRule } from './reminder-rules.js'

export * from './reminder-rules.js'

export function occurrencesOn(rule: ReminderRule, date: string, zone: string): Occurrence[] {
  const d = DateTime.fromISO(date, { zone })
  if (!d.isValid || !rule.enabled || !rule.days.includes(d.weekday)) return []
  return ruleTimes(rule).flatMap((time) => {
    const t = parseTime(time)!
    const at = DateTime.fromObject({ year: d.year, month: d.month, day: d.day, hour: t.hour, minute: t.minute }, { zone })
    return at.isValid ? [{ ruleId: rule.id, type: rule.type, date, time, fireAt: at.toMillis() }] : []
  })
}

/** Local date in a zone for an instant. */
export function localDate(ms: number, zone: string): string {
  return DateTime.fromMillis(ms, { zone }).toISODate() ?? DateTime.fromMillis(ms).toISODate()!
}

export function isValidZone(zone: string): boolean {
  return DateTime.local().setZone(zone).isValid
}

/**
 * What should go out now: occurrences after the rule's watermark, inside the send window, and not
 * acknowledged. A delayed scheduler never floods — only the newest occurrence per rule is sent.
 */
export function dueOccurrences(rules: ReminderRule[], zone: string, now: number, lastSent: Record<string, number>, acks: readonly string[] = []): Occurrence[] {
  const today = localDate(now, zone)
  const dates = [-1, 0, 1].map((k) => DateTime.fromISO(today, { zone }).plus({ days: k }).toISODate()!)
  const acked = new Set(acks)
  const out: Occurrence[] = []
  for (const rule of rules) {
    if (!rule.enabled) continue
    const due = dates
      .flatMap((date) => occurrencesOn(rule, date, zone))
      .filter((o) => o.fireAt > (lastSent[rule.id] ?? -Infinity) && o.fireAt <= now + SEND_EARLY_MS && now - o.fireAt <= SEND_LATE_MS)
      .filter((o) => !rule.ack || !acked.has(`${rule.ack}:${o.date}`))
      .sort((a, b) => a.fireAt - b.fireAt)
    const latest = due[due.length - 1]
    if (latest) out.push(latest)
  }
  return out
}

/** Next occurrence of any rule after `now` (for "next reminder" displays). */
export function nextOccurrence(rules: ReminderRule[], zone: string, now: number): Occurrence | undefined {
  const today = localDate(now, zone)
  for (let k = 0; k < 8; k++) {
    const date = DateTime.fromISO(today, { zone }).plus({ days: k }).toISODate()!
    const occ = rules.flatMap((r) => occurrencesOn(r, date, zone)).filter((o) => o.fireAt > now).sort((a, b) => a.fireAt - b.fireAt)
    if (occ.length) return occ[0]
  }
  return undefined
}
