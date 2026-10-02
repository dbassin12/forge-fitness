import { TIPS } from '@/data/tips'
import type { Tip, TipContext } from '@/data/tips/types'
import type { Goal, ISODate } from '@/domain/types'

export interface TipSituation {
  date: ISODate
  hour: number
  /** ISO weekday, 1 = Monday. */
  weekday: number
  goal: Goal
  trainingDay: boolean
  workoutDoneToday: boolean
  daysSinceStart: number
  missedLastWorkout: boolean
  streakWeeks: number
  proteinBehind: boolean
  waterBehind: boolean
  overCalories: boolean
  underCalories: boolean
  shortSessions: boolean
  hasDumbbells: boolean
}

export function activeContexts(s: TipSituation): Set<TipContext> {
  const c = new Set<TipContext>(['any'])
  if (s.hour < 11) c.add('morning')
  if (s.hour >= 18) c.add('evening')
  if (s.weekday >= 6) c.add('weekend')
  if (s.daysSinceStart < 7) c.add('first-week')
  if (!s.trainingDay) c.add('rest-day')
  if (s.trainingDay && !s.workoutDoneToday) c.add('pre-workout')
  if (s.workoutDoneToday) c.add('post-workout')
  if (s.missedLastWorkout) c.add('missed-workout')
  if (s.streakWeeks >= 2) c.add('streak')
  if (s.proteinBehind) c.add('low-protein')
  if (s.waterBehind) c.add('low-water')
  if (s.overCalories) c.add('over-calories')
  if (s.underCalories) c.add('under-calories')
  if (s.shortSessions) c.add('busy')
  if (s.hasDumbbells) c.add('dumbbells')
  return c
}

function hash(str: string): number {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619)
  return h >>> 0
}

/** Tips that fit right now, most specific first. */
export function rankTips(s: TipSituation, pool: Tip[] = TIPS): { tip: Tip; weight: number }[] {
  const ctx = activeContexts(s)
  return pool
    .filter((t) => !t.contexts.includes('rest-between-sets') || t.contexts.length > 1)
    .filter((t) => !t.goals || t.goals.includes(s.goal))
    .map((t) => {
      const specific = t.contexts.filter((c) => c !== 'any' && c !== 'rest-between-sets' && ctx.has(c)).length
      const general = t.contexts.includes('any') ? 1 : 0
      const goal = t.goals?.includes(s.goal) ? 1 : 0
      return { tip: t, weight: specific * 3 + general + goal }
    })
    .filter((x) => x.weight > 0)
    .sort((a, b) => b.weight - a.weight)
}

/** One tip for today: drawn (deterministically per day) from the best-matching tips. */
export function tipOfTheDay(s: TipSituation, salt = ''): Tip {
  const ranked = rankTips(s)
  const top = ranked[0]?.weight ?? 0
  const pool = ranked.filter((x) => x.weight >= Math.max(1, top - 1))
  const pick = pool[hash(`${s.date}:${salt}`) % Math.max(1, pool.length)]
  return pick?.tip ?? TIPS[hash(s.date) % TIPS.length]
}
