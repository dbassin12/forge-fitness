import { describe, expect, it } from 'vitest'
import { addDays, daysBetween, isoWeekday, startOfWeek, toISODate, clockToMinutes, minutesToClock } from '@/lib/dates'

describe('dates', () => {
  it('formats local dates without UTC drift', () => {
    expect(toISODate(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05')
  })
  it('adds days across month and DST boundaries', () => {
    expect(addDays('2026-03-07', 2)).toBe('2026-03-09')
    expect(addDays('2026-10-31', 2)).toBe('2026-11-02')
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31')
  })
  it('computes ISO weekdays and week starts', () => {
    expect(isoWeekday('2026-10-05')).toBe(1) // Monday
    expect(isoWeekday('2026-10-04')).toBe(7) // Sunday
    expect(startOfWeek('2026-10-04')).toBe('2026-09-28')
  })
  it('counts days between dates', () => {
    expect(daysBetween('2026-10-01', '2026-10-08')).toBe(7)
  })
  it('converts clock strings', () => {
    expect(clockToMinutes('07:30')).toBe(450)
    expect(minutesToClock(450)).toBe('07:30')
  })
})
