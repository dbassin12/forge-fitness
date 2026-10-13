import { describe, expect, it } from 'vitest'
import { buildReminderCalendar, calendarConfig, escText, eventCount } from '@shared/calendar'
import { presetRules } from '@shared/reminders'
import { kvGet, kvSet } from '@/db/db'
import { CALENDAR_KEY, calendarSeries, forgetCalendarExport } from '@/state/calendar'

describe('removing calendar reminders after switching to notifications', () => {
  const cfg = calendarConfig({ rules: presetRules('coach', { trainingDays: [1, 3, 5], workoutTime: '07:00' }), minutes: 15, coach: 'calm', from: '2026-10-12' })

  it('lists every event that was added, one line per reminder, titled as in the calendar', () => {
    const series = calendarSeries(cfg)
    expect(series.reduce((n, s) => n + s.count, 0)).toBe(eventCount(cfg))
    const ics = buildReminderCalendar({ ...cfg, origin: 'https://forge.example' }).replace(/\r\n /g, '')
    for (const s of series) expect(ics).toContain(`SUMMARY:${escText(s.title)}`)
    // The workout reminder rings 10 minutes early on training days.
    expect(series[0]).toEqual({ title: '🙂 Workout time, whenever you’re ready', when: 'Mon Wed Fri at 06:50', count: 1 })
    // Water is the busy one: an event for each time of day.
    const busiest = series.reduce((a, b) => (b.count > a.count ? b : a))
    expect(busiest.count).toBe(6)
    expect(busiest.when).toMatch(/^Every day at \d\d:\d\d(, \d\d:\d\d){5}$/)
  })

  it('stops counting them as set up once they are deleted', async () => {
    await kvSet(CALENDAR_KEY, { at: Date.now(), key: 'x', events: eventCount(cfg), cfg })
    await forgetCalendarExport()
    expect(await kvGet(CALENDAR_KEY)).toBeNull()
  })
})
