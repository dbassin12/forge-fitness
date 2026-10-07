import type { ISODate } from '@/domain/types'
import { getExercise, type Exercise } from '@/data/exercises'
import { isAllowed, LADDERS, resolveLadder, type LadderId, type PlanContext, type ProgressState } from '@/engines/plan'

/**
 * Play: game-style workouts (Spin the wheel, Deck of cards, record challenges). Pure logic only;
 * every pick respects the user's equipment, aches and current progression level.
 */

export interface PlayMove {
  exerciseId: string
  /** Reps (per side for one-sided moves) or seconds. */
  amount: number
  measure: 'reps' | 'time'
}

/** The user's current exercise on a ladder (what their plan would give them today). */
export function currentFor(ladder: LadderId, progress: ProgressState, ctx: PlanContext, fallback: string): Exercise {
  const rung = progress.ladders[ladder]?.rung ?? LADDERS[ladder].start[0]
  const r = resolveLadder(ladder, rung, ctx)
  return getExercise(r?.exerciseId ?? fallback) ?? getExercise(fallback)!
}

/** First allowed exercise from a preference list. */
function firstAllowed(ids: string[], ctx: PlanContext): Exercise | undefined {
  for (const id of ids) {
    const ex = getExercise(id)
    if (ex && isAllowed(ex, ctx)) return ex
  }
  return undefined
}

// ---- Seeded randomness ---------------------------------------------------------------------------

export function rng(seed: number | string): () => number {
  let h = 2166136261
  const s = String(seed)
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return () => {
    h += 0x6d2b79f5
    let t = h
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function shuffle<T>(items: T[], rand: () => number): T[] {
  const a = [...items]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ---- Deck of cards -------------------------------------------------------------------------------

export type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs'
export const SUITS: Suit[] = ['spades', 'hearts', 'diamonds', 'clubs']
export const SUIT_SYMBOL: Record<Suit, string> = { spades: '♠', hearts: '♥', diamonds: '♦', clubs: '♣' }
export const SUIT_RED: Record<Suit, boolean> = { spades: false, hearts: true, diamonds: true, clubs: false }

export interface Card {
  suit: Suit
  /** 1 = Ace, 11 = Jack, 12 = Queen, 13 = King. */
  rank: number
}

export const RANK_LABEL = (r: number) => (r === 1 ? 'A' : r === 11 ? 'J' : r === 12 ? 'Q' : r === 13 ? 'K' : String(r))

export type DeckSize = 13 | 26 | 52
export type DeckMode = 'easy' | 'normal'

export interface DeckPlan {
  /** Which exercise each suit means. */
  suits: Record<Suit, Exercise>
}

/** Suits: ♠ legs, ♥ push, ♦ core, ♣ cardio — each at the user's level. */
export function deckPlan(progress: ProgressState, ctx: PlanContext): DeckPlan {
  const cardio =
    firstAllowed(ctx.quietMode || ctx.aches.includes('knees') ? ['step-jacks', 'march-in-place', 'shadow-boxing'] : ['jumping-jacks', 'high-knees', 'step-jacks', 'march-in-place'], ctx) ??
    getExercise('march-in-place')!
  const core = firstAllowed(['crunch', 'bicycle-crunch', 'dead-bug', 'reverse-crunch', 'bird-dog'], ctx) ?? getExercise('dead-bug')!
  return {
    suits: {
      spades: currentFor('squat', progress, ctx, 'bodyweight-squat'),
      hearts: currentFor('h_push', progress, ctx, 'knee-pushup'),
      diamonds: core,
      clubs: cardio,
    },
  }
}

/** Reps for a card: number cards are their value, faces 10, aces 11 (halved in easy mode). */
export function cardReps(card: Card, mode: DeckMode, ex?: Exercise): number {
  const base = card.rank === 1 ? 11 : Math.min(10, card.rank)
  // Cardio counts double so it doesn't fly by (20 jumping jacks for a 10).
  const scaled = ex?.pattern === 'cond' ? base * 2 : base
  return mode === 'easy' ? Math.max(2, Math.ceil(scaled / 2)) : scaled
}

export function buildDeck(size: DeckSize, seed: number | string): Card[] {
  const all: Card[] = SUITS.flatMap((suit) => Array.from({ length: 13 }, (_, i) => ({ suit, rank: i + 1 })))
  return shuffle(all, rng(seed)).slice(0, size)
}

export interface DeckTotals {
  /** Reps per exercise id. */
  reps: Record<string, number>
  cards: number
}

export function deckTotals(cards: Card[], plan: DeckPlan, mode: DeckMode): DeckTotals {
  const reps: Record<string, number> = {}
  for (const c of cards) {
    const ex = plan.suits[c.suit]
    reps[ex.id] = (reps[ex.id] ?? 0) + cardReps(c, mode, ex)
  }
  return { reps, cards: cards.length }
}

// ---- Spin the wheel ------------------------------------------------------------------------------

export interface WheelSlice extends PlayMove {
  emoji: string
  label: string
}

const WHEEL_IDEAS: { ladder?: LadderId; ids: string[]; emoji: string; reps?: number; seconds?: number }[] = [
  { ladder: 'squat', ids: ['bodyweight-squat'], emoji: '🦵', reps: 15 },
  { ladder: 'h_push', ids: ['knee-pushup'], emoji: '💪', reps: 10 },
  { ids: ['jumping-jacks', 'step-jacks', 'march-in-place'], emoji: '⭐', reps: 30 },
  { ids: ['forearm-plank', 'knee-plank'], emoji: '🧱', seconds: 30 },
  { ladder: 'lunge', ids: ['reverse-lunge'], emoji: '🚶', reps: 8 },
  { ids: ['mountain-climbers', 'high-knees', 'march-in-place'], emoji: '⛰️', reps: 20 },
  { ids: ['wall-sit', 'glute-bridge'], emoji: '🪑', seconds: 30 },
  { ids: ['glute-bridge', 'superman', 'bird-dog'], emoji: '🍑', reps: 15 },
  { ids: ['bicycle-crunch', 'crunch', 'dead-bug'], emoji: '🔥', reps: 16 },
  { ids: ['skaters', 'step-back-burpee', 'squat-thrust', 'march-in-place'], emoji: '⚡', reps: 10 },
]

function moveLabel(ex: Exercise, amount: number, measure: 'reps' | 'time'): string {
  return measure === 'time' ? `${amount}s ${ex.name.toLowerCase()}` : `${amount} ${ex.name.toLowerCase()}${ex.perSide ? ' / side' : ''}`
}

/** Eight wheel slices for today, at the user's level and with only allowed moves. */
export function wheelSlices(progress: ProgressState, ctx: PlanContext, seed: number | string): WheelSlice[] {
  const rand = rng(seed)
  const out: WheelSlice[] = []
  const used = new Set<string>()
  for (const idea of shuffle(WHEEL_IDEAS, rand)) {
    if (out.length >= 8) break
    let ex: Exercise | undefined
    if (idea.ladder) {
      const cur = currentFor(idea.ladder, progress, ctx, idea.ids[0])
      // Keep the wheel playful: one notch easier than the plan's current rung when possible.
      ex = cur.level > 2 ? (firstAllowed(LADDERS[idea.ladder].exercises.slice(0, LADDERS[idea.ladder].exercises.indexOf(cur.id)).reverse(), ctx) ?? cur) : cur
    } else ex = firstAllowed(idea.ids, ctx)
    if (!ex || used.has(ex.id)) continue
    used.add(ex.id)
    const measure: 'reps' | 'time' = ex.measure === 'time' ? 'time' : 'reps'
    const amount = measure === 'time' ? (idea.seconds ?? 30) : Math.max(ex.range[0], Math.min(ex.range[1] * 2, idea.reps ?? 10))
    out.push({ exerciseId: ex.id, amount, measure, emoji: idea.emoji, label: moveLabel(ex, amount, measure) })
  }
  return out
}

/** XP for a run of spins: 10 per spin plus a growing combo bonus. */
export function wheelXp(spins: number): number {
  let xp = 0
  for (let i = 0; i < spins; i++) xp += 10 + Math.min(4, i) * 5
  return xp
}

// ---- Record challenges ---------------------------------------------------------------------------

export type ChallengeId = 'plank' | 'pushups' | 'squats' | 'wallsit' | 'jacks'

export interface ChallengeDef {
  id: ChallengeId
  name: string
  emoji: string
  kind: 'hold' | 'amrap'
  /** AMRAP length in seconds. */
  seconds?: number
  blurb: string
  tip: string
  /** Exercise for this user (respects level, equipment and aches). */
  exercise: (progress: ProgressState, ctx: PlanContext) => Exercise | undefined
}

export const CHALLENGES: ChallengeDef[] = [
  {
    id: 'plank',
    name: 'Plank hold',
    emoji: '🧱',
    kind: 'hold',
    blurb: 'Hold as long as you can. Stop when your form breaks.',
    tip: 'Squeeze your glutes and push the floor away. Breathe — don’t hold your breath.',
    exercise: (_p, ctx) => firstAllowed(['forearm-plank', 'knee-plank'], ctx),
  },
  {
    id: 'pushups',
    name: 'Push-up blitz',
    emoji: '💪',
    kind: 'amrap',
    seconds: 60,
    blurb: 'As many good push-ups as you can in 60 seconds.',
    tip: 'Phone under your face? Tap it with your nose at the bottom of each rep to count!',
    exercise: (p, ctx) => currentFor('h_push', p, ctx, 'knee-pushup'),
  },
  {
    id: 'squats',
    name: 'Squat sprint',
    emoji: '🦵',
    kind: 'amrap',
    seconds: 60,
    blurb: 'As many full squats as you can in 60 seconds.',
    tip: 'Hips back, chest up, thighs to parallel. Tap the screen each rep, or fix the count at the end.',
    exercise: (_p, ctx) => firstAllowed(['bodyweight-squat', 'box-squat'], ctx),
  },
  {
    id: 'wallsit',
    name: 'Wall sit',
    emoji: '🪑',
    kind: 'hold',
    blurb: 'Back flat on the wall, thighs level. How long can you last?',
    tip: 'Knees over ankles, weight in your heels. It burns — that’s the point.',
    exercise: (_p, ctx) => firstAllowed(['wall-sit'], ctx),
  },
  {
    id: 'jacks',
    name: 'Jack attack',
    emoji: '⭐',
    kind: 'amrap',
    seconds: 60,
    blurb: 'Jumping jacks for 60 seconds. Count every one.',
    tip: 'Light on your toes and keep a rhythm. Quiet mode swaps in step jacks.',
    exercise: (_p, ctx) => firstAllowed(ctx.quietMode || ctx.aches.includes('knees') ? ['step-jacks'] : ['jumping-jacks', 'step-jacks'], ctx),
  },
]

export interface ChallengeResult {
  date: ISODate
  value: number
  exerciseId: string
}

export interface ChallengeRecord {
  /** Best per exercise id (variants aren't compared with each other). */
  best: Record<string, number>
  history: ChallengeResult[]
}

export function challengeXp(def: ChallengeDef, value: number, isBest: boolean): number {
  const base = def.kind === 'hold' ? 15 + Math.min(20, Math.floor(value / 15) * 2) : 15 + Math.min(20, Math.floor(value / 5))
  return base + (isBest ? 15 : 0)
}

export function recordResult(rec: ChallengeRecord | undefined, r: ChallengeResult): { record: ChallengeRecord; isBest: boolean; previous?: number } {
  const best = { ...(rec?.best ?? {}) }
  const previous = best[r.exerciseId]
  const isBest = r.value > 0 && (previous === undefined || r.value > previous)
  if (isBest) best[r.exerciseId] = r.value
  return { record: { best, history: [...(rec?.history ?? []), r].slice(-200) }, isBest, previous }
}

/** Calories for a play session: MET × kg × hours (calisthenics circuits ≈ MET 6). */
export function playKcal(minutes: number, kg: number, met = 6): number {
  return Math.max(1, Math.round(met * kg * (minutes / 60)))
}
