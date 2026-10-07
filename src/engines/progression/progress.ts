import { getExercise } from '@/data/exercises'
import type { Experience, ISODate } from '@/domain/types'
import { isAllowed, type PlanContext } from '../plan/equipment'
import { LADDER_IDS, LADDERS } from '../plan/ladders'
import { MODIFIER_LABEL, MODIFIERS, modifierFor } from '../plan/prescribe'
import type { ExerciseProgress, FitnessTest, LadderId, PlanInputs, ProgressState, Target } from '../plan/types'

/** Sessions to wait after a rung change before changing that ladder again. */
export const HYSTERESIS = 2

const XP_INDEX: Record<Experience, 0 | 1 | 2> = { beginner: 0, intermediate: 1, advanced: 2 }

export function emptyProgress(): ProgressState {
  const ladders = {} as ProgressState['ladders']
  for (const id of LADDER_IDS) ladders[id] = { rung: 0, changedAt: -HYSTERESIS }
  return { version: 1, sessionsCompleted: 0, ladders, exercises: {}, preferred: {}, tests: [] }
}

function setRung(state: ProgressState, ladder: LadderId, rung: number) {
  const max = LADDERS[ladder].exercises.length - 1
  state.ladders[ladder] = { rung: Math.max(0, Math.min(max, rung)), changedAt: -HYSTERESIS }
}

/** Where each ladder starts: from the fitness test when there is one, otherwise from experience. */
export function initialProgress(inputs: Pick<PlanInputs, 'experience'>, test?: FitnessTest): ProgressState {
  const state = emptyProgress()
  const xp = XP_INDEX[inputs.experience]
  for (const id of LADDER_IDS) setRung(state, id, LADDERS[id].start[xp])
  if (test) applyTest(state, test)
  return state
}

function seedGoal(state: ProgressState, exerciseId: string, goal: number) {
  state.exercises[exerciseId] = { goal, topStreak: 0, failStreak: 0, modifierStage: 0, best: 0 }
}

/** Map fitness-test results onto ladder rungs and conservative starting goals (~60 % of max). */
export function applyTest(state: ProgressState, t: FitnessTest): ProgressState {
  const pu = t.pushups === undefined ? undefined : Math.max(0, t.pushups)
  const sq = t.squats60 === undefined ? undefined : Math.max(0, t.squats60)
  const pl = t.plankSec === undefined ? undefined : Math.max(0, t.plankSec)

  if (pu !== undefined) {
    setRung(state, 'h_push', pu < 1 ? 1 : pu < 5 ? 2 : pu < 30 ? 3 : 4)
    if (pu >= 5 && pu < 30) seedGoal(state, 'pushup', Math.max(4, Math.round(pu * 0.6)))
    setRung(state, 'v_push', pu >= 20 ? 1 : 0)
    setRung(state, 'h_pull', pu >= 15 ? 3 : 2)
    setRung(state, 'triceps', pu >= 15 ? 2 : pu >= 5 ? 1 : 0)
  }
  if (sq !== undefined) {
    setRung(state, 'squat', sq < 15 ? 0 : sq < 30 ? 1 : sq < 45 ? 2 : 3)
    setRung(state, 'lunge', sq < 20 ? 0 : sq < 35 ? 1 : 2)
    setRung(state, 'bridge', sq < 30 ? 0 : 1)
    setRung(state, 'hinge', sq < 15 ? 0 : 1)
  }
  if (pl !== undefined) {
    setRung(state, 'core_ext', pl < 20 ? 1 : pl < 45 ? 2 : pl < 90 ? 3 : 4)
    if (pl >= 20 && pl < 45) seedGoal(state, 'forearm-plank', Math.max(20, Math.round((pl * 0.6) / 5) * 5))
    setRung(state, 'core_lat', pl < 20 ? 0 : pl < 45 ? 1 : pl < 90 ? 2 : 3)
    setRung(state, 'core_flex', pl < 20 ? 0 : pl < 45 ? 1 : pl < 90 ? 2 : 3)
  }
  if (pu !== undefined || sq !== undefined) {
    const parts = [sq !== undefined ? sq / 45 : undefined, pu !== undefined ? pu / 30 : undefined].filter((x) => x !== undefined)
    const fitness = (parts.reduce((a, b) => a + b, 0) / parts.length) * 2
    setRung(state, 'cond', fitness < 0.6 ? 1 : fitness < 1.2 ? 3 : fitness < 1.8 ? 6 : 8)
  }

  state.tests = [...state.tests.filter((x) => x.date !== t.date), t].sort((a, b) => a.date.localeCompare(b.date))
  return state
}

export type Rating = 'easy' | 'right' | 'hard'

export interface PerformedExercise {
  exerciseId: string
  ladder?: LadderId
  /** The planned target (goal, min, max). */
  target: Target
  /** Reps (or seconds) achieved per set; per side for per-side exercises. */
  sets: number[]
  rating?: Rating
}

export interface WorkoutResult {
  date: ISODate
  /** Planned session from the queue (moves the queue on). Snacks and tests don't. */
  planned: boolean
  deload?: boolean
  feedback?: Rating
  exercises: PerformedExercise[]
}

export type ChangeKind = 'goal_up' | 'goal_down' | 'advance' | 'regress' | 'modifier_on' | 'modifier_off' | 'pr'

export interface ProgressChange {
  kind: ChangeKind
  exerciseId: string
  ladder?: LadderId
  message: string
}

const nameOf = (id: string) => getExercise(id)?.name ?? id
const unitOf = (t: Target) => (t.kind === 'time' ? ' s' : ' reps')

function nextRung(ladder: LadderId, from: number, dir: 1 | -1, ctx?: PlanContext): number | undefined {
  const list = LADDERS[ladder].exercises
  for (let i = from + dir; i >= 0 && i < list.length; i += dir) {
    const ex = getExercise(list[i])
    if (ex && (!ctx || isAllowed(ex, ctx))) return i
  }
  return undefined
}

/**
 * Double progression with fixed dumbbells:
 * - hit the goal on every set → goal +1 rep (+5 s for holds), until the top of the range;
 * - at the top of the range twice in a row (once if it felt easy) → next ladder rung, or — at the
 *   top of the ladder / for swapped-in exercises — a harder modifier (tempo, pause, 1½ reps, extra set);
 * - clearly short (2+ sets under the minimum, or "too hard" without hitting the goal) → drop the
 *   modifier, then the goal, then (after two such sessions) step down a rung.
 * Rung changes respect a short cool-off so one bad day doesn't undo a month.
 */
export function applyWorkout(
  prev: ProgressState,
  result: WorkoutResult,
  ctx?: PlanContext,
): { state: ProgressState; changes: ProgressChange[] } {
  const state: ProgressState = structuredClone(prev)
  const changes: ProgressChange[] = []
  const now = state.sessionsCompleted + (result.planned ? 1 : 0)
  const movedLadders = new Set<LadderId>()

  for (const perf of result.exercises) {
    const values = perf.sets.filter((v) => Number.isFinite(v) && v >= 0)
    if (!values.length) continue
    const ex = getExercise(perf.exerciseId)
    if (!ex) continue
    const t = perf.target
    const goal = t.kind === 'time' ? t.seconds : t.reps
    const step = t.kind === 'time' ? 5 : 1
    const p: ExerciseProgress = state.exercises[ex.id] ?? { goal, topStreak: 0, failStreak: 0, modifierStage: 0, best: 0 }
    p.goal = goal
    p.lastDate = result.date

    const top = Math.max(...values)
    if (top > p.best) {
      if (p.best > 0) changes.push({ kind: 'pr', exerciseId: ex.id, message: `New best: ${top}${unitOf(t)} of ${nameOf(ex.id)}` })
      p.best = top
    }
    state.exercises[ex.id] = p
    // Lighter weeks and non-plan workouts never move the plan.
    if (result.deload || !result.planned) continue

    const rating = perf.rating ?? result.feedback
    const hitAll = values.every((v) => v >= goal)
    const underMin = values.filter((v) => v < t.min).length
    const ladder = perf.ladder
    const lp = ladder ? state.ladders[ladder] : undefined
    // Position on the ladder (−1 for swapped-in exercises that aren't on it).
    const idx = ladder ? LADDERS[ladder].exercises.indexOf(ex.id) : -1
    const canMoveRung = !!ladder && !!lp && !movedLadders.has(ladder) && now - lp.changedAt >= HYSTERESIS

    if (hitAll && rating !== 'hard') {
      p.failStreak = 0
      if (goal < t.max) {
        const jump = rating === 'easy' && Math.min(...values) >= goal + 2 * step ? 2 * step : step
        p.goal = Math.min(t.max, goal + jump)
        p.topStreak = 0
        changes.push({ kind: 'goal_up', exerciseId: ex.id, message: `${nameOf(ex.id)}: next time aim for ${p.goal}${unitOf(t)}` })
        continue
      }
      p.topStreak += 1
      if (p.topStreak < (rating === 'easy' ? 1 : 2)) continue
      // Skip rungs that this user can't do (missing equipment, aches) on the way up.
      const up = ladder && lp && idx >= 0 ? nextRung(ladder, Math.max(idx, lp.rung), 1, ctx) : undefined
      if (up !== undefined && ladder && lp) {
        // A harder rung exists: take it (or wait out the cool-off with the streak intact).
        if (!canMoveRung) continue
        lp.rung = up
        lp.changedAt = now
        movedLadders.add(ladder)
        p.topStreak = 0
        const nextId = LADDERS[ladder].exercises[up]
        const q = state.exercises[nextId]
        if (q) Object.assign(q, { topStreak: 0, failStreak: 0 })
        changes.push({ kind: 'advance', exerciseId: ex.id, ladder, message: `Level up! ${nameOf(ex.id)} → ${nameOf(nextId)}` })
      } else if (ctx?.program !== 'yoga' && p.modifierStage < MODIFIERS.length) {
        // (Yoga doesn't stack "harder" modifiers: at the top of a ladder the hold simply stays.)
        // Top of the ladder (or a swapped-in exercise) with fixed weights: make the reps harder.
        p.modifierStage += 1
        p.topStreak = 0
        if (t.kind === 'reps') p.goal = Math.max(t.min, Math.round((t.min + t.max) / 2))
        const m = modifierFor(p.modifierStage, ex.measure)
        changes.push({
          kind: 'modifier_on',
          exerciseId: ex.id,
          message: `${nameOf(ex.id)} is getting easy, so here's a new challenge: ${m ? MODIFIER_LABEL[m] : 'extra set'}`,
        })
      }
      continue
    }

    const clearFail = underMin >= 2 || (rating === 'hard' && !hitAll)
    if (!clearFail) {
      p.topStreak = 0
      if (rating !== 'hard') p.failStreak = 0
      continue
    }
    p.topStreak = 0
    p.failStreak += 1
    if (p.modifierStage > 0) {
      p.modifierStage -= 1
      changes.push({ kind: 'modifier_off', exerciseId: ex.id, message: `${nameOf(ex.id)}: easing off the extra challenge for now` })
    } else if (goal > t.min) {
      p.goal = Math.max(t.min, goal - (underMin >= 2 ? 2 * step : step))
      changes.push({ kind: 'goal_down', exerciseId: ex.id, message: `${nameOf(ex.id)}: next time aim for ${p.goal}${unitOf(t)}` })
    } else if (p.failStreak >= 2 && idx >= 0 && canMoveRung && ladder && lp) {
      const down = nextRung(ladder, Math.min(idx, lp.rung), -1, ctx)
      if (down !== undefined) {
        lp.rung = down
        lp.changedAt = now
        movedLadders.add(ladder)
        p.failStreak = 0
        const prevId = LADDERS[ladder].exercises[down]
        changes.push({ kind: 'regress', exerciseId: ex.id, ladder, message: `${nameOf(ex.id)} → ${nameOf(prevId)} to build strength, then back up` })
      }
    }
  }

  if (result.planned) state.sessionsCompleted += 1
  return { state, changes }
}

/** Is a fitness re-test due (every 4 weeks)? */
export function retestDue(state: ProgressState, today: ISODate): boolean {
  const last = state.tests[state.tests.length - 1]
  if (!last) return false
  const ms = new Date(today).getTime() - new Date(last.date).getTime()
  return ms >= 28 * 86_400_000
}
