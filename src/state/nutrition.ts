import { useLiveQuery } from 'dexie-react-hooks'
import { db, kvGet, kvSet, type FoodLogEntry, type MealSlot } from '@/db/db'
import type { ISODate, Profile } from '@/domain/types'
import { FOOD_BY_ID } from '@/data/foods'
import type { FoodItem } from '@/data/foods/types'
import { XP } from '@/engines/gamification'
import { recipeById } from '@/engines/meals/planner'
import { addMacros, foodMacros, recipeMacros, roundMacros, ZERO, type Macros } from '@/engines/nutrition/foods'
import { dailyTargets, type Targets } from '@/engines/nutrition/targets'
import { addDays, todayISO } from '@/lib/dates'
import { uid } from '@/lib/id'
import { addXp } from './gamification'

export const OZ_ML = 29.5735
/** Grams of fruit or vegetables that count as one "serving" for the habit tracker. */
export const PRODUCE_SERVING_G = 80

export interface NutritionSettings {
  /** Add workout calories to the day's budget. */
  eatBack: boolean
  /** Glass size for one-tap water logging (oz). */
  glassOz: number
}

const DEFAULT_SETTINGS: NutritionSettings = { eatBack: false, glassOz: 8 }

export function useNutritionSettings(): NutritionSettings {
  return useLiveQuery(async () => ({ ...DEFAULT_SETTINGS, ...((await kvGet<Partial<NutritionSettings>>('nutrition.settings')) ?? {}) }), []) ?? DEFAULT_SETTINGS
}

export async function saveNutritionSettings(patch: Partial<NutritionSettings>): Promise<void> {
  const cur = (await kvGet<Partial<NutritionSettings>>('nutrition.settings')) ?? {}
  await kvSet('nutrition.settings', { ...cur, ...patch })
}

export interface DayData {
  logs: FoodLogEntry[]
  waterMl: number
  burnedKcal: number
  workoutMinutes: number
}

export function useDay(date: ISODate): DayData | undefined {
  return useLiveQuery(async () => {
    const [logs, water, workouts] = await Promise.all([
      db.foodLogs.where('date').equals(date).sortBy('createdAt'),
      db.water.where('date').equals(date).toArray(),
      db.workouts.where('date').equals(date).toArray(),
    ])
    return {
      logs,
      waterMl: Math.round(water.reduce((s, w) => s + w.oz, 0) * OZ_ML),
      burnedKcal: workouts.reduce((s, w) => s + (w.calories ?? 0), 0),
      workoutMinutes: Math.round(workouts.reduce((s, w) => s + (w.finishedAt - w.startedAt), 0) / 60000),
    }
  }, [date])
}

export function totalsOf(logs: FoodLogEntry[]): Macros {
  return roundMacros(logs.reduce((t, l) => addMacros(t, { kcal: l.kcal, protein: l.protein, carbs: l.carbs, fat: l.fat, fiber: l.fiber ?? 0 }), ZERO))
}

export function produceServings(logs: FoodLogEntry[]): number {
  return Math.round(logs.reduce((s, l) => s + (l.veg ? (l.produceServings ?? Math.max(1, l.servings)) : 0), 0) * 2) / 2
}

export function targetsFor(profile: Profile, day?: DayData, settings?: NutritionSettings): Targets {
  const t = dailyTargets(profile, { workoutMinutes: day?.workoutMinutes ?? 0 })
  if (settings?.eatBack && day?.burnedKcal) return { ...t, kcal: t.kcal + Math.round(day.burnedKcal) }
  return t
}

/** Award once-a-day nutrition goals (feeds achievements and XP). */
async function updateHits(date: ISODate, profile: Profile) {
  const [logs, water] = await Promise.all([db.foodLogs.where('date').equals(date).toArray(), db.water.where('date').equals(date).toArray()])
  const t = dailyTargets(profile)
  const hits = (await kvGet<{ protein?: ISODate[]; water?: ISODate[] }>('nutrition.hits')) ?? {}
  const protein = new Set(hits.protein ?? [])
  const waterSet = new Set(hits.water ?? [])
  let changed = false
  if (!protein.has(date) && totalsOf(logs).protein >= t.protein) {
    protein.add(date)
    changed = true
    await addXp('protein-goal', XP.proteinGoal, date)
  }
  if (!waterSet.has(date) && water.reduce((s, w) => s + w.oz, 0) * OZ_ML >= t.waterMl) {
    waterSet.add(date)
    changed = true
    await addXp('water-goal', XP.waterGoal, date)
  }
  if (changed) await kvSet('nutrition.hits', { protein: [...protein].sort(), water: [...waterSet].sort() })
}

async function logXp(date: ISODate) {
  const today = await db.xpEvents.where('date').equals(date).filter((e) => e.kind === 'food-log').count()
  if (today * XP.foodLog < XP.foodLogDailyCap) await addXp('food-log', XP.foodLog, date)
}

export type NewEntry = Omit<FoodLogEntry, 'id' | 'createdAt'>

export async function addEntry(e: NewEntry, profile: Profile): Promise<string> {
  const id = uid('f')
  await db.foodLogs.add({ ...e, id, createdAt: Date.now() })
  await logXp(e.date)
  await updateHits(e.date, profile)
  return id
}

export async function updateEntry(id: string, patch: Partial<FoodLogEntry>, profile: Profile): Promise<void> {
  await db.foodLogs.update(id, patch)
  const e = await db.foodLogs.get(id)
  if (e) await updateHits(e.date, profile)
}

export async function removeEntry(id: string): Promise<void> {
  await db.foodLogs.delete(id)
}

/** Build a log entry for an amount of a built-in food. */
export function entryForFood(f: FoodItem, amount: number, servingLabel: string, servings: number, date: ISODate, meal: MealSlot): NewEntry {
  const m = roundMacros(foodMacros(f, amount * servings))
  return {
    date,
    meal,
    name: f.name,
    source: 'db',
    refId: f.id,
    servings,
    servingLabel,
    ...m,
    veg: f.produce ? true : undefined,
    produceServings: f.produce ? Math.max(0.5, Math.round(((amount * servings) / PRODUCE_SERVING_G) * 2) / 2) : undefined,
  }
}

export function entryForRecipe(recipeId: string, servings: number, date: ISODate, meal: MealSlot): NewEntry | null {
  const r = recipeById(recipeId)
  if (!r) return null
  const m = roundMacros(addMacros(ZERO, recipeMacros(r), servings))
  let produceG = 0
  for (const ing of r.ingredients) if (FOOD_BY_ID.get(ing.foodId)?.produce) produceG += (ing.amount / r.servings) * servings
  const produce = Math.round((produceG / PRODUCE_SERVING_G) * 2) / 2
  return {
    date,
    meal,
    name: r.name,
    source: 'recipe',
    refId: r.id,
    servings,
    servingLabel: servings === 1 ? '1 serving' : `${servings} servings`,
    ...m,
    veg: produce >= 0.5 ? true : undefined,
    produceServings: produce >= 0.5 ? produce : undefined,
  }
}

export async function addWater(date: ISODate, oz: number, profile: Profile): Promise<void> {
  await db.water.add({ id: uid('h2o'), date, oz, at: Date.now() })
  await updateHits(date, profile)
}

/** Undo the most recent water entry of the day. */
export async function undoWater(date: ISODate): Promise<void> {
  const list = await db.water.where('date').equals(date).sortBy('at')
  const last = list[list.length - 1]
  if (last) await db.water.delete(last.id)
}

export async function copyDay(from: ISODate, to: ISODate, profile: Profile): Promise<number> {
  const logs = await db.foodLogs.where('date').equals(from).toArray()
  for (const l of logs) {
    const { id: _id, createdAt: _c, ...rest } = l
    void _id
    void _c
    await db.foodLogs.add({ ...rest, date: to, id: uid('f'), createdAt: Date.now() })
  }
  if (logs.length) await updateHits(to, profile)
  return logs.length
}

export interface RecentFood {
  key: string
  entry: FoodLogEntry
}

/** Distinct recently logged foods, newest first. */
export function useRecents(limit = 20): RecentFood[] | undefined {
  return useLiveQuery(async () => {
    const since = addDays(todayISO(), -45)
    const logs = await db.foodLogs.where('date').aboveOrEqual(since).reverse().sortBy('createdAt')
    const seen = new Set<string>()
    const out: RecentFood[] = []
    for (const e of logs) {
      const key = `${e.source}:${e.refId ?? e.name}:${e.servingLabel}`
      if (seen.has(key)) continue
      seen.add(key)
      out.push({ key, entry: e })
      if (out.length >= limit) break
    }
    return out
  }, [limit])
}

export function useFavorites(): Set<string> | undefined {
  return useLiveQuery(async () => new Set((await kvGet<string[]>('food.favorites')) ?? []), [])
}

export async function toggleFavorite(key: string): Promise<void> {
  const cur = new Set((await kvGet<string[]>('food.favorites')) ?? [])
  if (cur.has(key)) cur.delete(key)
  else cur.add(key)
  await kvSet('food.favorites', [...cur])
}
