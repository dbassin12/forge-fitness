import { EXERCISES, getExercise, type Exercise } from '@/data/exercises'
import type { Experience, ISODate } from '@/domain/types'
import { addDays, isoWeekday } from '@/lib/dates'
import { availability, contextNotes, isAllowed, type PlanContext } from './equipment'
import { LADDERS, type Region } from './ladders'
import { makeTarget, prescribe, targetValue } from './prescribe'
import { repSeconds, SIDE_SWITCH_SEC, sessionKcal, sessionSeconds, SWITCH_SEC, workSeconds } from './duration'
import { splitFor, TEMPLATES } from './templates'
import type {
  Focus,
  LadderId,
  PlanInputs,
  PlannedBlock,
  PlannedItem,
  PlannedSession,
  Priority,
  ProgressState,
  TemplateId,
} from './types'

/** Every generated session lands within this many seconds of its time budget. */
export const FIT_TOLERANCE_SEC = 60

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x))
const round5 = (x: number) => Math.round(x / 5) * 5
const round15 = (x: number) => Math.round(x / 15) * 15

export function planContext(inputs: Pick<PlanInputs, 'equipment' | 'aches' | 'quietMode'>): PlanContext {
  return { av: availability(inputs.equipment), aches: inputs.aches, quietMode: inputs.quietMode }
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

// ---- Warm-up and cool-down ------------------------------------------------------------------

const WARMUP_POOL: Record<Focus, string[]> = {
  full: ['arm-circles', 'hip-circles', 'bodyweight-squat', 'worlds-greatest-stretch', 'inchworm', 'glute-bridge', 'leg-swings'],
  upper: ['arm-circles', 'prone-w-pull', 'inchworm', 'reverse-snow-angel', 'down-dog-cobra', 'prone-ytw'],
  lower: ['hip-circles', 'bodyweight-squat', 'leg-swings', 'glute-bridge', 'worlds-greatest-stretch', 'good-morning'],
  conditioning: ['hip-circles', 'arm-circles', 'bodyweight-squat', 'leg-swings', 'inchworm', 'worlds-greatest-stretch'],
}

/** Kept disjoint from the warm-up pools so a session never repeats a move at both ends. */
const COOLDOWN_POOL: Record<Focus, string[]> = {
  full: ['hip-flexor-stretch', 'hamstring-stretch', 'chest-opener', 'childs-pose', 'figure-four-stretch', 'calf-stretch'],
  upper: ['chest-opener', 'childs-pose', 'cobra-stretch', 'cat-cow'],
  lower: ['hip-flexor-stretch', 'hamstring-stretch', 'figure-four-stretch', 'calf-stretch', 'childs-pose'],
  conditioning: ['hamstring-stretch', 'hip-flexor-stretch', 'calf-stretch', 'childs-pose', 'cobra-stretch'],
}

/** "Pulse raiser" that opens every warm-up. */
const PULSE: Record<Experience, string[]> = {
  beginner: ['march-in-place', 'step-jacks'],
  intermediate: ['step-jacks', 'march-in-place'],
  advanced: ['jumping-jacks', 'step-jacks', 'march-in-place'],
}

const FLOW_MIN_HOLD = 15
const FLOW_MAX_HOLD = 120
/** Beyond this per move, a flow goes round twice instead. */
const FLOW_COMFORT_HOLD = 75

function flowItem(ex: Exercise, budgetSec: number, ctx: PlanContext): PlannedItem {
  const sides = ex.perSide ? 2 : 1
  const target =
    ex.measure === 'time'
      ? makeTarget(ex, clamp(round5((budgetSec - (ex.perSide ? SIDE_SWITCH_SEC : 0)) / sides), FLOW_MIN_HOLD, FLOW_MAX_HOLD))
      : makeTarget(ex, clamp(Math.round(budgetSec / (repSeconds(ex.id) * sides)), Math.min(3, ex.range[0]), ex.range[1]))
  return {
    exerciseId: ex.id,
    target,
    perSide: !!ex.perSide,
    workSec: workSeconds(ex.id, target, !!ex.perSide),
    notes: contextNotes(ex, ctx),
  }
}

function flowSeconds(items: PlannedItem[]): number {
  return items.reduce((s, it) => s + it.workSec, 0) + SWITCH_SEC * Math.max(0, items.length - 1)
}

/** Nudge timed holds in 5-second steps until a flow lands on its budget. */
function balanceFlow(items: PlannedItem[], budget: number): PlannedItem[] {
  const out = items.slice()
  const timed = out.flatMap((it, i) => (it.target.kind === 'time' ? [i] : []))
  let cursor = 0
  for (let guard = 0; guard < 600 && timed.length; guard++) {
    const diff = budget - flowSeconds(out)
    if (Math.abs(diff) < 5) break
    let moved = false
    for (let k = 0; k < timed.length && !moved; k++) {
      const i = timed[(cursor + k) % timed.length]
      const it = out[i]
      if (it.target.kind !== 'time') continue
      const sides = it.perSide ? 2 : 1
      if (Math.abs(diff) < 5 * sides) continue
      const next = it.target.seconds + (diff > 0 ? 5 : -5)
      if (next < FLOW_MIN_HOLD || next > FLOW_MAX_HOLD) continue
      const target = { kind: 'time' as const, seconds: next, min: next, max: next }
      out[i] = { ...it, target, workSec: workSeconds(it.exerciseId, target, it.perSide) }
      cursor = (cursor + k + 1) % timed.length
      moved = true
    }
    if (!moved) break
  }
  return out
}

export function buildFlow(
  kind: 'warmup' | 'cooldown',
  budgetSec: number,
  focus: Focus,
  ctx: PlanContext,
  experience: Experience,
  variant = 0,
  /** Moves to avoid (e.g. today's main exercises) unless nothing else fits. */
  avoid: ReadonlySet<string> = new Set(),
): PlannedBlock | null {
  if (budgetSec < 30) return null
  const allowed = (id: string) => {
    const ex = getExercise(id)
    return ex && isAllowed(ex, ctx) ? ex : undefined
  }
  const chosen: Exercise[] = []
  if (kind === 'warmup') {
    const pulse = PULSE[experience].map(allowed).find(Boolean)
    if (pulse) chosen.push(pulse)
  }
  const k = clamp(Math.round(budgetSec / 40), 1, 8)
  const base = kind === 'warmup' ? WARMUP_POOL[focus] : COOLDOWN_POOL[focus]
  const fresh = base.filter((id) => !avoid.has(id))
  const pool = [...fresh.map((_, i) => fresh[(i + variant) % fresh.length]), ...base.filter((id) => avoid.has(id))]
  for (const id of pool) {
    if (chosen.length >= k) break
    const ex = allowed(id)
    if (ex && !chosen.includes(ex)) chosen.push(ex)
  }
  if (!chosen.length) return null
  // Long budgets repeat the sequence rather than holding each stretch for minutes.
  const n = chosen.length
  const comfortable = n * FLOW_COMFORT_HOLD + SWITCH_SEC * (n - 1)
  const rounds = budgetSec > comfortable ? Math.ceil((budgetSec + SWITCH_SEC) / (comfortable + SWITCH_SEC)) : 1
  const perRound = (budgetSec - SWITCH_SEC * (rounds - 1)) / rounds
  const per = (perRound - SWITCH_SEC * (n - 1)) / n
  const items = balanceFlow(
    chosen.map((ex) => flowItem(ex, per, ctx)),
    perRound,
  )
  return {
    id: kind,
    kind,
    format: 'flow',
    title: kind === 'warmup' ? 'Warm-up' : 'Cool-down',
    rounds,
    restSec: rounds > 1 ? SWITCH_SEC : 0,
    items,
  }
}

// ---- Main work layout -----------------------------------------------------------------------

interface MainCand {
  slotIndex: number
  priority: Priority
  ladder: LadderId
  region: Region
  direction?: 'push' | 'pull'
  item: PlannedItem
  sets: number
  restSec: number
}

interface Group {
  intervals: boolean
  /** Extra exercises added when there's time to spare. */
  accessory?: boolean
  items: MainCand[]
  rounds: number
  initRounds: number
  minRounds: number
  maxRounds: number
  restSec: number
  itemRestSec?: number
}

interface Finisher {
  items: PlannedItem[]
  rounds: number
  maxRounds: number
  restSec: number
  itemRestSec: number
}

interface Layout {
  warm: number
  cool: number
  warmMin: number
  coolMin: number
  warmMax: number
  coolMax: number
  groups: Group[]
  finisher: Finisher | null
  /** Accessory exercises to add, in order, when the main work can't fill the time. */
  reserve: MainCand[]
  restsShortened: boolean
}

/** Accessory ladders per session focus, tried in order. */
const RESERVE: Record<Focus, LadderId[]> = {
  full: ['core_flex', 'core_lat', 'bridge', 'triceps', 'biceps', 'v_pull'],
  upper: ['v_pull', 'core_lat', 'biceps', 'core_ext'],
  lower: ['core_flex', 'bridge', 'core_ext', 'lunge'],
  conditioning: ['cond', 'core_ext', 'squat'],
}

const INTERVALS: Record<Experience, { work: number; rest: number }> = {
  beginner: { work: 30, rest: 30 },
  intermediate: { work: 40, rest: 20 },
  advanced: { work: 45, rest: 15 },
}

const groupPriority = (g: Group) => Math.min(...g.items.map((c) => c.priority)) as Priority

const complementary = (a: MainCand, b: MainCand) =>
  a.region !== b.region || (!!a.direction && !!b.direction && a.direction !== b.direction)

/** An interval version of an item: timed work, no per-side split. */
function asInterval(it: PlannedItem, work: number): PlannedItem {
  const target = { kind: 'time' as const, seconds: work, min: work, max: work }
  return { ...it, target, perSide: false, modifier: undefined, workSec: work }
}

function circuitRest(cands: MainCand[]): number {
  return clamp(round5(Math.max(...cands.map((c) => c.restSec)) * 0.75), 30, 90)
}

function straight(c: MainCand): Group {
  return {
    intervals: false,
    items: [c],
    rounds: c.sets,
    initRounds: c.sets,
    minRounds: c.priority <= 2 ? 2 : 1,
    maxRounds: Math.min(6, c.sets + 2),
    restSec: c.restSec,
  }
}

function pairGroup(a: MainCand, b: MainCand): Group {
  const sets = Math.max(a.sets, b.sets)
  return {
    intervals: false,
    items: [a, b],
    rounds: sets,
    initRounds: sets,
    minRounds: Math.min(a.priority, b.priority) <= 2 ? 2 : 1,
    maxRounds: Math.min(6, sets + 2),
    restSec: Math.max(a.restSec, b.restSec),
  }
}

function circuitGroup(cands: MainCand[], init: number, min: number, max: number): Group {
  return { intervals: false, items: cands, rounds: init, initRounds: init, minRounds: min, maxRounds: max, restSec: circuitRest(cands) }
}

/** Antagonist / upper-lower pairing; leftovers may borrow a lower-priority partner. */
function pairUp(cands: MainCand[], partners: MainCand[]): { groups: Group[]; unused: MainCand[] } {
  const pool = cands.slice()
  const used = new Set<MainCand>()
  const groups: Group[] = []
  while (pool.length) {
    const a = pool.shift()!
    const j = pool.findIndex((b) => complementary(a, b))
    if (j >= 0) {
      groups.push(pairGroup(a, pool.splice(j, 1)[0]))
      continue
    }
    const p = partners.find((b) => !used.has(b) && complementary(a, b))
    if (p) {
      used.add(p)
      groups.push(pairGroup(a, p))
      continue
    }
    groups.push(straight(a))
  }
  return { groups, unused: partners.filter((p) => !used.has(p)) }
}

function restGroups(rest: MainCand[]): Group[] {
  if (!rest.length) return []
  if (rest.length === 1) return [straight(rest[0])]
  return [circuitGroup(rest, 2, 1, 3)]
}

function buildGroups(mains: MainCand[], minutes: number, focus: Focus, xp: Experience): { groups: Group[]; extras: MainCand[] } {
  if (!mains.length) return { groups: [], extras: [] }
  if (focus === 'conditioning') {
    const { work, rest } = INTERVALS[xp]
    const items = mains.map((c) => ({ ...c, item: asInterval(c.item, work) }))
    return {
      groups: [{ intervals: true, items, rounds: 3, initRounds: 3, minRounds: 1, maxRounds: 8, restSec: 60, itemRestSec: rest }],
      extras: [],
    }
  }
  const byP = (p: (x: Priority) => boolean) => mains.filter((c) => p(c.priority))
  if (minutes <= 12) {
    return { groups: [circuitGroup(mains, 2, minutes >= 8 ? 2 : 1, 4)], extras: [] }
  }
  const p4 = byP((p) => p === 4)
  if (minutes <= 20) {
    return { groups: [circuitGroup(byP((p) => p <= 3), 2, 1, 4)], extras: p4 }
  }
  const p3 = byP((p) => p === 3)
  if (minutes <= 35) {
    const { groups, unused } = pairUp(byP((p) => p <= 2), p3)
    return { groups: [...groups, ...restGroups(unused)], extras: p4 }
  }
  const strength = byP((p) => p === 1).map(straight)
  const { groups, unused } = pairUp(byP((p) => p === 2), p3)
  return { groups: [...strength, ...groups, ...restGroups(unused)], extras: p4 }
}

function cloneLayout(L: Layout): Layout {
  return {
    ...L,
    groups: L.groups.map((g) => ({ ...g, items: g.items.slice() })),
    finisher: L.finisher ? { ...L.finisher, items: L.finisher.items.slice() } : null,
    reserve: L.reserve.slice(),
  }
}

// Reducers return true when they changed something.

function dropPriority(L: Layout, p: Priority): boolean {
  for (let gi = L.groups.length - 1; gi >= 0; gi--) {
    const g = L.groups[gi]
    const i = g.items.map((c) => c.priority).lastIndexOf(p)
    if (i < 0) continue
    if (L.groups.reduce((n, x) => n + x.items.length, 0) <= 1) return false
    g.items.splice(i, 1)
    if (!g.items.length) L.groups.splice(gi, 1)
    return true
  }
  return false
}

function decRounds(L: Layout, respectMin: boolean): boolean {
  const cands = L.groups
    .filter((g) => g.rounds > (respectMin ? g.minRounds : 1))
    .sort((a, b) => groupPriority(b) - groupPriority(a) || b.rounds - a.rounds)
  if (!cands.length) return false
  cands[0].rounds -= 1
  return true
}

function shortenRests(L: Layout): boolean {
  if (L.restsShortened) return false
  L.restsShortened = true
  for (const g of L.groups) g.restSec = Math.max(20, round5(g.restSec * 0.7))
  if (L.finisher) L.finisher.restSec = Math.max(15, round5(L.finisher.restSec * 0.7))
  return true
}

function shrinkFlows(L: Layout): boolean {
  if (L.warm <= L.warmMin && L.cool <= L.coolMin) return false
  L.warm = Math.min(L.warm, L.warmMin)
  L.cool = Math.min(L.cool, L.coolMin)
  return true
}

function dropLastItem(L: Layout): boolean {
  if (L.groups.reduce((n, g) => n + g.items.length, 0) <= 1) return false
  const g = L.groups.slice().sort((a, b) => groupPriority(b) - groupPriority(a))[0]
  g.items.pop()
  if (!g.items.length) L.groups.splice(L.groups.indexOf(g), 1)
  return true
}

// Growers.

/** Add a round to the block that's furthest below its plan (main lifts first); `extra` caps the climb. */
function incRounds(L: Layout, extra = Infinity): boolean {
  const score = (g: Group) => g.rounds - g.initRounds + (groupPriority(g) - 1) * 0.5
  const cands = L.groups.filter((g) => g.rounds < Math.min(g.maxRounds, g.initRounds + extra)).sort((a, b) => score(a) - score(b))
  if (!cands.length) return false
  cands[0].rounds += 1
  return true
}

function growFinisher(L: Layout, cap = Infinity): boolean {
  const f = L.finisher
  if (!f || !f.items.length || f.rounds >= Math.min(f.maxRounds, cap)) return false
  f.rounds += 1
  return true
}

function addAccessory(L: Layout): boolean {
  const c = L.reserve.shift()
  if (!c) return false
  const g = L.groups.find((x) => x.accessory)
  if (!g) {
    L.groups.push({ intervals: false, accessory: true, items: [c], rounds: 2, initRounds: 2, minRounds: 1, maxRounds: 3, restSec: c.restSec })
  } else {
    g.items.push(c)
    g.restSec = circuitRest(g.items)
  }
  return true
}

function growFlow(L: Layout, which: 'warm' | 'cool'): boolean {
  if (which === 'warm') {
    if (L.warm >= L.warmMax) return false
    L.warm = L.warm === 0 ? Math.min(L.warmMax, 60) : Math.min(L.warmMax, L.warm + 15)
  } else {
    if (L.cool >= L.coolMax) return false
    L.cool = L.cool === 0 ? Math.min(L.coolMax, 45) : Math.min(L.coolMax, L.cool + 15)
  }
  return true
}

// ---- Session generation --------------------------------------------------------------------

export interface GenerateOptions {
  /** Queue position (defaults to the next session). */
  index?: number
  templateId?: TemplateId
  /** "Short on time": fit to this many minutes instead of the usual budget. */
  minutes?: number
  /** One-off swaps for this session, by template slot index. */
  swaps?: Record<number, string>
}

export function templateFor(inputs: PlanInputs, index: number): TemplateId {
  const rotation = splitFor(inputs.daysPerWeek, inputs.sessionMinutes)
  return rotation[((index % rotation.length) + rotation.length) % rotation.length]
}

export function generateSession(inputs: PlanInputs, progress: ProgressState, opts: GenerateOptions = {}): PlannedSession {
  const index = opts.index ?? progress.sessionsCompleted
  const templateId = opts.templateId ?? templateFor(inputs, index)
  const tpl = TEMPLATES[templateId]
  const ctx = planContext(inputs)
  const mesoWeek = blockWeek(index, inputs.daysPerWeek)
  const baseMinutes = clamp(Math.round(opts.minutes ?? inputs.sessionMinutes), 3, 90)
  const express = opts.minutes !== undefined && opts.minutes < inputs.sessionMinutes
  const deload = mesoWeek === 3 && baseMinutes >= 15 && !express
  const minutes = deload ? Math.max(10, round5(baseMinutes * 0.7)) : baseMinutes
  const targetSec = minutes * 60

  // 1. One exercise per template slot.
  const used = new Set<string>()
  const mains: MainCand[] = []
  tpl.slots.forEach((slot, slotIndex) => {
    let id: string | undefined
    for (const want of [opts.swaps?.[slotIndex], progress.preferred[slot.ladder]]) {
      const ex = want ? getExercise(want) : undefined
      if (ex && !used.has(ex.id) && isAllowed(ex, ctx)) {
        id = ex.id
        break
      }
    }
    id ??= resolveLadder(slot.ladder, progress.ladders[slot.ladder]?.rung ?? 0, ctx, {
      variant: index + slotIndex,
      exclude: used,
    })?.exerciseId
    const ex = id ? getExercise(id) : undefined
    if (!ex) return
    used.add(ex.id)
    const { item, sets, restSec } = prescribe({
      ex,
      priority: slot.priority,
      ladder: slot.ladder,
      goal: inputs.goal,
      experience: inputs.experience,
      progress,
      ctx,
    })
    const info = LADDERS[slot.ladder]
    mains.push({
      slotIndex,
      priority: slot.priority,
      ladder: slot.ladder,
      region: info.region,
      direction: info.direction,
      item: { ...item, slot: slotIndex },
      sets,
      restSec,
    })
  })

  // Accessories (only used when the main work can't fill a long session).
  const reserve: MainCand[] = []
  if (minutes >= 25) {
    const inTemplate = new Set(tpl.slots.map((x) => x.ladder))
    RESERVE[tpl.focus].forEach((ladder, k) => {
      if (inTemplate.has(ladder) && ladder !== 'cond') return
      const slotIndex = 100 + k
      const want = opts.swaps?.[slotIndex] ? getExercise(opts.swaps[slotIndex]) : undefined
      const id =
        want && !used.has(want.id) && isAllowed(want, ctx)
          ? want.id
          : resolveLadder(ladder, progress.ladders[ladder]?.rung ?? 0, ctx, { variant: index + 11 + k, exclude: used })?.exerciseId
      const ex = id ? getExercise(id) : undefined
      if (!ex) return
      used.add(ex.id)
      const { item, sets, restSec } = prescribe({ ex, priority: 3, ladder, goal: inputs.goal, experience: inputs.experience, progress, ctx })
      const info = LADDERS[ladder]
      reserve.push({ slotIndex, priority: 3, ladder, region: info.region, direction: info.direction, item: { ...item, slot: slotIndex }, sets, restSec })
    })
  }

  // 2. Layout: warm-up, main blocks, optional finisher, cool-down.
  const { groups, extras } = buildGroups(mains, minutes, tpl.focus, inputs.experience)
  const tiny = minutes <= 6
  const { work, rest } = INTERVALS[inputs.experience]
  let finisher: Finisher | null = null
  if (tpl.focus !== 'conditioning' && minutes > 12) {
    const items = extras.map((c) => asInterval(c.item, work))
    const cond = resolveLadder('cond', progress.ladders.cond?.rung ?? 0, ctx, { variant: index + 7, exclude: used })
    const condEx = cond ? getExercise(cond.exerciseId) : undefined
    if (condEx && items.length < 2) {
      const { item } = prescribe({ ex: condEx, priority: 4, ladder: 'cond', goal: inputs.goal, experience: inputs.experience, progress, ctx })
      items.push(asInterval(item, work))
    }
    if (items.length) {
      finisher = { items: items.slice(0, 2), rounds: 0, maxRounds: minutes >= 40 ? 6 : 4, restSec: 30, itemRestSec: Math.min(20, rest) }
    }
  }
  let L: Layout = {
    warm: tiny ? 0 : clamp(round15(targetSec * 0.12), 90, 300),
    cool: tiny ? 0 : clamp(round15(targetSec * 0.08), 60, 240),
    warmMin: tiny ? 0 : 60,
    coolMin: tiny ? 0 : 45,
    warmMax: tiny ? 0 : 360,
    coolMax: tiny ? 60 : 360,
    groups,
    finisher,
    reserve,
    restsShortened: false,
  }

  const flowCache = new Map<string, PlannedBlock | null>()
  const flow = (kind: 'warmup' | 'cooldown', budget: number) => {
    const key = `${kind}:${budget}`
    if (!flowCache.has(key)) flowCache.set(key, buildFlow(kind, budget, tpl.focus, ctx, inputs.experience, index, used))
    return flowCache.get(key) ?? null
  }

  const materialize = (x: Layout): PlannedBlock[] => {
    const blocks: PlannedBlock[] = []
    const w = flow('warmup', x.warm)
    if (w) blocks.push(w)
    let letter = 0
    for (const g of x.groups) {
      if (!g.items.length || g.rounds <= 0) continue
      const id = String.fromCharCode(65 + letter++)
      const items = g.items.map((c) => c.item)
      if (g.intervals) {
        blocks.push({ id, kind: 'main', format: 'intervals', title: 'Cardio intervals', rounds: g.rounds, restSec: g.restSec, itemRestSec: g.itemRestSec, items })
      } else if (items.length === 1) {
        const name = getExercise(items[0].exerciseId)?.name ?? 'Strength'
        blocks.push({ id, kind: 'main', format: 'straight', title: name, rounds: g.rounds, restSec: g.restSec, items })
      } else if (items.length === 2) {
        blocks.push({ id, kind: 'main', format: 'superset', title: `Superset ${id}`, rounds: g.rounds, restSec: g.restSec, items })
      } else {
        blocks.push({ id, kind: 'main', format: 'circuit', title: 'Circuit', rounds: g.rounds, restSec: g.restSec, items })
      }
    }
    const f = x.finisher
    if (f && f.rounds > 0 && f.items.length) {
      blocks.push({ id: 'finisher', kind: 'finisher', format: 'intervals', title: 'Finisher', rounds: f.rounds, restSec: f.restSec, itemRestSec: f.itemRestSec, items: f.items })
    }
    const c = flow('cooldown', x.cool)
    if (c) blocks.push(c)
    return blocks
  }
  const est = (x: Layout) => sessionSeconds(materialize(x))

  // 3. Fit to the time budget: trim the least important work first…
  const hi = targetSec + FIT_TOLERANCE_SEC
  const lo = targetSec - FIT_TOLERANCE_SEC
  const reducers: ((x: Layout) => boolean)[] = [
    (x) => {
      if (!x.finisher || x.finisher.rounds === 0) return false
      x.finisher.rounds = 0
      return true
    },
    (x) => dropPriority(x, 4),
    (x) => decRounds(x, true),
    shortenRests,
    shrinkFlows,
    (x) => dropPriority(x, 3),
    (x) => decRounds(x, false),
    (x) => dropPriority(x, 2),
    (x) => {
      if (!x.warm && !x.cool) return false
      x.warm = 0
      x.cool = 0
      x.warmMax = 0
      x.coolMax = 0
      return true
    },
    dropLastItem,
  ]
  for (const reduce of reducers) {
    while (est(L) > hi && reduce(L)) {
      /* keep trimming */
    }
    if (est(L) <= hi) break
  }
  // …then add volume back where it helps most, never overshooting.
  // Tiers: a little more of everything, then accessories, then more sets, then longer flows.
  const growers: ((x: Layout) => boolean)[] = [
    (x) => incRounds(x, 1),
    (x) => growFinisher(x, 2),
    addAccessory,
    (x) => incRounds(x),
    (x) => growFinisher(x),
    (x) => growFlow(x, 'cool'),
    (x) => growFlow(x, 'warm'),
  ]
  for (let guard = 0; guard < 400 && est(L) < lo; guard++) {
    let grew = false
    for (const grow of growers) {
      const trial = cloneLayout(L)
      if (grow(trial) && est(trial) <= hi) {
        L = trial
        grew = true
        break
      }
    }
    if (!grew) break
  }
  // Last resort: stretch the cool-down to close any remaining gap exactly.
  for (let guard = 0; guard < 4 && est(L) < lo; guard++) {
    const gap = targetSec - est(L)
    L = { ...cloneLayout(L), cool: L.cool + gap + (L.cool === 0 ? -20 : 0), coolMax: Infinity }
  }

  const blocks = materialize(L)
  const estSec = sessionSeconds(blocks)
  const title = tpl.name + (express ? ' · Express' : '') + (deload ? ' · Deload' : '')
  return {
    key: `${index}:${templateId}:${minutes}`,
    index,
    templateId,
    title,
    focus: tpl.focus,
    minutes,
    mesoWeek,
    deload,
    express,
    blocks,
    estSec,
    estKcal: sessionKcal(blocks, inputs.bodyWeightKg),
  }
}

// ---- Movement snacks -----------------------------------------------------------------------

const SNACK_PATTERNS = [
  ['squat', 'h_push', 'core', 'cond'],
  ['lunge', 'h_push', 'mobility', 'cond'],
  ['squat', 'core', 'mobility', 'cond'],
] as const

/** A 2–5 minute no-equipment-needed micro-workout for between meetings. */
export function generateSnack(inputs: PlanInputs, minutes: number, variant = 0): PlannedSession {
  const ctx = planContext(inputs)
  const targetSec = clamp(Math.round(minutes), 1, 10) * 60
  const patterns = SNACK_PATTERNS[Math.abs(variant) % SNACK_PATTERNS.length]
  const pool = EXERCISES.filter((e) => e.tags?.includes('snack') && isAllowed(e, ctx))
  const chosen: Exercise[] = []
  for (const p of patterns) {
    const opts = pool.filter((e) => e.pattern === p && !chosen.includes(e))
    if (opts.length) chosen.push(opts[Math.abs(variant) % opts.length])
  }
  const items: PlannedItem[] = chosen.map((ex) => {
    const value = ex.measure === 'time' ? Math.min(ex.range[1], Math.max(ex.range[0], 30)) : ex.range[0]
    const target = makeTarget(ex, value)
    return { exerciseId: ex.id, target, perSide: !!ex.perSide, workSec: workSeconds(ex.id, target, !!ex.perSide), notes: contextNotes(ex, ctx) }
  })
  const block: PlannedBlock = { id: 'A', kind: 'main', format: 'circuit', title: 'Snack circuit', rounds: 1, restSec: 20, items }
  const once = sessionSeconds([block])
  block.rounds = Math.max(1, Math.round((targetSec + block.restSec) / (once + block.restSec)))
  const blocks = items.length ? [block] : []
  const estSec = sessionSeconds(blocks)
  return {
    key: `snack:${variant}:${minutes}`,
    index: -1,
    templateId: 'cond_core',
    title: `${Math.round(estSec / 60) || 1}-minute movement snack`,
    focus: 'full',
    minutes,
    mesoWeek: 0,
    deload: false,
    express: true,
    blocks,
    estSec,
    estKcal: sessionKcal(blocks, inputs.bodyWeightKg),
  }
}

// ---- Swaps and schedule ------------------------------------------------------------------------

/** Alternatives for the Swap sheet: same ladder first, then same movement pattern, closest level. */
export function alternativesFor(exerciseId: string, ctx: PlanContext, ladder?: LadderId, limit = 8): Exercise[] {
  const ex = getExercise(exerciseId)
  if (!ex) return []
  const inLadder = new Set(ladder ? LADDERS[ladder].exercises : [])
  return EXERCISES.filter(
    (e) => e.id !== ex.id && isAllowed(e, ctx) && (inLadder.has(e.id) || e.pattern === ex.pattern) && !e.tags?.includes('cooldown'),
  )
    .sort(
      (a, b) =>
        Number(inLadder.has(b.id)) - Number(inLadder.has(a.id)) ||
        Math.abs(a.level - ex.level) - Math.abs(b.level - ex.level) ||
        a.level - b.level,
    )
    .slice(0, limit)
}

export interface ScheduledDay {
  date: ISODate
  index: number
  templateId: TemplateId
  title: string
}

/** Project the rolling queue onto the user's training days, starting at `from`. */
export function upcomingDays(
  inputs: PlanInputs,
  trainingDays: number[],
  startIndex: number,
  from: ISODate,
  count: number,
): ScheduledDay[] {
  const days = new Set(trainingDays.length ? trainingDays : [1, 3, 5])
  const out: ScheduledDay[] = []
  let index = startIndex
  for (let i = 0; i < 28 && out.length < count; i++) {
    const date = addDays(from, i)
    if (!days.has(isoWeekday(date))) continue
    const templateId = templateFor(inputs, index)
    out.push({ date, index, templateId, title: TEMPLATES[templateId].name })
    index++
  }
  return out
}

/** Main-work exercises in a session, in order (handy for previews). */
export function mainExercises(s: PlannedSession): PlannedItem[] {
  return s.blocks.filter((b) => b.kind === 'main').flatMap((b) => b.items)
}

export function describeTarget(it: PlannedItem): string {
  const v = targetValue(it.target)
  const unit = it.target.kind === 'time' ? 's' : ''
  const side = it.perSide ? ' / side' : ''
  return it.target.kind === 'time' ? `${v}${unit}${side}` : `${v} reps${side}`
}
