import { getExercise, type Exercise } from '@/data/exercises'
import type { Experience } from '@/domain/types'
import { contextNotes, isAllowed, type PlanContext } from './equipment'
import { repSeconds, sessionKcal, sessionSeconds, SWITCH_SEC, workSeconds } from './duration'
import { LADDERS } from './ladders'
import { makeTarget } from './prescribe'
import { blockWeek, planContext, resolveLadder } from './resolve'
import { TEMPLATES, yogaRotation } from './templates'
import type { BlockKind, LadderId, PlanInputs, PlannedBlock, PlannedItem, PlannedSession, Priority, ProgressState, YogaTemplateId } from './types'

/**
 * Bloom's practice builder. Each theme is a gentle arc (arrive, warm up, flow, open, rest) whose
 * moving parts come from the yoga ladders, so poses deepen as holds lengthen and feedback comes
 * in. Every practice is fitted to the minutes chosen: less important poses drop out of short
 * practices, extras join long ones, and the final resting pose absorbs what's left.
 */

/** A quick breath between parts of a practice (instead of the strength workouts' 20 s). */
export const YOGA_GAP_SEC = 10
/** Every practice lands within this many seconds of its time budget. */
export const YOGA_FIT_SEC = 45
/** Bloom keeps practices gentle: up to three quarters of an hour. */
export const YOGA_MAX_MIN = 45

type Spec =
  | { ladder: LadderId; priority: Priority; /** Pick a neighbouring pose on the same ladder. */ shift?: number }
  | { pool: string[]; priority: Priority; /** The flexible final rest. */ rest?: boolean }

interface Section {
  kind: BlockKind
  title: string
  items: Spec[]
}

const L = (ladder: LadderId, priority: Priority, shift = 0): Spec => ({ ladder, priority, shift })
const P = (priority: Priority, ...pool: string[]): Spec => ({ pool, priority })
const REST: Spec = { pool: ['savasana', 'easy-seat-breath'], priority: 1, rest: true }

export const YOGA_THEMES: Record<YogaTemplateId, Section[]> = {
  y_morning: [
    { kind: 'warmup', title: 'Arrive', items: [P(2, 'easy-seat-breath'), P(1, 'cat-cow'), P(3, 'seated-side-bend', 'neck-release')] },
    {
      kind: 'main',
      title: 'Flow',
      items: [
        L('y_flow', 1),
        L('y_standing', 1),
        L('y_standing', 3, 1),
        L('y_balance', 2),
        P(4, 'down-dog', 'standing-forward-fold'),
        L('y_standing', 4, 2),
        L('y_balance', 4, 1),
      ],
    },
    {
      kind: 'main',
      title: 'On the mat',
      items: [L('y_hip', 2), L('y_fold', 3), P(4, 'bridge-pose'), L('y_hip', 4, 1), P(4, 'supine-twist'), P(4, 'happy-baby')],
    },
    { kind: 'cooldown', title: 'Rest', items: [P(4, 'legs-up-the-wall'), REST] },
  ],
  y_strength: [
    { kind: 'warmup', title: 'Warm up', items: [P(1, 'cat-cow'), P(2, 'mountain-breath'), P(4, 'standing-side-bend')] },
    {
      kind: 'main',
      title: 'Standing strength',
      items: [L('y_flow', 3), L('y_standing', 1), L('y_standing', 2, 1), L('y_balance', 1), L('y_balance', 4, 1), L('y_standing', 4, 2)],
    },
    {
      kind: 'main',
      title: 'Core and back',
      items: [L('y_core', 1), L('y_back', 2), L('y_core', 3, 1), P(4, 'glute-bridge'), P(4, 'side-plank-knee'), L('y_back', 4, 1)],
    },
    { kind: 'cooldown', title: 'Rest', items: [P(3, 'childs-pose'), P(4, 'supine-twist'), P(4, 'reclined-butterfly'), REST] },
  ],
  y_hips: [
    { kind: 'warmup', title: 'Arrive', items: [P(3, 'easy-seat-breath'), P(1, 'cat-cow'), P(4, 'standing-side-bend')] },
    { kind: 'main', title: 'Flow', items: [L('y_flow', 2), L('y_fold', 1), P(4, 'low-lunge')] },
    {
      kind: 'main',
      title: 'Open',
      items: [
        L('y_hip', 1),
        L('y_hip', 2, 1),
        P(3, 'butterfly-pose'),
        L('y_fold', 4, 1),
        P(4, 'half-splits'),
        P(4, 'happy-baby'),
        P(4, 'lizard-lunge', 'pigeon-pose'),
        P(4, 'reclined-butterfly'),
      ],
    },
    { kind: 'cooldown', title: 'Release', items: [P(2, 'supine-twist'), P(4, 'legs-up-the-wall'), REST] },
  ],
  y_back: [
    { kind: 'warmup', title: 'Arrive', items: [P(1, 'neck-release'), P(2, 'seated-side-bend'), P(4, 'easy-seat-breath')] },
    {
      kind: 'main',
      title: 'Spine',
      items: [
        P(1, 'cat-cow'),
        P(2, 'puppy-pose'),
        L('y_back', 1),
        P(2, 'childs-pose'),
        P(3, 'bird-dog'),
        L('y_back', 4, 1),
        P(4, 'chest-opener'),
        P(4, 'standing-forward-fold'),
      ],
    },
    { kind: 'cooldown', title: 'Release', items: [P(1, 'supine-twist'), P(2, 'knees-to-chest'), P(4, 'happy-baby'), P(4, 'legs-up-the-wall'), REST] },
  ],
  y_unwind: [
    { kind: 'warmup', title: 'Arrive', items: [P(1, 'easy-seat-breath'), P(3, 'neck-release')] },
    {
      kind: 'main',
      title: 'Unwind',
      items: [
        P(2, 'butterfly-pose'),
        P(1, 'childs-pose'),
        P(2, 'figure-four-stretch'),
        P(1, 'supine-twist'),
        P(3, 'happy-baby'),
        P(3, 'reclined-butterfly'),
        P(4, 'seated-forward-fold'),
        P(4, 'knees-to-chest'),
        P(4, 'puppy-pose'),
      ],
    },
    { kind: 'cooldown', title: 'Rest', items: [P(2, 'legs-up-the-wall'), P(4, 'sphinx-pose'), REST] },
  ],
}

/** Where in its range a hold starts before there's any history (0 = shortest). */
const START_AT: Record<Experience, number> = { beginner: 0.2, intermediate: 0.45, advanced: 0.7 }

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x))
const round5 = (x: number) => Math.round(x / 5) * 5

type Role = 'warmup' | 'main' | 'cool' | 'rest'

interface Cand {
  section: number
  slot: number
  priority: Priority
  ex: Exercise
  ladder?: LadderId
  role: Role
  /** Starting hold (seconds) or reps, and how far time fitting may move it. */
  value: number
  min: number
  max: number
}

function startValue(ex: Exercise, xp: Experience, progressGoal: number | undefined): number {
  const [lo, hi] = ex.range
  if (progressGoal !== undefined) return clamp(Math.round(progressGoal), lo, hi)
  const v = lo + (hi - lo) * START_AT[xp]
  return ex.measure === 'time' ? clamp(round5(v), lo, hi) : clamp(Math.round(v), lo, hi)
}

function itemFor(c: Cand, value: number, ctx: PlanContext): PlannedItem {
  const target = makeTarget(c.ex, value, c.ex.range[0], c.ex.range[1])
  return {
    exerciseId: c.ex.id,
    slot: c.slot,
    ladder: c.ladder,
    priority: c.priority,
    target,
    perSide: !!c.ex.perSide,
    workSec: workSeconds(c.ex.id, target, !!c.ex.perSide),
    notes: contextNotes(c.ex, ctx),
  }
}

export interface YogaOptions {
  index?: number
  templateId?: YogaTemplateId
  minutes?: number
  swaps?: Record<number, string>
}

export function yogaTemplateFor(inputs: Pick<PlanInputs, 'daysPerWeek' | 'intentions'>, index: number): YogaTemplateId {
  const rotation = yogaRotation(inputs.daysPerWeek, inputs.intentions)
  return rotation[((index % rotation.length) + rotation.length) % rotation.length]
}

/** Limits for one candidate pose: main poses follow progression; the rest flex with the time. */
function shape(ex: Exercise, role: Role, xp: Experience, goal: number | undefined, targetSec: number, restful: boolean): Pick<Cand, 'value' | 'min' | 'max'> {
  const [lo, hi] = ex.range
  const long = targetSec >= 40 * 60
  if (role === 'main') {
    const value = startValue(ex, xp, goal)
    const flow = ex.pattern === 'flow'
    return ex.measure === 'time'
      ? { value, min: Math.max(lo, value - 10), max: Math.min(hi, value + (long ? 30 : 15)) }
      : { value, min: Math.max(lo, value - 1), max: flow && targetSec >= 25 * 60 ? hi : Math.min(hi, value + 1) }
  }
  if (role === 'rest') {
    const restMin = targetSec <= 10 * 60 ? 30 : 60
    return { value: clamp(round5(targetSec * 0.1), restMin, 300), min: restMin, max: restful || long ? 900 : 600 }
  }
  if (ex.measure === 'reps') return { value: lo, min: lo, max: hi }
  const cap = role === 'warmup' ? (restful ? 120 : 75) : restful ? 300 : 150
  const value = clamp(round5(lo + Math.min(hi - lo, targetSec * 0.03)), lo, Math.min(hi, cap))
  return { value, min: lo, max: Math.max(value, Math.min(hi, cap)) }
}

export function generateYogaSession(inputs: PlanInputs, progress: ProgressState, opts: YogaOptions = {}): PlannedSession {
  const index = opts.index ?? progress.sessionsCompleted
  const templateId = opts.templateId ?? yogaTemplateFor(inputs, index)
  const sections = YOGA_THEMES[templateId]
  const restful = templateId === 'y_unwind'
  const ctx = planContext({ ...inputs, program: 'yoga' })
  const minutes = clamp(Math.round(opts.minutes ?? inputs.sessionMinutes), 3, YOGA_MAX_MIN)
  const express = opts.minutes !== undefined && opts.minutes < Math.min(inputs.sessionMinutes, YOGA_MAX_MIN)
  const targetSec = minutes * 60

  // 1. Choose a pose for every spec (swaps and "always use" preferences first).
  const used = new Set<string>()
  const cands: Cand[] = []
  let slot = 0
  sections.forEach((sec, si) => {
    for (const spec of sec.items) {
      const mySlot = slot++
      const usable = (id: string | undefined) => {
        const ex = id ? getExercise(id) : undefined
        return ex && !used.has(ex.id) && isAllowed(ex, ctx) ? ex : undefined
      }
      let ex = usable(opts.swaps?.[mySlot])
      let ladder: LadderId | undefined
      if ('ladder' in spec) {
        ladder = spec.ladder
        ex ??= spec.shift ? undefined : usable(progress.preferred[spec.ladder])
        if (!ex) {
          const rung = (progress.ladders[spec.ladder]?.rung ?? LADDERS[spec.ladder].start[0]) - (spec.shift ?? 0)
          const r = resolveLadder(spec.ladder, rung, ctx, { variant: index + mySlot, exclude: used })
          ex = r ? usable(r.exerciseId) : undefined
        }
      } else {
        const n = spec.pool.length
        for (let k = 0; k < n && !ex; k++) ex = usable(spec.pool[(index + k) % n])
      }
      if (!ex) continue
      used.add(ex.id)
      const role: Role = 'rest' in spec && spec.rest ? 'rest' : sec.kind === 'main' ? 'main' : sec.kind === 'warmup' ? 'warmup' : 'cool'
      const goal = role === 'main' ? progress.exercises[ex.id]?.goal : undefined
      cands.push({ section: si, slot: mySlot, priority: spec.priority, ex, ladder, role, ...shape(ex, role, inputs.experience, goal, targetSec, restful) })
    }
  })

  // 2. Fit to the time budget.
  const live = new Set(cands.map((c) => c.slot))
  const value = new Map(cands.map((c) => [c.slot, c.value]))
  const rounds = sections.map(() => 1)
  const materialize = (): PlannedBlock[] =>
    sections
      .map((sec, si): PlannedBlock => {
        const items = cands.filter((c) => c.section === si && live.has(c.slot)).map((c) => itemFor(c, value.get(c.slot)!, ctx))
        const r = items.length > 1 ? rounds[si] : 1
        return { id: `y${si}`, kind: sec.kind, format: 'flow', title: sec.title, rounds: r, restSec: r > 1 ? YOGA_GAP_SEC : 0, items }
      })
      .filter((b) => b.items.length > 0)
  const est = () => sessionSeconds(materialize(), YOGA_GAP_SEC)
  const hi = targetSec + YOGA_FIT_SEC
  const lo = targetSec - YOGA_FIT_SEC
  const rest = cands.find((c) => c.role === 'rest')
  const step = (c: Cand) => (c.ex.measure === 'time' ? 5 : 1)
  const moving = () => cands.filter((c) => live.has(c.slot) && c.role !== 'rest').length

  // Too long: drop the least important poses (last first), then trim the rest and the holds.
  for (const p of [4, 3, 2] as Priority[]) {
    for (let k = cands.length - 1; k >= 0 && est() > hi; k--) {
      const c = cands[k]
      if (c.priority === p && c.role !== 'rest' && live.has(c.slot) && moving() > 1) live.delete(c.slot)
    }
  }
  if (rest && est() > hi) value.set(rest.slot, rest.min)
  for (const role of ['warmup', 'cool', 'main'] as Role[]) {
    for (const c of cands) if (est() > hi && c.role === role && live.has(c.slot)) value.set(c.slot, c.min)
  }

  // Too short: deepen holds (main poses first, then the cool-down, then the warm-up), repeat
  // the main flow, and finally let the resting pose absorb what's left.
  const growOrder = cands.filter((c) => c.role !== 'rest').sort((a, b) => ['main', 'cool', 'warmup'].indexOf(a.role) - ['main', 'cool', 'warmup'].indexOf(b.role) || a.priority - b.priority)
  for (let guard = 0; guard < 300 && est() < lo; guard++) {
    let grew = false
    for (const c of growOrder) {
      if (!live.has(c.slot)) continue
      const v = value.get(c.slot)!
      if (v + step(c) > c.max) continue
      value.set(c.slot, v + step(c))
      if (est() > hi) value.set(c.slot, v)
      else grew = true
      if (est() >= lo) break
    }
    if (!grew) break
  }
  const mains = sections.map((sec, si) => ({ sec, si })).filter(({ sec }) => sec.kind === 'main')
  for (let r = 2; r <= 3 && est() < lo - (rest ? rest.max - value.get(rest.slot)! : 0); r++) {
    for (const { si } of mains) {
      if (est() >= lo) break
      rounds[si] = r
      if (est() > hi) rounds[si] = r - 1
    }
  }
  if (rest) {
    for (let guard = 0; guard < 4 && (est() < lo || est() > hi); guard++) {
      value.set(rest.slot, clamp(round5(value.get(rest.slot)! + targetSec - est()), rest.min, rest.max))
    }
  }

  const blocks = materialize()
  const estSec = sessionSeconds(blocks, YOGA_GAP_SEC)
  return {
    key: `${index}:${templateId}:${minutes}`,
    index,
    templateId,
    title: TEMPLATES[templateId].name + (express ? ' · Express' : ''),
    focus: 'yoga',
    minutes,
    mesoWeek: blockWeek(index, inputs.daysPerWeek),
    deload: false,
    express,
    blocks,
    estSec,
    estKcal: sessionKcal(blocks, inputs.bodyWeightKg, YOGA_GAP_SEC),
    gapSec: YOGA_GAP_SEC,
  }
}

// ---- Mini flows (Bloom's movement snacks) ----------------------------------------------------------

export type MiniFlowKind = 'wake' | 'desk' | 'unwind'

export const MINI_FLOWS: Record<MiniFlowKind, { title: string; ids: string[] }> = {
  wake: { title: 'wake-up flow', ids: ['mountain-breath', 'half-sun-salutation', 'standing-side-bend', 'tree-pose-kickstand'] },
  desk: { title: 'desk stretch', ids: ['neck-release', 'seated-side-bend', 'standing-side-bend', 'standing-forward-fold'] },
  unwind: { title: 'wind-down', ids: ['childs-pose', 'figure-four-stretch', 'supine-twist', 'legs-up-the-wall'] },
}

/** Morning wakes up, the working day loosens up, evening winds down. */
export function miniFlowFor(hour: number | undefined, variant = 0): MiniFlowKind {
  if (hour === undefined) return (['wake', 'desk', 'unwind'] as const)[Math.abs(variant) % 3]
  return hour < 11 ? 'wake' : hour < 18 ? 'desk' : 'unwind'
}

/** A 2–10 minute mini flow: a few poses that need nothing but a little floor. */
export function generateYogaSnack(inputs: PlanInputs, minutes: number, variant = 0, hour?: number): PlannedSession {
  const ctx = planContext({ ...inputs, program: 'yoga' })
  const kind = miniFlowFor(hour, variant)
  const flow = MINI_FLOWS[kind]
  const targetSec = clamp(Math.round(minutes), 1, 10) * 60
  const poses = flow.ids.map((id) => getExercise(id)).filter((e): e is Exercise => !!e && isAllowed(e, ctx))
  const n = Math.max(1, poses.length)
  const per = (targetSec - SWITCH_SEC * (n - 1)) / n
  const items: PlannedItem[] = poses.map((ex) => {
    const sides = ex.perSide ? 2 : 1
    const value =
      ex.measure === 'time'
        ? clamp(round5(per / sides), ex.range[0], ex.range[1])
        : clamp(Math.round(per / (repSeconds(ex.id) * sides)), ex.range[0], ex.range[1])
    const target = makeTarget(ex, value)
    return { exerciseId: ex.id, target, perSide: !!ex.perSide, workSec: workSeconds(ex.id, target, !!ex.perSide), notes: contextNotes(ex, ctx) }
  })
  const blocks: PlannedBlock[] = items.length ? [{ id: 'A', kind: 'main', format: 'flow', title: 'Mini flow', rounds: 1, restSec: 0, items }] : []
  const estSec = sessionSeconds(blocks, YOGA_GAP_SEC)
  return {
    key: `snack:${kind}:${minutes}`,
    index: -1,
    templateId: 'y_unwind',
    title: `${Math.round(minutes)}-minute ${flow.title}`,
    focus: 'yoga',
    minutes,
    mesoWeek: 0,
    deload: false,
    express: true,
    blocks,
    estSec,
    estKcal: sessionKcal(blocks, inputs.bodyWeightKg, YOGA_GAP_SEC),
    gapSec: YOGA_GAP_SEC,
  }
}
