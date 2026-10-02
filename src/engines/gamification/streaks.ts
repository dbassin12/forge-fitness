import type { ISODate } from '@/domain/types'
import { addDays, daysBetween, startOfWeek } from '@/lib/dates'

export interface WeeklyStreak {
  /** Consecutive weeks hitting the workout goal (this week counts once it's hit). */
  weeks: number
  /** Workouts done this week. */
  thisWeek: number
  target: number
  /** Streak freezes banked (one per 4 good weeks, max 2) — a missed week spends one. */
  freezes: number
  /** Last week's goal was missed and covered by a freeze. */
  frozeLastWeek: boolean
}

/**
 * Weekly-goal streak from the dates of completed plan workouts. Weeks run Monday–Sunday. The
 * current week never breaks the streak (there's still time); it adds one when the goal is met.
 */
export function weeklyStreak(dates: ISODate[], target: number, today: ISODate): WeeklyStreak {
  const goal = Math.max(1, Math.min(7, Math.round(target)))
  const perWeek = new Map<ISODate, number>()
  for (const d of dates) {
    const w = startOfWeek(d)
    perWeek.set(w, (perWeek.get(w) ?? 0) + 1)
  }
  const current = startOfWeek(today)
  const thisWeek = perWeek.get(current) ?? 0
  const weeks = [...perWeek.keys()].filter((w) => w < current).sort()
  let streak = 0
  let freezes = 0
  let frozeLastWeek = false
  if (weeks.length) {
    for (let w = weeks[0]; w < current; w = addDays(w, 7)) {
      const ok = (perWeek.get(w) ?? 0) >= goal
      frozeLastWeek = false
      if (ok) {
        streak++
        if (streak % 4 === 0) freezes = Math.min(2, freezes + 1)
      } else if (streak > 0 && freezes > 0) {
        freezes--
        frozeLastWeek = true
      } else {
        streak = 0
      }
    }
  }
  if (thisWeek >= goal) streak++
  return { weeks: streak, thisWeek, target: goal, freezes, frozeLastWeek }
}

/** Consecutive active days ending today (or yesterday, if today has nothing yet). */
export function dailyStreak(dates: ISODate[], today: ISODate): number {
  const set = new Set(dates)
  let day = set.has(today) ? today : addDays(today, -1)
  let n = 0
  while (set.has(day) && n < 3660) {
    n++
    day = addDays(day, -1)
  }
  return n
}

export function longestDailyStreak(dates: ISODate[]): number {
  const sorted = [...new Set(dates)].sort()
  let best = 0
  let run = 0
  for (let i = 0; i < sorted.length; i++) {
    run = i > 0 && daysBetween(sorted[i - 1], sorted[i]) === 1 ? run + 1 : 1
    best = Math.max(best, run)
  }
  return best
}
