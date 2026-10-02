import { describe, expect, it } from 'vitest'
import { activeContexts, rankTips, tipOfTheDay, type TipSituation } from '@/engines/tips'

const s: TipSituation = {
  date: '2026-10-02',
  hour: 8,
  weekday: 5,
  goal: 'build_muscle',
  trainingDay: true,
  workoutDoneToday: false,
  daysSinceStart: 2,
  missedLastWorkout: false,
  streakWeeks: 0,
  proteinBehind: false,
  waterBehind: false,
  overCalories: false,
  underCalories: false,
  shortSessions: true,
  hasDumbbells: true,
}

describe('tips', () => {
  it('derives the situation', () => {
    const c = activeContexts(s)
    for (const k of ['any', 'morning', 'first-week', 'pre-workout', 'busy', 'dumbbells'] as const) expect(c.has(k)).toBe(true)
    expect(c.has('evening')).toBe(false)
  })

  it('prefers specific tips and respects goals', () => {
    const ranked = rankTips({ ...s, missedLastWorkout: true })
    expect(ranked[0].tip.contexts.some((c) => c !== 'any')).toBe(true)
    for (const r of ranked) if (r.tip.goals) expect(r.tip.goals).toContain('build_muscle')
  })

  it('is stable within a day and changes across days', () => {
    expect(tipOfTheDay(s).id).toBe(tipOfTheDay(s).id)
    const ids = new Set(['2026-10-02', '2026-10-03', '2026-10-04', '2026-10-05', '2026-10-06'].map((date) => tipOfTheDay({ ...s, date }).id))
    expect(ids.size).toBeGreaterThan(1)
  })
})
