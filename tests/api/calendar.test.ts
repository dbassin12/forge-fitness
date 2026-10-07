import { describe, expect, it } from 'vitest'

const { GET } = await import('../../api/calendar.js')
const { buildReminderCalendar, calendarConfig, decodeCalendarConfig, encodeCalendarConfig, eventCount, firstOn } = await import('../../shared/calendar.js')
const { presetRules } = await import('../../shared/reminders.js')

const rules = presetRules('coach', { trainingDays: [1, 3, 5], workoutTime: '07:00' })
const cfg = calendarConfig({ rules, minutes: 15, coach: 'drill', from: '2026-10-07' })

describe('phone-calendar reminders', () => {
  it('turns every enabled reminder time into a repeating event with an alert', () => {
    const ics = buildReminderCalendar({ ...cfg, origin: 'https://forge.example' }, new Date('2026-10-07T12:00:00Z'))
    const events = ics.split('BEGIN:VEVENT').length - 1
    expect(events).toBe(eventCount(cfg))
    expect(events).toBe(4 + 6 + 1 + 1 + 2 + 1) // workout, streak, weigh-in, review + 6 water + lunch + dinner + 2 snacks + check-in
    expect(ics.split('BEGIN:VALARM').length - 1).toBe(events)
    expect(ics).toContain('RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR')
    expect(ics).toContain('RRULE:FREQ=DAILY')
    // Workout reminder 10 minutes before 07:00, from the first training day (Wed 7 Oct), lasting the session.
    expect(ics).toContain('DTSTART:20261007T065000')
    expect(ics).toContain('DURATION:PT15M')
    expect(ics).toContain('Move it\\, recruit!')
    expect(ics).toContain('URL:https://forge.example/#/workout')
    const uids = [...ics.matchAll(/^UID:(.+)$/gm)].map((m) => m[1])
    expect(new Set(uids).size).toBe(uids.length)
    for (const line of ics.split('\r\n')) expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75)
  })

  it('leaves out turned-off reminders', () => {
    const gentle = calendarConfig({ rules: presetRules('gentle', { trainingDays: [2, 4], workoutTime: '18:30' }), minutes: 20, from: '2026-10-07' })
    expect(gentle.rules.map((r) => r.id)).toEqual(['workout', 'streak', 'weighin', 'review'])
    expect(eventCount(gentle)).toBe(4)
  })

  it('finds the first matching day', () => {
    expect(firstOn('2026-10-07', [3])).toBe('2026-10-07')
    expect(firstOn('2026-10-07', [1])).toBe('2026-10-12')
    expect(firstOn('2026-10-07', [6])).toBe('2026-10-10')
  })

  it('round-trips the link and rejects tampered ones', () => {
    const code = encodeCalendarConfig(cfg)
    expect(code).toMatch(/^[A-Za-z0-9_-]+$/)
    expect(decodeCalendarConfig(code)).toEqual(cfg)
    expect(decodeCalendarConfig('nonsense')).toBeNull()
    const bad = encodeCalendarConfig({ ...cfg, rules: [{ ...cfg.rules[0], id: '<script>' }] })
    expect(decodeCalendarConfig(bad)).toBeNull()
    const badTime = encodeCalendarConfig({ ...cfg, rules: [{ ...cfg.rules[0], times: ['25:00'] }] })
    expect(decodeCalendarConfig(badTime)).toBeNull()
  })

  it('serves the calendar from a link, pointing events at its own address', async () => {
    const res = GET(new Request(`https://forge.example/api/calendar?c=${encodeCalendarConfig(cfg)}`))
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('text/calendar')
    const body = await res.text()
    expect(body.startsWith('BEGIN:VCALENDAR')).toBe(true)
    expect(body).toContain('URL:https://forge.example/#/eat')
    expect(GET(new Request('https://forge.example/api/calendar?c=oops')).status).toBe(400)
    expect(GET(new Request('https://forge.example/api/calendar')).status).toBe(400)
  })
})
