import { EXERCISES, getExercise } from '@/data/exercises'
import { LADDERS } from './ladders'
import { availability, isAllowed, type PlanContext } from './equipment'
import type { LadderId, PlanInputs } from './types'

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x))

export function planContext(inputs: Pick<PlanInputs, 'equipment' | 'aches' | 'quietMode' | 'program' | 'excluded'>): PlanContext {
  return {
    av: availability(inputs.equipment),
    aches: inputs.aches,
    quietMode: inputs.quietMode,
    program: inputs.program ?? 'strength',
    excluded: new Set(inputs.excluded ?? []),
  }
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

/**
 * The exercise for a plan slot: the ladder's pick when one is allowed, otherwise (every rung is
 * skipped or ruled out) the allowed move of the same pattern closest in level, so the session
 * still trains that movement. Off-ladder picks progress like swapped-in exercises.
 */
export function resolveSlot(
  ladder: LadderId,
  rung: number,
  ctx: PlanContext,
  opts: ResolveOptions = {},
): { exerciseId: string; rung?: number } | undefined {
  const hit = resolveLadder(ladder, rung, ctx, opts)
  if (hit) return hit
  const list = LADDERS[ladder].exercises
  const aim = getExercise(list[clamp(Math.round(rung), 0, list.length - 1)])
  if (!aim) return undefined
  const patterns = new Set(list.map((id) => getExercise(id)?.pattern))
  const alt = EXERCISES.filter((e) => patterns.has(e.pattern) && !opts.exclude?.has(e.id) && !e.tags?.includes('cooldown') && isAllowed(e, ctx)).sort(
    (a, b) => Math.abs(a.level - aim.level) - Math.abs(b.level - aim.level) || a.level - b.level,
  )[0]
  return alt ? { exerciseId: alt.id } : undefined
}

/** 0-based week inside the 4-week training block; week index 3 is the lighter deload week. */
export function blockWeek(index: number, daysPerWeek: number): number {
  return Math.floor(index / Math.max(1, Math.round(daysPerWeek))) % 4
}
