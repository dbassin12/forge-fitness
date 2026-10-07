import { describe, expect, it } from 'vitest'
import { buildReminderCalendar, calendarConfig, escText, fold } from '@shared/calendar'
import { presetRules } from '@shared/reminders'

describe('calendar file format', () => {
  const cfg = calendarConfig({ rules: presetRules('gentle', { trainingDays: [5, 1, 3], workoutTime: '07:00' }), minutes: 15, from: '2026-10-05' })
  const ics = buildReminderCalendar({ ...cfg, origin: 'https://forge.example' }, new Date(Date.UTC(2026, 9, 2, 12, 0, 0)))
  const lines = ics.split('\r\n')

  it('is a valid calendar with CRLF lines', () => {
    expect(lines[0]).toBe('BEGIN:VCALENDAR')
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true)
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(4)
    expect(ics.match(/BEGIN:VALARM/g)).toHaveLength(4)
    expect(ics).not.toMatch(/[^\r]\n/)
  })

  it('repeats on the training days at local time with an alert', () => {
    expect(lines).toContain('RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR')
    expect(lines).toContain('DTSTART:20261005T065000')
    expect(lines).toContain('DURATION:PT15M')
    expect(lines).toContain('TRIGGER:PT0M')
    expect(lines).toContain('DTSTAMP:20261002T120000Z')
    expect(lines).toContain('RRULE:FREQ=WEEKLY;BYDAY=SA')
  })

  it('escapes text and folds long lines', () => {
    const unfolded = ics.replace(/\r\n /g, '')
    expect(unfolded).toContain('Short on time? The 5- or 10-minute version still counts.')
    for (const l of lines) expect(new TextEncoder().encode(l).length).toBeLessThanOrEqual(75)
    const long = 'DESCRIPTION:' + 'x'.repeat(200)
    expect(fold(long).split('\r\n ').join('')).toBe(long)
  })
})

describe('ics text escaping', () => {
  it('escapes backslashes, semicolons, commas and newlines', () => {
    const BS = String.fromCharCode(92)
    expect(escText(`a;b,c${BS}d\ne`)).toBe(`a${BS};b${BS},c${BS}${BS}d${BS}ne`)
  })
})
