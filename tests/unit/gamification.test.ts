import { describe, expect, it } from 'vitest'
import { ACHIEVEMENTS, dailyStreak, EMPTY_STATS, levelForXp, longestDailyStreak, newlyUnlocked, weeklyStreak, workoutXp, xpForLevel } from '@/engines/gamification'

describe('xp and levels', () => {
  it('awards more for longer, better workouts', () => {
    expect(workoutXp({ minutes: 15, prs: 0, levelUps: 0 })).toBe(70)
    expect(workoutXp({ minutes: 15, prs: 2, levelUps: 1, feedback: true })).toBeGreaterThan(100)
    expect(workoutXp({ minutes: 3, prs: 0, levelUps: 0, snack: true })).toBe(21)
  })

  it('maps XP onto levels', () => {
    expect(xpForLevel(1)).toBe(0)
    expect(xpForLevel(2)).toBe(100)
    expect(xpForLevel(3)).toBe(300)
    expect(levelForXp(0)).toMatchObject({ level: 1, into: 0, span: 100 })
    expect(levelForXp(150)).toMatchObject({ level: 2, into: 50, span: 200 })
    expect(levelForXp(299).level).toBe(2)
    expect(levelForXp(300).level).toBe(3)
  })
})

describe('streaks', () => {
  // 2026-09-07 is a Monday.
  const week = (monday: string, days: number[]) => days.map((d) => {
    const [y, m, dd] = monday.split('-').map(Number)
    const dt = new Date(y, m - 1, dd + d, 12)
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
  })

  it('counts consecutive weeks that hit the goal', () => {
    const dates = [...week('2026-09-07', [0, 2, 4]), ...week('2026-09-14', [0, 2, 4]), ...week('2026-09-21', [1, 3, 5])]
    const s = weeklyStreak(dates, 3, '2026-09-29')
    expect(s.weeks).toBe(3)
    expect(s.thisWeek).toBe(0)
  })

  it('does not break the streak during the current week, and adds it once hit', () => {
    const dates = [...week('2026-09-14', [0, 2, 4]), ...week('2026-09-21', [0, 2, 4]), ...week('2026-09-28', [0, 1, 2])]
    expect(weeklyStreak(dates, 3, '2026-09-30').weeks).toBe(3)
    expect(weeklyStreak(dates.slice(0, 7), 3, '2026-09-29').weeks).toBe(2)
  })

  it('resets after a missed week unless a freeze is banked', () => {
    const good = (m: string) => week(m, [0, 2, 4])
    const missed = [...good('2026-08-03'), ...week('2026-08-10', [0]), ...good('2026-08-17')]
    expect(weeklyStreak(missed, 3, '2026-08-25').weeks).toBe(1)
    const frozen = [...good('2026-07-06'), ...good('2026-07-13'), ...good('2026-07-20'), ...good('2026-07-27'), ...week('2026-08-03', [0]), ...good('2026-08-10')]
    const s = weeklyStreak(frozen, 3, '2026-08-18')
    expect(s.weeks).toBe(5)
    expect(s.freezes).toBe(0)
  })

  it('tracks daily habit streaks', () => {
    expect(dailyStreak(['2026-10-01', '2026-10-02'], '2026-10-02')).toBe(2)
    expect(dailyStreak(['2026-09-30', '2026-10-01'], '2026-10-02')).toBe(2)
    expect(dailyStreak(['2026-09-29'], '2026-10-02')).toBe(0)
    expect(longestDailyStreak(['2026-01-01', '2026-01-02', '2026-01-03', '2026-01-10'])).toBe(3)
  })
})

describe('achievements', () => {
  it('have unique ids and unlock from stats', () => {
    expect(new Set(ACHIEVEMENTS.map((a) => a.id)).size).toBe(ACHIEVEMENTS.length)
    expect(ACHIEVEMENTS.length).toBeGreaterThanOrEqual(30)
    expect(newlyUnlocked(EMPTY_STATS, new Set())).toHaveLength(0)
    const got = newlyUnlocked({ ...EMPTY_STATS, workouts: 3, pushupReps: 120 }, new Set(['first-rep']))
    expect(got.map((a) => a.id).sort()).toEqual(['pushups-100', 'three-done'])
  })
})
