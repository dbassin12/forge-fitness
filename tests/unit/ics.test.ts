import { describe, expect, it } from 'vitest'
import { buildIcs, escText, fold } from '@/engines/ics'

describe('ics export', () => {
  const ics = buildIcs({ startDate: '2026-10-05', trainingDays: [5, 1, 3], time: '07:00', minutes: 15, weighIn: true, weighInStartDate: '2026-10-10', now: new Date(Date.UTC(2026, 9, 2, 12, 0, 0)) })
  const lines = ics.split('\r\n')

  it('is a valid calendar with CRLF lines', () => {
    expect(lines[0]).toBe('BEGIN:VCALENDAR')
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true)
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(2)
    expect(ics.match(/BEGIN:VALARM/g)).toHaveLength(2)
    expect(ics).not.toMatch(/[^\r]\n/)
  })

  it('repeats on the training days at local time with an alarm', () => {
    expect(lines).toContain('RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR')
    expect(lines).toContain('DTSTART:20261005T070000')
    expect(lines).toContain('DTEND:20261005T071500')
    expect(lines).toContain('TRIGGER:-PT10M')
    expect(lines).toContain('DTSTAMP:20261002T120000Z')
  })

  it('escapes text and folds long lines', () => {
    const unfolded = ics.replace(/\r\n /g, '')
    expect(unfolded).toContain('Short on time? The 5- or 10-minute express version still counts.')
    expect(buildIcs({ startDate: '2026-10-05', trainingDays: [1], time: '07:00', minutes: 15 })).toContain('Forge workout (15 min)')
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
