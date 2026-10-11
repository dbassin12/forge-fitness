import { isBloom } from '@/app/brand'
import { getExercise, motionFor } from '@/data/exercises'
import { BLOCK_GAP_SEC, BOTH_SIDES_PER_CYCLE, repWord, SWITCH_SEC, type BlockKind, type PlannedItem, type PlannedSession } from '@/engines/plan'

export interface WorkStep {
  kind: 'work'
  id: string
  blockIdx: number
  blockKind: BlockKind
  blockTitle: string
  round: number
  rounds: number
  item: PlannedItem
  /** Timed step (holds, intervals); undefined → rep-based. */
  seconds?: number
  /** Rep target for this step (per side for one-side-at-a-time sets). */
  reps?: number
  /** 1 or 2 when a per-side set is split into two steps. */
  side?: 1 | 2
  /** Animation cycles per counted rep (2 when the motion alternates sides every cycle). */
  cyclesPerRep: number
  /** Results key `${blockIdx}:${itemIdx}` and which set this is. */
  logKey: string
  setIndex: number
}

export type RestReason = 'ready' | 'set' | 'round' | 'switch' | 'side' | 'block'

export interface RestStep {
  kind: 'rest'
  id: string
  seconds: number
  reason: RestReason
  label: string
  /** The work step that follows (for the "next up" preview). */
  next?: WorkStep
  /** The next exercise starts here for the first time this session (time to explain it). */
  first?: boolean
}

export type Step = WorkStep | RestStep

const SIDE_REST_SEC = 5
const READY_SEC = 5

function workSteps(
  blockIdx: number,
  blockKind: BlockKind,
  blockTitle: string,
  round: number,
  rounds: number,
  itemIdx: number,
  it: PlannedItem,
): WorkStep[] {
  const base = {
    kind: 'work' as const,
    blockIdx,
    blockKind,
    blockTitle,
    round,
    rounds,
    item: it,
    logKey: `${blockIdx}:${itemIdx}`,
    setIndex: round - 1,
    cyclesPerRep: 1,
  }
  const id = `${blockIdx}.${round}.${itemIdx}`
  const ex = getExercise(it.exerciseId)
  const alternating = ex ? !!motionFor(ex).alternate : false
  if (it.target.kind === 'time') {
    if (!it.perSide) return [{ ...base, id, seconds: it.target.seconds }]
    return [
      { ...base, id: `${id}.1`, seconds: it.target.seconds, side: 1 },
      { ...base, id: `${id}.2`, seconds: it.target.seconds, side: 2 },
    ]
  }
  const reps = it.target.reps
  if (!it.perSide || BOTH_SIDES_PER_CYCLE.has(it.exerciseId)) return [{ ...base, id, reps }]
  if (alternating) return [{ ...base, id, reps, cyclesPerRep: 2 }]
  return [
    { ...base, id: `${id}.1`, reps, side: 1 },
    { ...base, id: `${id}.2`, reps, side: 2 },
  ]
}

/** Flatten a planned session into the player's sequence of work and rest steps. */
export function buildSteps(s: PlannedSession): Step[] {
  const out: Step[] = []
  const pushRest = (seconds: number, reason: RestReason, label: string) => {
    if (seconds > 0) out.push({ kind: 'rest', id: `r${out.length}`, seconds, reason, label })
  }
  s.blocks.forEach((b, bi) => {
    if (bi > 0) pushRest(s.gapSec ?? BLOCK_GAP_SEC, 'block', `Next: ${b.title}`)
    for (let round = 1; round <= b.rounds; round++) {
      b.items.forEach((it, ii) => {
        const ws = workSteps(bi, b.kind, b.title, round, b.rounds, ii, it)
        ws.forEach((w, k) => {
          if (k > 0) pushRest(SIDE_REST_SEC, 'side', 'Switch sides')
          out.push(w)
        })
        const lastItem = ii === b.items.length - 1
        const lastRound = round === b.rounds
        if (b.format === 'straight') {
          if (!lastRound) pushRest(b.restSec, 'set', 'Rest')
        } else if (b.format === 'intervals') {
          if (!lastItem) pushRest(b.itemRestSec ?? 0, 'switch', 'Breathe')
          else if (!lastRound) pushRest(b.restSec, 'round', 'Rest')
        } else if (b.format === 'flow') {
          if (!lastItem) pushRest(Math.min(SWITCH_SEC, 8), 'switch', isBloom ? 'Next pose' : 'Next move')
          else if (!lastRound) pushRest(b.restSec, 'round', 'Again')
        } else {
          if (!lastItem) pushRest(SWITCH_SEC, 'switch', 'Switch')
          else if (!lastRound) pushRest(b.restSec, 'round', 'Rest')
        }
      })
    }
  })
  // A short "get ready" before the very first move.
  if (out[0]?.kind === 'work') out.unshift({ kind: 'rest', id: 'ready', seconds: READY_SEC, reason: 'ready', label: 'Get ready' })
  return link(out)
}

/** Point every rest at the work that follows it, flag first appearances, drop a trailing rest. */
function link(out: Step[]): Step[] {
  let nextWork: WorkStep | undefined
  for (let i = out.length - 1; i >= 0; i--) {
    const st = out[i]
    if (st.kind === 'work') nextWork = st
    else st.next = nextWork
  }
  while (out.length && out[out.length - 1].kind === 'rest') out.pop()
  const seen = new Set<string>()
  for (const st of out) {
    if (st.kind !== 'rest' || !st.next) continue
    const id = st.next.item.exerciseId
    st.first = !seen.has(id)
    seen.add(id)
  }
  return out
}

/**
 * The steps without the exercises skipped mid-workout: each exercise id maps to the step index
 * (in `steps`) it was skipped at, so sets done before then still count. When rests end up back to
 * back, one stays, re-pointed at what now follows: the longer one (a round's rest, not the quick
 * switch inside it), never a side switch with no second side left, and always the opening "get
 * ready".
 */
export function withoutSkipped(steps: Step[], skips: Record<string, number> | undefined): Step[] {
  if (!skips || !Object.keys(skips).length) return steps
  const out: Step[] = []
  steps.forEach((st, i) => {
    if (st.kind === 'work') {
      const from = skips[st.item.exerciseId]
      if (from === undefined || i < from) out.push(st)
      return
    }
    const prev = out[out.length - 1]
    if (prev?.kind !== 'rest') out.push({ ...st })
    else if (prev.reason !== 'ready' && (prev.reason === 'side' || st.seconds > prev.seconds)) out[out.length - 1] = { ...st }
  })
  return link(out)
}

/**
 * Skip the rest of an exercise from the step you're on: the new skips, the steps left, and where to
 * carry on (the transition into the next exercise still to come), or `null` when nothing is left.
 */
export function skipFrom(
  all: Step[],
  skips: Record<string, number> | undefined,
  current: Step | undefined,
  exerciseId: string,
): { skips: Record<string, number>; steps: Step[]; cursor: number | null } {
  const at = (id: string) => all.findIndex((st) => st.id === id)
  const from = Math.max(0, current ? at(current.id) : 0)
  const next = { ...skips, [exerciseId]: from }
  const steps = withoutSkipped(all, next)
  const work = steps.findIndex((st) => st.kind === 'work' && at(st.id) >= from)
  if (work < 0) return { skips: next, steps, cursor: null }
  return { skips: next, steps, cursor: steps[work - 1]?.kind === 'rest' ? work - 1 : work }
}

/**
 * The target as a short spoken sentence: "12 reps.", "30 seconds each side." (A one-side-at-a-time
 * set is introduced as a whole; "Switch sides" comes when it's time.)
 */
export function spokenTarget(w: WorkStep): string {
  if (w.seconds !== undefined) return `${w.seconds} seconds${w.side ? ' each side' : ''}.`
  const r = w.reps ?? 0
  return `${r} ${repWord(w.item.exerciseId, r)}${w.side || w.cyclesPerRep === 2 || w.item.perSide ? ' each side' : ''}.`
}

/** Index of the work step before/after `i` (for back/skip). */
export function prevWork(steps: Step[], i: number): number {
  for (let k = i - 1; k >= 0; k--) if (steps[k].kind === 'work') return k
  return 0
}

export function describeWork(w: WorkStep): string {
  if (w.seconds !== undefined) return `${w.seconds} seconds${w.side ? (w.side === 1 ? ', first side' : ', second side') : ''}`
  const r = w.reps ?? 0
  return `${r} ${repWord(w.item.exerciseId, r)}${w.cyclesPerRep === 2 ? ' each side' : w.side ? (w.side === 1 ? ', first side' : ', second side') : w.item.perSide ? ' each side' : ''}`
}
