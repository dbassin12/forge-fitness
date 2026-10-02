import { RECIPES } from '@/data/recipes'
import type { MealType, Recipe } from '@/data/recipes/types'
import type { DietStyle, ISODate } from '@/domain/types'
import { addDays } from '@/lib/dates'
import { addMacros, recipeKosher, recipeMacros, recipesFor, roundMacros, ZERO, type Macros } from '../nutrition/foods'

export const MEALS: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack']

/** Share of the day's calories (and protein) per meal. */
export const MEAL_SPLIT: Record<MealType, number> = { breakfast: 0.25, lunch: 0.35, dinner: 0.3, snack: 0.1 }

export const PORTIONS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]

export interface PlannedMeal {
  meal: MealType
  recipeId: string
  servings: number
  macros: Macros
}

export interface PlanDay {
  date: ISODate
  meals: PlannedMeal[]
  totals: Macros
}

export interface MealPlan {
  weekOf: ISODate
  kcal: number
  protein: number
  diet: DietStyle
  days: PlanDay[]
}

export interface PlanOptions {
  weekOf: ISODate
  kcal: number
  protein: number
  diet: DietStyle
  avoid?: string[]
  /** Variety seed (e.g. a "shuffle" counter). */
  seed?: number
  days?: number
}

function hash(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return (h >>> 0) / 4294967295
}

const BY_ID = new Map(RECIPES.map((r) => [r.id, r]))
export const recipeById = (id: string): Recipe | undefined => BY_ID.get(id)

function mealOf(recipe: Recipe, meal: MealType, servings: number): PlannedMeal {
  const m = recipeMacros(recipe)
  return { meal, recipeId: recipe.id, servings, macros: roundMacros(addMacros(ZERO, m, servings)) }
}

function totalsOf(meals: PlannedMeal[]): Macros {
  return roundMacros(meals.reduce((t, m) => addMacros(t, m.macros), ZERO))
}

/** Kosher-style: no dairy snack after a meat lunch (the snack is the afternoon one). */
function kosherOk(diet: DietStyle, meal: MealType, recipe: Recipe, chosen: PlannedMeal[]): boolean {
  if (diet !== 'kosher' || meal !== 'snack') return true
  const lunch = chosen.find((m) => m.meal === 'lunch')
  const lunchMeat = lunch ? recipeKosher(BY_ID.get(lunch.recipeId)!) === 'meat' : false
  return !(lunchMeat && recipeKosher(recipe) === 'dairy')
}

/**
 * Build a week of meals that hits the calorie target (±5 % most days) and the protein target,
 * respects the diet (kosher-style never mixes meat and dairy) and avoids repeats.
 */
export function planWeek(o: PlanOptions): MealPlan {
  const days: PlanDay[] = []
  const nDays = o.days ?? 7
  const pools = Object.fromEntries(MEALS.map((m) => [m, recipesFor(m, o.diet, o.avoid ?? [])])) as Record<MealType, Recipe[]>
  const history: { day: number; recipeId: string }[] = []

  for (let d = 0; d < nDays; d++) {
    const date = addDays(o.weekOf, d)
    // Variety matters, but never more than hitting the day's calories (see the fix-up pass).
    let varietyWeight = 1
    const penalty = (id: string) => {
      let p = 0
      for (const h of history) {
        if (h.recipeId !== id) continue
        const ago = d - h.day
        p += ago <= 2 ? 260 : 70
      }
      return p * varietyWeight
    }
    const score = (meal: MealType, r: Recipe, servings: number, otherKcal: number, otherProtein: number, finalPass: boolean) => {
      const m = recipeMacros(r)
      const kcal = m.kcal * servings
      const protein = m.protein * servings
      const tK = finalPass ? o.kcal - otherKcal : o.kcal * MEAL_SPLIT[meal]
      const tP = finalPass ? o.protein - otherProtein : o.protein * MEAL_SPLIT[meal]
      const kcalErr = (Math.abs(kcal - tK) / Math.max(150, o.kcal * MEAL_SPLIT[meal])) * 100
      const proteinShort = Math.max(0, tP - protein) * 1.6
      const odd = servings === 1 ? 0 : servings === 0.5 || servings === 2 ? 9 : 4
      const jitter = hash(`${o.seed ?? 0}:${date}:${meal}:${r.id}`) * 14
      return kcalErr + proteinShort + penalty(r.id) + odd + jitter
    }

    // Greedy pass, meal by meal.
    let meals: PlannedMeal[] = []
    for (const meal of MEALS) {
      let best: { r: Recipe; s: number; v: number } | null = null
      for (const r of pools[meal]) {
        if (!kosherOk(o.diet, meal, r, meals)) continue
        for (const s of PORTIONS) {
          const v = score(meal, r, s, 0, 0, false)
          if (!best || v < best.v) best = { r, s, v }
        }
      }
      if (best) meals.push(mealOf(best.r, meal, best.s))
    }
    // Refinement: re-pick each meal against what the rest of the day leaves. If the day is still
    // off target (small recipe pools, e.g. vegan), relax the variety penalty and go again.
    for (let pass = 0; pass < 4; pass++) {
      if (pass >= 2) {
        const err = Math.abs(totalsOf(meals).kcal - o.kcal) / o.kcal
        if (err <= 0.05) break
        varietyWeight = pass === 2 ? 0.2 : 0
      }
      for (let i = meals.length - 1; i >= 0; i--) {
        const rest = meals.filter((_, j) => j !== i)
        const restT = totalsOf(rest)
        const meal = meals[i].meal
        let best: { r: Recipe; s: number; v: number } | null = null
        for (const r of pools[meal]) {
          if (rest.some((m) => m.recipeId === r.id)) continue
          if (!kosherOk(o.diet, meal, r, rest)) continue
          for (const s of PORTIONS) {
            const v = score(meal, r, s, restT.kcal, restT.protein, true)
            if (!best || v < best.v) best = { r, s, v }
          }
        }
        if (best) meals[i] = mealOf(best.r, meal, best.s)
        meals = MEALS.flatMap((m) => meals.filter((x) => x.meal === m))
      }
    }
    for (const m of meals) history.push({ day: d, recipeId: m.recipeId })
    days.push({ date, meals, totals: totalsOf(meals) })
  }
  return { weekOf: o.weekOf, kcal: o.kcal, protein: o.protein, diet: o.diet, days }
}

/** Replace one meal of a plan with a specific recipe (keeping the portion near the old calories). */
export function swapMeal(plan: MealPlan, date: ISODate, meal: MealType, recipeId: string): MealPlan {
  const r = BY_ID.get(recipeId)
  if (!r) return plan
  return {
    ...plan,
    days: plan.days.map((d) => {
      if (d.date !== date) return d
      const old = d.meals.find((m) => m.meal === meal)
      const target = old?.macros.kcal ?? plan.kcal * MEAL_SPLIT[meal]
      const per = recipeMacros(r).kcal || 1
      const servings = PORTIONS.reduce((a, b) => (Math.abs(b * per - target) < Math.abs(a * per - target) ? b : a), 1)
      const meals = d.meals.map((m) => (m.meal === meal ? mealOf(r, meal, servings) : m))
      return { ...d, meals, totals: totalsOf(meals) }
    }),
  }
}

/** Alternatives for a meal slot, best calorie fit first. */
export function mealAlternatives(plan: MealPlan, date: ISODate, meal: MealType, avoid: string[] = [], limit = 10): Recipe[] {
  const day = plan.days.find((d) => d.date === date)
  const target = day?.meals.find((m) => m.meal === meal)?.macros.kcal ?? plan.kcal * MEAL_SPLIT[meal]
  const current = day?.meals.find((m) => m.meal === meal)?.recipeId
  return recipesFor(meal, plan.diet, avoid)
    .filter((r) => r.id !== current && kosherOk(plan.diet, meal, r, day?.meals.filter((m) => m.meal !== meal) ?? []))
    .sort((a, b) => {
      const fit = (r: Recipe) => Math.min(...PORTIONS.map((s) => Math.abs(recipeMacros(r).kcal * s - target)))
      return fit(a) - fit(b)
    })
    .slice(0, limit)
}
