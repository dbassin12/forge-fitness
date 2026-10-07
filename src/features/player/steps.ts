import { getExercise, motionFor } from '@/data/exercises'
import { BLOCK_GAP_SEC, BOTH_SIDES_PER_CYCLE, SWITCH_SEC, type BlockKind, type PlannedItem, type PlannedSession } from '@/engines/plan'

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
          if (!lastItem) pushRest(Math.min(SWITCH_SEC, 8), 'switch', 'Next move')
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
  // Link every rest to the work that follows it.
  let nextWork: WorkStep | undefined
  for (let i = out.length - 1; i >= 0; i--) {
    const st = out[i]
    if (st.kind === 'work') nextWork = st
    else st.next = nextWork
  }
  // Drop a trailing rest (nothing follows it).
  while (out.length && out[out.length - 1].kind === 'rest') out.pop()
  return out
}

/** Index of the work step before/after `i` (for back/skip). */
export function prevWork(steps: Step[], i: number): number {
  for (let k = i - 1; k >= 0; k--) if (steps[k].kind === 'work') return k
  return 0
}

export function describeWork(w: WorkStep): string {
  if (w.seconds !== undefined) return `${w.seconds} seconds${w.side ? (w.side === 1 ? ', first side' : ', second side') : ''}`
  const r = w.reps ?? 0
  return `${r} ${r === 1 ? 'rep' : 'reps'}${w.cyclesPerRep === 2 ? ' each side' : w.side ? (w.side === 1 ? ', first side' : ', second side') : w.item.perSide ? ' each side' : ''}`
}
