import { describe, expect, it } from 'vitest'
import { DateTime } from 'luxon'
import { dueOccurrences, nextOccurrence, occurrencesOn, presetRules, ruleTimes, SEND_LATE_MS, type ReminderRule } from './reminders.js'

const NY = 'America/New_York'
const at = (iso: string, zone = NY) => DateTime.fromISO(iso, { zone }).toMillis()
const rule = (r: Partial<ReminderRule>): ReminderRule => ({ id: 'r', type: 'workout', days: [1, 2, 3, 4, 5, 6, 7], times: ['07:00'], enabled: true, ...r })

describe('reminder expansion', () => {
  it('expands fixed times and repeating windows', () => {
    expect(ruleTimes(rule({ times: ['07:00', '25:00', '13:30'] }))).toEqual(['07:00', '13:30'])
    expect(ruleTimes(rule({ times: undefined, every: { start: '10:00', end: '20:00', minutes: 120 } }))).toEqual(['10:00', '12:00', '14:00', '16:00', '18:00', '20:00'])
  })

  it('respects weekdays in the device zone', () => {
    // 2026-10-05 is a Monday.
    expect(occurrencesOn(rule({ days: [1] }), '2026-10-05', NY)).toHaveLength(1)
    expect(occurrencesOn(rule({ days: [2] }), '2026-10-05', NY)).toHaveLength(0)
    expect(occurrencesOn(rule({ days: [1] }), '2026-10-05', NY)[0].fireAt).toBe(at('2026-10-05T07:00'))
  })

  it('handles the spring-forward gap and the fall-back overlap', () => {
    // 2026-03-08 02:30 does not exist in New York → moved to 03:30 EDT.
    const gap = occurrencesOn(rule({ times: ['02:30'] }), '2026-03-08', NY)[0]
    expect(DateTime.fromMillis(gap.fireAt, { zone: NY }).toFormat('HH:mm')).toBe('03:30')
    // 2026-11-01 01:30 happens twice → the earlier (EDT, UTC−4) instant.
    const overlap = occurrencesOn(rule({ times: ['01:30'] }), '2026-11-01', NY)[0]
    expect(overlap.fireAt).toBe(Date.UTC(2026, 10, 1, 5, 30))
  })
})

describe('due occurrences', () => {
  const r = rule({ id: 'workout', ack: 'workout' })
  it('sends inside the window exactly once', () => {
    const now = at('2026-10-05T06:57')
    const due = dueOccurrences([r], NY, now, {})
    expect(due).toHaveLength(1)
    expect(dueOccurrences([r], NY, now + 60_000, { workout: due[0].fireAt })).toHaveLength(0)
  })

  it('skips occurrences that are too early, too late, or acknowledged', () => {
    expect(dueOccurrences([r], NY, at('2026-10-05T06:40'), {})).toHaveLength(0)
    expect(dueOccurrences([r], NY, at('2026-10-05T07:00') + SEND_LATE_MS + 60_000, {})).toHaveLength(0)
    expect(dueOccurrences([r], NY, at('2026-10-05T07:05'), {}, ['workout:2026-10-05'])).toHaveLength(0)
  })

  it('only sends the newest occurrence after a delayed tick', () => {
    const water = rule({ id: 'water', times: undefined, every: { start: '10:00', end: '20:00', minutes: 30 } })
    const due = dueOccurrences([water], NY, at('2026-10-05T11:10'), {})
    expect(due).toHaveLength(1)
    expect(due[0].time).toBe('11:00')
  })

  it('works across zones and midnight', () => {
    const late = rule({ id: 'late', times: ['23:55'] })
    const tokyo = 'Asia/Tokyo'
    const now = at('2026-10-06T00:02', tokyo)
    const due = dueOccurrences([late], tokyo, now, {})
    expect(due[0].date).toBe('2026-10-05')
  })

  it('finds the next reminder', () => {
    const n = nextOccurrence([rule({ days: [3] })], NY, at('2026-10-05T12:00'))
    expect(n?.date).toBe('2026-10-07')
  })
})

describe('presets', () => {
  it('gentle keeps it light, coach turns everything on', () => {
    const g = presetRules('gentle', { trainingDays: [1, 3, 5], workoutTime: '07:00' })
    const c = presetRules('coach', { trainingDays: [1, 3, 5], workoutTime: '07:00' })
    expect(g.filter((x) => x.enabled).map((x) => x.id)).toEqual(['workout', 'streak', 'weighin', 'review'])
    expect(c.every((x) => x.enabled)).toBe(true)
    expect(g.find((x) => x.id === 'workout')!.times).toEqual(['06:50'])
    expect(new Set(c.map((x) => x.id)).size).toBe(c.length)
  })
})
