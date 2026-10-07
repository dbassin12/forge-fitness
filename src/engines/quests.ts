import type { ISODate } from '@/domain/types'

/**
 * Daily quests: three small, doable goals a day (one for moving, one for eating, one bonus).
 * Pure logic — the state layer gathers the facts and stores what was picked and done.
 */

export type QuestId = 'workout' | 'snack' | 'play' | 'move20' | 'protein' | 'water' | 'meals3' | 'veggies' | 'breakfast' | 'tutorial' | 'weighin' | 'breathe'
export type QuestKind = 'move' | 'eat' | 'bonus'

export interface QuestFacts {
  trainingDay: boolean
  /** A plan workout was logged today. */
  planDone: boolean
  snacks: number
  plays: number
  activeMinutes: number
  protein: number
  proteinTarget: number
  waterMl: number
  waterTargetMl: number
  imperial: boolean
  /** Meal slots (breakfast, lunch, dinner, snacks) with at least one entry. */
  mealsLogged: number
  breakfastLogged: boolean
  produce: number
  tutorials: number
  weighedIn: boolean
  lite: boolean
  /** 1 = Monday … 7 = Sunday. */
  weekday: number
  /** Days since the last weigh-in (null = never). */
  daysSinceWeighIn: number | null
  /** Breathing or relaxation sessions today (Bloom). */
  breaths?: number
  /** Bloom's gentle yoga program: practice-flavoured quests, breathing, and no weigh-in nudges. */
  yoga?: boolean
}

export interface QuestProgress {
  value: number
  target: number
  /** Unit shown after the numbers ("g", "oz", "min"); empty for counts. */
  unit: string
  done: boolean
}

export interface QuestDef {
  id: QuestId
  kind: QuestKind
  xp: number
  emoji: string
  title: (f: QuestFacts) => string
  /** Where tapping the quest takes you. */
  to: string
  progress: (f: QuestFacts) => QuestProgress
}

const OZ_ML = 29.5735
const count = (value: number, target: number, unit = ''): QuestProgress => ({ value, target, unit, done: value >= target })

export const QUESTS: Record<QuestId, QuestDef> = {
  workout: { id: 'workout', kind: 'move', xp: 30, emoji: '🏋️', title: () => 'Finish today’s workout', to: '/workout', progress: (f) => count(f.planDone ? 1 : 0, 1) },
  snack: { id: 'snack', kind: 'move', xp: 20, emoji: '☕', title: () => 'Do a 3-minute movement snack', to: '/workout?snack=3', progress: (f) => count(Math.min(1, f.snacks), 1) },
  play: { id: 'play', kind: 'move', xp: 20, emoji: '🎮', title: () => 'Play a game in the Play tab', to: '/play', progress: (f) => count(Math.min(1, f.plays), 1) },
  move20: { id: 'move20', kind: 'move', xp: 25, emoji: '⏱️', title: () => 'Move for 20 minutes', to: '/play', progress: (f) => count(Math.min(20, Math.round(f.activeMinutes)), 20, ' min') },
  protein: {
    id: 'protein',
    kind: 'eat',
    xp: 20,
    emoji: '🥚',
    title: (f) => `Hit your protein (${Math.round(f.proteinTarget)} g)`,
    to: '/eat',
    progress: (f) => count(Math.min(Math.round(f.protein), Math.round(f.proteinTarget)), Math.round(f.proteinTarget), ' g'),
  },
  water: {
    id: 'water',
    kind: 'eat',
    xp: 20,
    emoji: '💧',
    title: (f) => (f.imperial ? `Drink ${Math.round(f.waterTargetMl / OZ_ML)} oz of water` : `Drink ${(f.waterTargetMl / 1000).toFixed(1)} L of water`),
    to: '/eat',
    progress: (f) =>
      f.imperial
        ? count(Math.min(Math.round(f.waterMl / OZ_ML), Math.round(f.waterTargetMl / OZ_ML)), Math.round(f.waterTargetMl / OZ_ML), ' oz')
        : { value: Math.min(f.waterMl, f.waterTargetMl) / 1000, target: f.waterTargetMl / 1000, unit: ' L', done: f.waterMl >= f.waterTargetMl },
  },
  meals3: { id: 'meals3', kind: 'eat', xp: 15, emoji: '🍽️', title: () => 'Log 3 meals', to: '/eat', progress: (f) => count(Math.min(3, f.mealsLogged), 3) },
  veggies: { id: 'veggies', kind: 'eat', xp: 15, emoji: '🥦', title: () => 'Eat 3 servings of fruit or veg', to: '/eat', progress: (f) => count(Math.min(3, f.produce), 3) },
  breakfast: { id: 'breakfast', kind: 'bonus', xp: 10, emoji: '🍳', title: () => 'Log your breakfast', to: '/eat/add?meal=breakfast', progress: (f) => count(f.breakfastLogged ? 1 : 0, 1) },
  tutorial: { id: 'tutorial', kind: 'bonus', xp: 15, emoji: '🎬', title: () => 'Watch an exercise tutorial', to: '/train/library', progress: (f) => count(Math.min(1, f.tutorials), 1) },
  weighin: { id: 'weighin', kind: 'bonus', xp: 10, emoji: '⚖️', title: () => 'Weigh in', to: '/progress', progress: (f) => count(f.weighedIn ? 1 : 0, 1) },
  breathe: { id: 'breathe', kind: 'move', xp: 20, emoji: '🌬️', title: () => 'Take a few minutes to breathe', to: '/breathe', progress: (f) => count(Math.min(1, f.breaths ?? 0), 1) },
}

/** Bloom says the same things more gently. */
const BLOOM_QUESTS: Partial<Record<QuestId, Partial<QuestDef>>> = {
  workout: { emoji: '🧘', title: () => 'Finish today’s practice' },
  snack: { emoji: '🌸', title: () => 'Do a 3-minute mini flow' },
  tutorial: { title: () => 'Watch a pose tutorial' },
}

/** A quest as the current app presents it. */
export function questDef(id: QuestId, yoga = false): QuestDef {
  return yoga && BLOOM_QUESTS[id] ? { ...QUESTS[id], ...BLOOM_QUESTS[id] } : QUESTS[id]
}

/** Bonus XP for finishing all three. */
export const PERFECT_DAY_XP = 40

/** Small deterministic PRNG so a date always picks the same quests. */
function seeded(date: ISODate): () => number {
  let h = 2166136261
  for (let i = 0; i < date.length; i++) h = Math.imul(h ^ date.charCodeAt(i), 16777619)
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    h ^= h >>> 16
    return (h >>> 0) / 4294967296
  }
}

function pick<T>(rand: () => number, from: T[]): T {
  return from[Math.floor(rand() * from.length) % from.length]
}

/** The three quests for a day: move, eat, bonus. */
export function pickQuests(date: ISODate, f: QuestFacts): QuestId[] {
  const rand = seeded(date)
  if (f.yoga) {
    // Bloom: practice or a mini flow, a nourishing habit, and something calming. No scales.
    const move: QuestId = f.trainingDay ? 'workout' : pick<QuestId>(rand, ['snack', 'breathe'])
    const eat: QuestId = pick<QuestId>(rand, f.lite ? ['water', 'veggies', 'protein'] : ['water', 'veggies', 'protein', 'meals3'])
    const pool = (['breathe', 'tutorial', 'snack', 'breakfast', 'water', 'veggies'] as QuestId[]).filter((q) => q !== move && q !== eat && !(f.lite && q === 'breakfast'))
    return [move, eat, pick(rand, pool)]
  }
  const move: QuestId = f.trainingDay ? 'workout' : pick<QuestId>(rand, ['snack', 'play', 'move20'])
  const eat: QuestId = pick<QuestId>(rand, f.lite ? ['protein', 'water', 'veggies'] : ['protein', 'water', 'meals3', 'veggies'])
  const weighDay = f.weekday === 6 || (f.daysSinceWeighIn !== null && f.daysSinceWeighIn >= 7)
  let bonus: QuestId
  if (weighDay && !f.weighedIn) bonus = 'weighin'
  else {
    const pool = (['tutorial', 'play', 'snack', 'breakfast', 'water', 'veggies'] as QuestId[]).filter((q) => q !== move && q !== eat && !(f.lite && q === 'breakfast'))
    bonus = pick(rand, pool)
  }
  return [move, eat, bonus]
}

export function questProgress(id: QuestId, f: QuestFacts): QuestProgress {
  return QUESTS[id].progress(f)
}
