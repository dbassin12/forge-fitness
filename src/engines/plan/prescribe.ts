import type { Experience, Goal } from '@/domain/types'
import type { ExerciseDef } from '@/data/exercises/types'
import { contextNotes, loadFor, type PlanContext } from './equipment'
import { workSeconds } from './duration'
import type { LadderId, Modifier, PlannedItem, Priority, ProgressState, Target } from './types'

export interface Scheme {
  sets: number
  /** Rep range for rep-based exercises (holds keep their own range in seconds). */
  range: [number, number]
  rest: number
}

/** Sets × reps × rest by goal and slot priority. */
export const SCHEMES: Record<Goal, Record<Priority, Scheme>> = {
  build_muscle: {
    1: { sets: 3, range: [8, 12], rest: 75 },
    2: { sets: 3, range: [8, 12], rest: 60 },
    3: { sets: 2, range: [10, 15], rest: 45 },
    4: { sets: 2, range: [12, 20], rest: 30 },
  },
  get_stronger: {
    1: { sets: 4, range: [5, 8], rest: 105 },
    2: { sets: 3, range: [6, 10], rest: 90 },
    3: { sets: 2, range: [8, 12], rest: 60 },
    4: { sets: 2, range: [10, 15], rest: 45 },
  },
  lose_fat: {
    1: { sets: 3, range: [10, 15], rest: 45 },
    2: { sets: 3, range: [10, 15], rest: 40 },
    3: { sets: 2, range: [12, 20], rest: 30 },
    4: { sets: 2, range: [15, 20], rest: 30 },
  },
  general_fitness: {
    1: { sets: 3, range: [8, 12], rest: 60 },
    2: { sets: 3, range: [10, 15], rest: 45 },
    3: { sets: 2, range: [10, 15], rest: 40 },
    4: { sets: 2, range: [12, 20], rest: 30 },
  },
}

export const MODIFIERS: Modifier[] = ['tempo', 'pause', 'one_and_half', 'extra_set']

export const MODIFIER_LABEL: Record<Modifier, string> = {
  tempo: 'Slow tempo',
  pause: 'Paused reps',
  one_and_half: '1½ reps',
  extra_set: 'Extra set',
}

export const MODIFIER_NOTE: Record<Modifier, string> = {
  tempo: 'Take 3 seconds to lower on every rep',
  pause: 'Pause for 2 seconds at the hardest point',
  one_and_half: 'Go down, come halfway up, go down again, then all the way up',
  extra_set: 'One bonus set today',
}

export function modifierFor(stage: number, measure: ExerciseDef['measure']): Modifier | undefined {
  if (stage <= 0) return undefined
  // Holds can't be slowed down: their only upgrade is volume.
  if (measure === 'time') return 'extra_set'
  return MODIFIERS[Math.min(stage, MODIFIERS.length) - 1]
}

export function setsFor(scheme: Scheme, priority: Priority, experience: Experience): number {
  let s = scheme.sets
  if (experience === 'beginner' && priority <= 2) s = Math.max(2, s - 1)
  if (experience === 'advanced' && priority === 1) s += 1
  return s
}

/** Rep (or seconds) range for an exercise under a goal scheme. */
export function rangeFor(ex: ExerciseDef, scheme: Scheme): [number, number] {
  const [eLo, eHi] = ex.range
  if (ex.measure === 'time') return [eLo, eHi]
  const [sLo, sHi] = scheme.range
  const lo = Math.max(eLo, sLo)
  const hi = Math.min(eHi, sHi)
  if (hi - lo >= 3) return [lo, hi]
  // The scheme barely overlaps what this exercise is good for (e.g. a strength range on wall
  // push-ups): take a window of the exercise's own range as close to the scheme as possible.
  const width = Math.min(eHi - eLo, Math.max(3, sHi - sLo))
  const start = Math.round(Math.min(Math.max((sLo + sHi) / 2 - width / 2, eLo), eHi - width))
  return [start, start + width]
}

export function makeTarget(ex: ExerciseDef, value: number, min = value, max = value): Target {
  return ex.measure === 'time'
    ? { kind: 'time', seconds: value, min, max }
    : { kind: 'reps', reps: value, min, max }
}

export function targetValue(t: Target): number {
  return t.kind === 'time' ? t.seconds : t.reps
}

export interface Prescription {
  item: PlannedItem
  sets: number
  restSec: number
}

export function prescribe(args: {
  ex: ExerciseDef
  priority: Priority
  ladder?: LadderId
  goal: Goal
  experience: Experience
  progress: ProgressState
  ctx: PlanContext
}): Prescription {
  const { ex, priority, ladder, ctx } = args
  const scheme = SCHEMES[args.goal][priority]
  const [lo, hi] = rangeFor(ex, scheme)
  const p = args.progress.exercises[ex.id]
  const value = Math.min(hi, Math.max(lo, Math.round(p?.goal ?? lo)))
  const modifier = modifierFor(p?.modifierStage ?? 0, ex.measure)
  let sets = setsFor(scheme, priority, args.experience)
  if (modifier === 'extra_set') sets += 1
  const target = makeTarget(ex, value, lo, hi)
  const notes = [...(modifier && modifier !== 'extra_set' ? [MODIFIER_NOTE[modifier]] : []), ...contextNotes(ex, ctx)]
  return {
    item: {
      exerciseId: ex.id,
      ladder,
      priority,
      target,
      perSide: !!ex.perSide,
      workSec: workSeconds(ex.id, target, !!ex.perSide, modifier),
      loadLb: loadFor(ex, ctx.av),
      modifier,
      notes,
    },
    sets,
    restSec: scheme.rest,
  }
}
