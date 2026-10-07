import { useLiveQuery } from 'dexie-react-hooks'
import { db, kvGet, kvSet } from '@/db/db'
import type { ISODate, Profile } from '@/domain/types'
import { dailyTargets } from '@/engines/nutrition/targets'
import { PERFECT_DAY_XP, pickQuests, QUESTS, questProgress, type QuestDef, type QuestFacts, type QuestId, type QuestProgress } from '@/engines/quests'
import { daysBetween, isoWeekday, todayISO } from '@/lib/dates'
import { uid } from '@/lib/id'
import { OZ_ML, produceServings, totalsOf } from './nutrition'

export interface QuestDay {
  date: ISODate
  ids: QuestId[]
  /** When each quest was completed (ms). */
  done: Partial<Record<QuestId, number>>
  /** When all three were done (the "perfect day" bonus was paid). */
  perfect?: number
}

export interface QuestStats {
  done: number
  perfect: number
}

const dayKey = (date: ISODate) => `quests:${date}`
export const QUEST_STATS_KEY = 'quests.stats'

/** Count something the quests care about that isn't a workout or a log (e.g. watching a tutorial). */
export async function markActivity(kind: 'tutorial' | 'play', date: ISODate = todayISO()): Promise<void> {
  const key = `act:${date}`
  const cur = (await kvGet<Record<string, number>>(key)) ?? {}
  await kvSet(key, { ...cur, [kind]: (cur[kind] ?? 0) + 1 })
}

export async function loadQuestFacts(profile: Profile, date: ISODate): Promise<QuestFacts> {
  const [workouts, logs, water, weightToday, lastWeight, act] = await Promise.all([
    db.workouts.where('date').equals(date).toArray(),
    db.foodLogs.where('date').equals(date).toArray(),
    db.water.where('date').equals(date).toArray(),
    db.weights.get(date),
    db.weights.orderBy('date').last(),
    kvGet<Record<string, number>>(`act:${date}`),
  ])
  const minutes = workouts.reduce((s, w) => s + Math.max(0, w.finishedAt - w.startedAt), 0) / 60000
  const t = dailyTargets(profile, { workoutMinutes: Math.round(minutes) })
  const weekday = isoWeekday(date)
  const plays = workouts.filter((w) => w.sessionKey.startsWith('play:')).length
  return {
    trainingDay: profile.trainingDays.includes(weekday),
    planDone: workouts.some((w) => w.kind === 'plan'),
    snacks: workouts.filter((w) => w.kind === 'snack').length,
    plays: Math.max(plays, act?.play ?? 0),
    activeMinutes: minutes,
    protein: totalsOf(logs).protein,
    proteinTarget: t.protein,
    waterMl: water.reduce((s, w) => s + w.oz, 0) * OZ_ML,
    waterTargetMl: t.waterMl,
    imperial: profile.units === 'imperial',
    mealsLogged: new Set(logs.map((l) => l.meal)).size,
    breakfastLogged: logs.some((l) => l.meal === 'breakfast'),
    produce: produceServings(logs),
    tutorials: act?.tutorial ?? 0,
    weighedIn: !!weightToday,
    lite: profile.trackingMode === 'lite',
    weekday,
    daysSinceWeighIn: lastWeight ? daysBetween(lastWeight.date, date) : null,
  }
}

/**
 * Check today's quests against the data, pay XP for any newly finished (and the perfect-day bonus),
 * and return what changed so the UI can celebrate. Safe to call often: it runs in one transaction
 * and never pays twice.
 */
export async function evaluateQuests(profile: Profile, date: ISODate = todayISO()): Promise<{ completed: QuestId[]; perfect: boolean; facts: QuestFacts }> {
  return db.transaction('rw', [db.kv, db.xpEvents, db.workouts, db.foodLogs, db.water, db.weights], async () => {
    const facts = await loadQuestFacts(profile, date)
    const stored = await kvGet<QuestDay>(dayKey(date))
    const day: QuestDay = stored ?? { date, ids: pickQuests(date, facts), done: {} }
    const completed: QuestId[] = []
    const now = Date.now()
    for (const id of day.ids) {
      if (day.done[id] || !questProgress(id, facts).done) continue
      day.done = { ...day.done, [id]: now }
      completed.push(id)
      await db.xpEvents.add({ id: uid('xp'), date, kind: 'quest', xp: QUESTS[id].xp, at: now })
    }
    let perfect = false
    if (!day.perfect && day.ids.every((id) => day.done[id])) {
      day.perfect = now
      perfect = true
      await db.xpEvents.add({ id: uid('xp'), date, kind: 'perfect-day', xp: PERFECT_DAY_XP, at: now })
    }
    if (!stored || completed.length || perfect) await kvSet(dayKey(date), day)
    if (completed.length || perfect) {
      const st = (await kvGet<QuestStats>(QUEST_STATS_KEY)) ?? { done: 0, perfect: 0 }
      await kvSet(QUEST_STATS_KEY, { done: st.done + completed.length, perfect: st.perfect + (perfect ? 1 : 0) })
    }
    return { completed, perfect, facts }
  })
}

export interface QuestItem {
  def: QuestDef
  title: string
  progress: QuestProgress
  /** Completed and paid. */
  claimed: boolean
}

export interface QuestBoard {
  date: ISODate
  items: QuestItem[]
  perfect: boolean
  doneCount: number
}

/** Today's quests with live progress. */
export function useQuests(profile: Profile | null | undefined, date: ISODate = todayISO()): QuestBoard | undefined {
  return useLiveQuery(async () => {
    if (!profile) return undefined
    const facts = await loadQuestFacts(profile, date)
    const day = (await kvGet<QuestDay>(dayKey(date))) ?? { date, ids: pickQuests(date, facts), done: {} }
    const items = day.ids.map((id) => {
      const def = QUESTS[id]
      const progress = questProgress(id, facts)
      return { def, title: def.title(facts), progress, claimed: !!day.done[id] }
    })
    return { date, items, perfect: !!day.perfect, doneCount: items.filter((i) => i.claimed || i.progress.done).length }
  }, [profile, date])
}

/** A cheap fingerprint of today's activity; changes whenever a quest might have progressed. */
export function useQuestSignal(profile: Profile | null | undefined, date: ISODate = todayISO()): string | undefined {
  return useLiveQuery(async () => {
    if (!profile) return undefined
    return JSON.stringify(await loadQuestFacts(profile, date))
  }, [profile, date])
}
