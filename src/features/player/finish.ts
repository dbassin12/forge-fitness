import { db, type ExerciseLog, type WorkoutLog } from '@/db/db'
import type { Profile } from '@/domain/types'
import { workoutXp, XP, type Achievement } from '@/engines/gamification'
import { planContext, planInputsFromProfile, type PlannedSession, type Target } from '@/engines/plan'
import { applyWorkout, type PerformedExercise, type ProgressChange, type Rating } from '@/engines/progression/progress'
import type { ProgressState } from '@/engines/plan/types'
import { todayISO } from '@/lib/dates'
import { uid } from '@/lib/id'
import { addXp, computeStats, unlockAchievements } from '@/state/gamification'
import { KEYS, saveProgress } from '@/state/store'
import type { Step, WorkStep } from './steps'

/** Recorded value per work step id (reps, or seconds). */
export type StepValues = Record<string, number>

export interface Aggregated {
  logKey: string
  step: WorkStep
  /** One value per set (per-side sets keep the weaker side). */
  sets: number[]
}

export function aggregate(steps: Step[], values: StepValues): Aggregated[] {
  const map = new Map<string, { step: WorkStep; bySet: Map<number, number> }>()
  for (const st of steps) {
    if (st.kind !== 'work') continue
    const v = values[st.id]
    if (v === undefined) continue
    let g = map.get(st.logKey)
    if (!g) {
      g = { step: st, bySet: new Map() }
      map.set(st.logKey, g)
    }
    const prev = g.bySet.get(st.setIndex)
    g.bySet.set(st.setIndex, prev === undefined ? v : Math.min(prev, v))
  }
  return [...map.entries()].map(([logKey, g]) => ({
    logKey,
    step: g.step,
    sets: [...g.bySet.entries()].sort((a, b) => a[0] - b[0]).map(([, v]) => v),
  }))
}

export interface FinishResult {
  log: WorkoutLog
  changes: ProgressChange[]
  achievements: Achievement[]
  xp: number
  minutes: number
}

export async function finishWorkout(args: {
  profile: Profile
  progress: ProgressState
  session: PlannedSession
  steps: Step[]
  values: StepValues
  startedAt: number
  activeSec: number
  feedback?: Rating
  snack: boolean
}): Promise<FinishResult> {
  const { profile, progress, session, steps, values, snack } = args
  const date = todayISO()
  const groups = aggregate(steps, values)
  const counted = groups.filter((g) => g.step.blockKind === 'main' || g.step.blockKind === 'finisher')
  const mainSets = groups.filter((g) => g.step.blockKind === 'main').reduce((n, g) => n + g.sets.length, 0)
  const planned = !snack && mainSets > 0

  const performed: PerformedExercise[] = counted.map((g) => ({
    exerciseId: g.step.item.exerciseId,
    ladder: g.step.item.ladder,
    target: g.step.item.target as Target,
    sets: g.sets,
  }))
  const ctx = planContext(planInputsFromProfile(profile))
  const { state, changes } = applyWorkout(progress, { date, planned, deload: session.deload, feedback: args.feedback, exercises: performed }, ctx)
  await saveProgress(state)

  const minutes = Math.max(1, Math.round(args.activeSec / 60))
  const kcal = Math.round(session.estKcal * Math.min(1.5, args.activeSec / Math.max(60, session.estSec)))
  const prs = changes.filter((c) => c.kind === 'pr').length
  const levelUps = changes.filter((c) => c.kind === 'advance').length
  const base = workoutXp({ minutes, prs: 0, levelUps: 0, snack, feedback: !!args.feedback })
  const xp = base + prs * XP.pr + levelUps * XP.levelUp

  const exercises: ExerciseLog[] = groups.map((g) => {
    const it = g.step.item
    return {
      exerciseId: it.exerciseId,
      slot: it.slot !== undefined ? String(it.slot) : undefined,
      ladder: it.ladder,
      block: g.step.blockKind,
      sets: g.sets.map((v) =>
        it.target.kind === 'time'
          ? { seconds: v, targetSeconds: it.target.seconds, loadLb: it.loadLb }
          : { reps: v, targetReps: it.target.reps, loadLb: it.loadLb },
      ),
    }
  })
  const log: WorkoutLog = {
    id: uid('w'),
    date,
    startedAt: args.startedAt,
    finishedAt: Date.now(),
    sessionKey: session.key,
    title: session.title,
    kind: snack ? 'snack' : planned ? 'plan' : 'custom',
    exercises,
    feedback: args.feedback,
    calories: kcal,
    xp,
  }
  await db.workouts.add(log)
  await addXp(snack ? 'snack' : 'workout', base, date)
  for (let i = 0; i < prs; i++) await addXp('pr', XP.pr, date)
  for (let i = 0; i < levelUps; i++) await addXp('levelup', XP.levelUp, date)
  if (planned) await db.kv.delete(KEYS.swaps)
  const achievements = await unlockAchievements(await computeStats(profile, state, date))
  return { log, changes, achievements, xp: xp + achievements.length * XP.achievement, minutes }
}
