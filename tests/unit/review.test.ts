import { describe, expect, it } from 'vitest'
import { weekReview } from '@/engines/review'

const base = {
  weekOf: '2026-09-28',
  daysPerWeek: 3,
  sessionMinutes: 15,
  food: [
    { date: '2026-09-28', kcal: 2100, protein: 150 },
    { date: '2026-09-29', kcal: 2300, protein: 120 },
  ],
  kcalTarget: 2200,
  proteinTarget: 145,
  weights: [
    { date: '2026-09-28', kg: 82 },
    { date: '2026-10-03', kg: 81.4 },
  ],
}

describe('weekly review', () => {
  it('summarizes the week', () => {
    const r = weekReview({
      ...base,
      workouts: [
        { date: '2026-09-28', kind: 'plan', minutes: 15 },
        { date: '2026-09-30', kind: 'plan', minutes: 16 },
        { date: '2026-10-01', kind: 'snack', minutes: 3 },
        { date: '2026-10-06', kind: 'plan', minutes: 15 },
      ],
    })
    expect(r.workouts).toBe(2)
    expect(r.minutes).toBe(34)
    expect(r.avgKcal).toBe(2200)
    expect(r.proteinDays).toBe(1)
    expect(r.weightDeltaKg).toBeCloseTo(-0.6)
    expect(r.suggestion).toBeUndefined()
  })

  it('offers more after two perfect weeks and less after two light ones', () => {
    const done = ['2026-09-28', '2026-09-30', '2026-10-02'].map((date) => ({ date, kind: 'plan', minutes: 15 }))
    const more = weekReview({ ...base, workouts: done, lastWeekCompletion: 1 })
    expect(more.completion).toBe(1)
    expect(more.suggestion?.options.map((o) => o.daysPerWeek ?? o.sessionMinutes)).toEqual([4, 20])
    const less = weekReview({ ...base, workouts: [], lastWeekCompletion: 0.3 })
    expect(less.suggestion?.options.map((o) => o.daysPerWeek ?? o.sessionMinutes)).toEqual([2, 10])
  })
})
