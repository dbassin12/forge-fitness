import { useEffect, useRef, useState } from 'react'
import { db, kvGet } from '@/db/db'
import type { ISODate } from '@/domain/types'
import { getExercise } from '@/data/exercises'
import { ACHIEVEMENTS, levelForXp, weeklyStreak, type Achievement } from '@/engines/gamification'
import { dailyTargets } from '@/engines/nutrition/targets'
import { weekReview, type Review } from '@/engines/review'
import { addDays, parseISODate } from '@/lib/dates'
import { planDates } from './gamification'
import type { QuestDay } from './quests'
import type { PlanState } from './plan'

export interface RecapData {
  weekOf: ISODate
  review: Review
  /** Reps across every logged set (one-sided moves count both sides). */
  reps: number
  topExercise?: { id: string; name: string; reps: number }
  workoutsAll: number
  plays: number
  xp: number
  level: number
  streakWeeks: number
  badges: Achievement[]
  proteinByDay: { date: ISODate; protein: number }[]
  proteinTarget: number
  waterDays: number
  questsDone: number
  perfectDays: number
}

export async function loadRecap(plan: PlanState, weekOf: ISODate): Promise<RecapData> {
  const end = addDays(weekOf, 6)
  const [workouts, food, weights, xpRows, allXp, ach, hits] = await Promise.all([
    db.workouts.toArray(),
    db.foodLogs.where('date').between(weekOf, end, true, true).toArray(),
    db.weights.where('date').between(weekOf, end, true, true).toArray(),
    db.xpEvents.where('date').between(weekOf, end, true, true).toArray(),
    db.xpEvents.toArray(),
    db.achievements.toArray(),
    kvGet<{ water?: ISODate[] }>('nutrition.hits'),
  ])
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekOf, i))
  const questDays = await Promise.all(days.map((d) => kvGet<QuestDay>(`quests:${d}`)))
  const p = plan.profile
  const t = dailyTargets(p)
  const byDay = new Map<ISODate, { kcal: number; protein: number }>()
  for (const f of food) {
    const cur = byDay.get(f.date) ?? { kcal: 0, protein: 0 }
    byDay.set(f.date, { kcal: cur.kcal + f.kcal, protein: cur.protein + f.protein })
  }
  const prevWeek = addDays(weekOf, -7)
  const prevDone = workouts.filter((w) => w.kind === 'plan' && w.date >= prevWeek && w.date < weekOf).length
  const review = weekReview({
    weekOf,
    workouts: workouts.map((w) => ({ date: w.date, kind: w.kind, minutes: (w.finishedAt - w.startedAt) / 60000 })),
    daysPerWeek: p.daysPerWeek,
    sessionMinutes: p.sessionMinutes,
    food: [...byDay.entries()].map(([date, v]) => ({ date, ...v })),
    kcalTarget: t.kcal,
    proteinTarget: t.protein,
    weights,
    lastWeekCompletion: prevDone / Math.max(1, p.daysPerWeek),
  })
  const inWeek = workouts.filter((w) => w.date >= weekOf && w.date <= end && w.kind !== 'test')
  const repsBy = new Map<string, number>()
  for (const w of inWeek)
    for (const e of w.exercises) {
      const ex = getExercise(e.exerciseId)
      const sides = ex?.perSide ? 2 : 1
      for (const s of e.sets) if (s.reps) repsBy.set(e.exerciseId, (repsBy.get(e.exerciseId) ?? 0) + s.reps * sides)
    }
  const top = [...repsBy.entries()].sort((a, b) => b[1] - a[1])[0]
  // Local midnight to midnight (parseISODate gives noon, which would split Mondays).
  const midnight = (iso: ISODate) => {
    const d = parseISODate(iso)
    d.setHours(0, 0, 0, 0)
    return d.getTime()
  }
  const from = midnight(weekOf)
  const to = midnight(addDays(weekOf, 7))
  const total = allXp.reduce((s, e) => s + e.xp, 0)
  return {
    weekOf,
    review,
    reps: [...repsBy.values()].reduce((a, b) => a + b, 0),
    topExercise: top ? { id: top[0], name: getExercise(top[0])?.name ?? top[0], reps: top[1] } : undefined,
    workoutsAll: inWeek.length,
    plays: inWeek.filter((w) => w.sessionKey.startsWith('play:')).length,
    xp: xpRows.reduce((s, e) => s + e.xp, 0),
    level: levelForXp(total).level,
    streakWeeks: weeklyStreak(planDates(workouts.filter((w) => w.date <= end)), p.daysPerWeek, end).weeks,
    badges: ach.filter((a) => a.unlockedAt >= from && a.unlockedAt < to).map((a) => ACHIEVEMENTS.find((x) => x.id === a.id)).filter((a): a is Achievement => !!a),
    proteinByDay: days.map((date) => ({ date, protein: byDay.get(date)?.protein ?? 0 })),
    proteinTarget: t.protein,
    waterDays: (hits?.water ?? []).filter((d) => d >= weekOf && d <= end).length,
    questsDone: questDays.reduce((s, q) => s + Object.keys(q?.done ?? {}).length, 0),
    perfectDays: questDays.filter((q) => q?.perfect).length,
  }
}

/**
 * Last week's recap, computed once: it's a snapshot of a finished week, so changing the plan from
 * the "Next week" slide mustn't rewrite it while it's on screen.
 */
export function useRecap(plan: PlanState | null, weekOf: ISODate): RecapData | undefined {
  const [data, setData] = useState<{ weekOf: ISODate; recap: RecapData } | undefined>(undefined)
  const ready = !!plan
  const planRef = useRef(plan)
  planRef.current = plan
  useEffect(() => {
    if (!ready || !planRef.current) return
    let live = true
    void loadRecap(planRef.current, weekOf).then((recap) => live && setData({ weekOf, recap }))
    return () => {
      live = false
    }
  }, [ready, weekOf])
  return data?.weekOf === weekOf ? data.recap : undefined
}
