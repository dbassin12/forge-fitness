import { isBloom } from '@/app/brand'

/** XP awards. Generous enough to feel good, simple enough to explain. */
export const XP = {
  workout: 40,
  perMinute: 2,
  pr: 15,
  levelUp: 25,
  feedback: 5,
  snack: 15,
  test: 30,
  foodLog: 2,
  foodLogDailyCap: 10,
  proteinGoal: 10,
  waterGoal: 10,
  weighIn: 5,
  achievement: 20,
} as const

export function workoutXp(o: { minutes: number; prs: number; levelUps: number; snack?: boolean; feedback?: boolean }): number {
  if (o.snack) return XP.snack + Math.round(o.minutes) * XP.perMinute
  return XP.workout + Math.round(o.minutes) * XP.perMinute + o.prs * XP.pr + o.levelUps * XP.levelUp + (o.feedback ? XP.feedback : 0)
}

/** Total XP needed to reach `level` (level 1 = 0, 2 = 100, 3 = 300, 4 = 600 …). */
export function xpForLevel(level: number): number {
  return 50 * level * (level - 1)
}

export interface LevelInfo {
  level: number
  /** XP earned inside this level. */
  into: number
  /** XP span of this level. */
  span: number
  progress: number
}

export function levelForXp(xp: number): LevelInfo {
  let level = 1
  while (xpForLevel(level + 1) <= xp) level++
  const start = xpForLevel(level)
  const span = xpForLevel(level + 1) - start
  const into = xp - start
  return { level, into, span, progress: span ? into / span : 0 }
}

const FORGE_TITLES = ['Spark', 'Ember', 'Kindling', 'Flame', 'Blaze', 'Forge', 'Iron', 'Steel', 'Titan', 'Legend']
/** Bloom grows from a seed to a garden. */
const BLOOM_TITLES = ['Seed', 'Sprout', 'Seedling', 'Leaf', 'Bud', 'Petal', 'Blossom', 'Lotus', 'Grove', 'Garden']
const TITLES = isBloom ? BLOOM_TITLES : FORGE_TITLES

export function levelTitle(level: number): string {
  return TITLES[Math.min(TITLES.length - 1, Math.floor((level - 1) / 3))]
}
