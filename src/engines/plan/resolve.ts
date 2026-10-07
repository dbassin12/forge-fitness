import { getExercise } from '@/data/exercises'
import { LADDERS } from './ladders'
import { availability, isAllowed, type PlanContext } from './equipment'
import type { LadderId, PlanInputs } from './types'

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x))

export function planContext(inputs: Pick<PlanInputs, 'equipment' | 'aches' | 'quietMode' | 'program'>): PlanContext {
  return { av: availability(inputs.equipment), aches: inputs.aches, quietMode: inputs.quietMode, program: inputs.program ?? 'strength' }
}

export interface ResolveOptions {
  /** Rotation index for ladders with variety (cardio, curls). */
  variant?: number
  exclude?: ReadonlySet<string>
}

/**
 * The exercise to do for a ladder at a rung: the hardest allowed rung at or below it (safer),
 * otherwise the easiest allowed rung above it.
 */
export function resolveLadder(
  ladder: LadderId,
  rung: number,
  ctx: PlanContext,
  opts: ResolveOptions = {},
): { exerciseId: string; rung: number } | undefined {
  const list = LADDERS[ladder].exercises
  const ok = (i: number) => {
    const ex = getExercise(list[i])
    return !!ex && isAllowed(ex, ctx) && !opts.exclude?.has(ex.id)
  }
  const r = clamp(Math.round(rung), 0, list.length - 1)
  const window = LADDERS[ladder].variety ?? 0
  if (window > 0) {
    const pool: number[] = []
    for (let i = r; i >= Math.max(0, r - window); i--) if (ok(i)) pool.push(i)
    if (pool.length) {
      const i = pool[Math.abs(opts.variant ?? 0) % pool.length]
      return { exerciseId: list[i], rung: i }
    }
  }
  for (let i = r; i >= 0; i--) if (ok(i)) return { exerciseId: list[i], rung: i }
  for (let i = r + 1; i < list.length; i++) if (ok(i)) return { exerciseId: list[i], rung: i }
  return undefined
}

/** 0-based week inside the 4-week training block; week index 3 is the lighter deload week. */
export function blockWeek(index: number, daysPerWeek: number): number {
  return Math.floor(index / Math.max(1, Math.round(daysPerWeek))) % 4
}
