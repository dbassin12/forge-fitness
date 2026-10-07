import { useLiveQuery } from 'dexie-react-hooks'
import { db, type WorkoutLog } from '@/db/db'
import type { ISODate, Profile } from '@/domain/types'
import { getExercise } from '@/data/exercises'
import {
  ACHIEVEMENTS,
  dailyStreak,
  EMPTY_STATS,
  levelForXp,
  newlyUnlocked,
  weeklyStreak,
  XP,
  type Achievement,
  type Stats,
} from '@/engines/gamification'
import { LADDERS, type ProgressState } from '@/engines/plan'
import { todayISO } from '@/lib/dates'
import { loadProgress } from './store'
import { uid } from '@/lib/id'

const PUSHUP_FAMILY = new Set([...LADDERS.h_push.exercises, 'db-floor-press'].filter((id) => !id.startsWith('db-')))
const PLANKS = new Set(['forearm-plank', 'knee-plank', 'high-plank'])

export async function addXp(kind: string, xp: number, date: ISODate = todayISO()): Promise<void> {
  await db.xpEvents.add({ id: uid('xp'), date, kind, xp, at: Date.now() })
}

export function useTotalXp(): number | undefined {
  return useLiveQuery(async () => {
    let total = 0
    await db.xpEvents.each((e) => {
      total += e.xp
    })
    return total
  }, [])
}

export function useLevel() {
  const xp = useTotalXp()
  return xp === undefined ? undefined : { xp, ...levelForXp(xp) }
}

/** Dates of completed plan workouts (for weekly streaks). */
export function planDates(workouts: WorkoutLog[]): ISODate[] {
  return workouts.filter((w) => w.kind === 'plan').map((w) => w.date)
}

export async function computeStats(profile: Profile, progress: ProgressState, today: ISODate = todayISO()): Promise<Stats> {
  const s: Stats = { ...EMPTY_STATS }
  const workouts = await db.workouts.toArray()
  for (const w of workouts) {
    if (w.kind === 'plan') s.workouts++
    if (w.kind === 'snack') s.snacks++
    if (w.sessionKey.startsWith('play:')) s.plays++
    if (w.sessionKey === 'play:deck:52') s.fullDecks++
    s.minutes += Math.max(0, (w.finishedAt - w.startedAt) / 60000)
    const hour = new Date(w.finishedAt).getHours()
    if (hour < 7) s.earlyBird = true
    if (hour >= 21) s.nightOwl = true
    for (const e of w.exercises) {
      const ex = getExercise(e.exerciseId)
      if (!ex) continue
      const sides = ex.perSide ? 2 : 1
      for (const set of e.sets) {
        if (PUSHUP_FAMILY.has(ex.id)) s.pushupReps += set.reps ?? 0
        if (ex.pattern === 'squat' || ex.pattern === 'lunge') s.squatReps += (set.reps ?? 0) * sides
        if (PLANKS.has(ex.id)) s.bestPlankSec = Math.max(s.bestPlankSec, set.seconds ?? 0)
      }
    }
  }
  for (const t of progress.tests) s.bestPlankSec = Math.max(s.bestPlankSec, t.plankSec ?? 0)
  s.minutes = Math.round(s.minutes)
  s.prs = await db.xpEvents.where('kind').equals('pr').count()
  s.levelUps = await db.xpEvents.where('kind').equals('levelup').count()
  s.reachedPushup = progress.ladders.h_push.rung >= LADDERS.h_push.exercises.indexOf('pushup')
  s.weeklyStreak = weeklyStreak(planDates(workouts), profile.daysPerWeek, today).weeks
  const active = new Set<ISODate>(workouts.map((w) => w.date))
  await db.foodLogs.each((f) => {
    active.add(f.date)
  })
  s.dailyStreak = dailyStreak([...active], today)
  s.tests = progress.tests.length
  s.foodLogs = await db.foodLogs.count()
  s.weighIns = await db.weights.count()
  s.photos = await db.photos.count()
  const hits = await db.kv.get('nutrition.hits')
  const h = (hits?.value ?? {}) as { protein?: ISODate[]; water?: ISODate[] }
  s.proteinDays = h.protein?.length ?? 0
  s.waterDays = h.water?.length ?? 0
  const q = (await db.kv.get('quests.stats'))?.value as { done?: number; perfect?: number } | undefined
  s.quests = q?.done ?? 0
  s.perfectDays = q?.perfect ?? 0
  return s
}

/** Re-check every achievement against the current data (cheap; call after anything notable). */
export async function checkAchievements(): Promise<Achievement[]> {
  const profile = (await db.kv.get('profile'))?.value as Profile | undefined
  if (!profile) return []
  const progress = await loadProgress(profile)
  return unlockAchievements(await computeStats(profile, progress))
}

/**
 * Persist any newly earned achievements (with their XP) and return them for celebration. One
 * transaction, so two checks racing (end of a workout + the reward watcher) can't pay twice.
 */
export async function unlockAchievements(stats: Stats): Promise<Achievement[]> {
  return db.transaction('rw', db.achievements, db.xpEvents, async () => {
    const unlocked = new Set((await db.achievements.toArray()).map((x) => x.id))
    const fresh = newlyUnlocked(stats, unlocked)
    for (const a of fresh) {
      await db.achievements.put({ id: a.id, unlockedAt: Date.now() })
      await db.xpEvents.add({ id: uid('xp'), date: todayISO(), kind: 'achievement', xp: XP.achievement, at: Date.now() })
    }
    return fresh
  })
}

export function useUnlocked(): Map<string, number> | undefined {
  return useLiveQuery(async () => new Map((await db.achievements.toArray()).map((x) => [x.id, x.unlockedAt])), [])
}

export { ACHIEVEMENTS }
