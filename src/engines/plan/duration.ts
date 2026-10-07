import { cycleDuration } from '@/anim/motion'
import { getExercise, motionFor } from '@/data/exercises'
import type { Modifier, PlannedBlock, PlannedItem, PlannedSession, Target } from './types'

/** Getting into position at the start of a set. */
export const SETUP_SEC = 5
/** Moving between exercises inside a superset, circuit or flow. */
export const SWITCH_SEC = 10
/** Between blocks: grab the dumbbells, glance at what's next. */
export const BLOCK_GAP_SEC = 20
/** Switching sides on per-side exercises. */
export const SIDE_SWITCH_SEC = 3
/** MET while resting between sets. */
export const REST_MET = 1.8

/** Exercises whose animation covers both sides in one cycle (twists): one cycle = one rep per side. */
export const BOTH_SIDES_PER_CYCLE = new Set(['russian-twist', 'db-russian-twist'])

const repCache = new Map<string, number>()

/** Seconds per rep, taken from the exercise's animation tempo so voice, animation and plan agree. */
export function repSeconds(exerciseId: string): number {
  let s = repCache.get(exerciseId)
  if (s === undefined) {
    const ex = getExercise(exerciseId)
    s = ex ? cycleDuration(motionFor(ex)) : 3
    s = Math.min(12, Math.max(1, s))
    repCache.set(exerciseId, s)
  }
  return s
}

const MODIFIED_REP: Record<Modifier, (rep: number) => number> = {
  tempo: (r) => r + 2,
  pause: (r) => r + 2,
  one_and_half: (r) => r * 1.6,
  extra_set: (r) => r,
}

/** Seconds of work in one set (both sides). */
export function workSeconds(exerciseId: string, target: Target, perSide: boolean, modifier?: Modifier): number {
  const sides = perSide ? 2 : 1
  const switchSec = perSide ? SIDE_SWITCH_SEC : 0
  if (target.kind === 'time') return target.seconds * sides + switchSec
  let rep = repSeconds(exerciseId)
  if (modifier) rep = MODIFIED_REP[modifier](rep)
  const cycles = BOTH_SIDES_PER_CYCLE.has(exerciseId) ? 1 : sides
  return Math.round(target.reps * rep * cycles + (cycles > 1 ? switchSec : 0))
}

/** Seconds for one pass through a block's items (no rest after). */
export function roundSeconds(b: PlannedBlock): number {
  const n = b.items.length
  if (!n) return 0
  const work = b.items.reduce((s, it) => s + it.workSec, 0)
  switch (b.format) {
    case 'flow':
      return work + SWITCH_SEC * (n - 1)
    case 'intervals':
      return work + (b.itemRestSec ?? 0) * (n - 1)
    default:
      return work + SETUP_SEC * n + SWITCH_SEC * (n - 1)
  }
}

export function blockSeconds(b: PlannedBlock): number {
  if (!b.items.length || b.rounds <= 0) return 0
  return b.rounds * roundSeconds(b) + (b.rounds - 1) * b.restSec
}

export function sessionSeconds(blocks: PlannedBlock[], gapSec = BLOCK_GAP_SEC): number {
  const live = blocks.filter((b) => b.items.length && b.rounds > 0)
  return live.reduce((s, b) => s + blockSeconds(b), 0) + gapSec * Math.max(0, live.length - 1)
}

/** Calories = MET × kg × hours, with rests and transitions at a light standing MET. */
export function sessionKcal(blocks: PlannedBlock[], kg: number, gapSec = BLOCK_GAP_SEC): number {
  let workMetSec = 0
  let workSec = 0
  for (const b of blocks) {
    if (!b.items.length || b.rounds <= 0) continue
    for (const it of b.items) {
      const met = getExercise(it.exerciseId)?.met ?? 3.5
      workMetSec += met * it.workSec * b.rounds
      workSec += it.workSec * b.rounds
    }
  }
  const total = sessionSeconds(blocks, gapSec)
  const restSec = Math.max(0, total - workSec)
  return Math.round(((workMetSec + REST_MET * restSec) * kg) / 3600)
}

/** Per-item work estimate refreshed after a change of target or modifier. */
export function withWork(it: PlannedItem): PlannedItem {
  return { ...it, workSec: workSeconds(it.exerciseId, it.target, it.perSide, it.modifier) }
}

export function formatDuration(sec: number): string {
  const m = Math.round(sec / 60)
  return m < 1 ? `${Math.round(sec)} s` : `${m} min`
}

export function estimateMinutes(s: Pick<PlannedSession, 'estSec'>): number {
  return Math.max(1, Math.round(s.estSec / 60))
}
