import { FOOD_BY_ID, FOODS } from '@/data/foods'
import type { FoodItem, KosherClass, Nutrients } from '@/data/foods/types'
import { RECIPES } from '@/data/recipes'
import type { MealType, Recipe } from '@/data/recipes/types'
import type { DietStyle } from '@/domain/types'

export interface Macros {
  kcal: number
  protein: number
  carbs: number
  fat: number
  fiber: number
}

export const ZERO: Macros = { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }

export function addMacros(a: Macros, b: Partial<Macros>, k = 1): Macros {
  return {
    kcal: a.kcal + (b.kcal ?? 0) * k,
    protein: a.protein + (b.protein ?? 0) * k,
    carbs: a.carbs + (b.carbs ?? 0) * k,
    fat: a.fat + (b.fat ?? 0) * k,
    fiber: a.fiber + (b.fiber ?? 0) * k,
  }
}

export function roundMacros(m: Macros): Macros {
  return {
    kcal: Math.round(m.kcal),
    protein: Math.round(m.protein * 10) / 10,
    carbs: Math.round(m.carbs * 10) / 10,
    fat: Math.round(m.fat * 10) / 10,
    fiber: Math.round(m.fiber * 10) / 10,
  }
}

/** Nutrition for an amount in grams (or ml) of a food. */
export function foodMacros(f: FoodItem, amount: number): Macros {
  const k = amount / 100
  const n: Nutrients = f.per100
  return { kcal: n.kcal * k, protein: n.protein * k, carbs: n.carbs * k, fat: n.fat * k, fiber: n.fiber * k }
}

// ---- Diet rules ---------------------------------------------------------------------------

/** Is a food acceptable for a diet style (kosher-style = no pork/shellfish)? */
export function foodFitsDiet(f: FoodItem, diet: DietStyle): boolean {
  switch (diet) {
    case 'none':
      return true
    case 'kosher':
      return f.kosher !== 'nonkosher'
    case 'vegetarian':
      return f.vegetarian
    case 'vegan':
      return f.vegan
    case 'pescatarian':
      return f.vegetarian || f.kosher === 'fish'
  }
}

/** Kosher class of a whole recipe: meat or dairy if any ingredient is, else fish/pareve. */
export function recipeKosher(r: Recipe): KosherClass {
  const classes = new Set(r.ingredients.map((i) => FOOD_BY_ID.get(i.foodId)?.kosher ?? 'pareve'))
  if (classes.has('nonkosher')) return 'nonkosher'
  if (classes.has('meat')) return 'meat'
  if (classes.has('dairy')) return 'dairy'
  if (classes.has('fish')) return 'fish'
  return 'pareve'
}

export function recipeFits(r: Recipe, diet: DietStyle, avoid: string[] = []): boolean {
  for (const ing of r.ingredients) {
    const f = FOOD_BY_ID.get(ing.foodId)
    if (!f || !foodFitsDiet(f, diet)) return false
    if (avoid.length) {
      const hay = `${f.name} ${f.aliases.join(' ')} ${ing.display}`.toLowerCase()
      if (avoid.some((a) => a && hay.includes(a))) return false
    }
  }
  return recipeKosher(r) !== 'nonkosher' || diet === 'none'
}

const recipeCache = new Map<string, Macros>()

/** Per-serving nutrition of a recipe, computed from the food database. */
export function recipeMacros(r: Recipe): Macros {
  let m = recipeCache.get(r.id)
  if (!m) {
    let t = ZERO
    for (const ing of r.ingredients) {
      const f = FOOD_BY_ID.get(ing.foodId)
      if (f) t = addMacros(t, foodMacros(f, ing.amount))
    }
    m = roundMacros({ kcal: t.kcal / r.servings, protein: t.protein / r.servings, carbs: t.carbs / r.servings, fat: t.fat / r.servings, fiber: t.fiber / r.servings })
    recipeCache.set(r.id, m)
  }
  return m
}

export function recipesFor(meal: MealType, diet: DietStyle, avoid: string[] = []): Recipe[] {
  return RECIPES.filter((r) => r.meals.includes(meal) && recipeFits(r, diet, avoid))
}

// ---- Search -----------------------------------------------------------------------------------

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const index = FOODS.map((f) => ({ f, name: norm(f.name), aka: f.aliases.map(norm) }))

/** Rank built-in foods for a query: whole-name and prefix hits first, then word and alias hits. */
export function searchFoods(query: string, opts: { diet?: DietStyle; limit?: number } = {}): FoodItem[] {
  const q = norm(query)
  if (!q) return []
  const words = q.split(' ')
  const scored: { f: FoodItem; s: number }[] = []
  for (const { f, name, aka } of index) {
    if (opts.diet === 'kosher' && f.kosher === 'nonkosher') continue
    let s = 0
    if (name === q || aka.includes(q)) s += 100
    if (name.startsWith(q)) s += 60
    if (aka.some((a) => a.startsWith(q))) s += 45
    const hay = `${name} ${aka.join(' ')}`
    const hits = words.filter((w) => hay.includes(w)).length
    if (hits === 0) continue
    s += (hits / words.length) * 40
    if (hits < words.length) s -= 25
    s -= name.length / 40
    if (s > 0) scored.push({ f, s })
  }
  return scored
    .sort((a, b) => b.s - a.s)
    .slice(0, opts.limit ?? 30)
    .map((x) => x.f)
}

/** Default household serving for a food. */
export function defaultServing(f: FoodItem): { label: string; amount: number } {
  return f.servings[f.defaultServing] ?? f.servings[0] ?? { label: `100 ${f.unit}`, amount: 100 }
}
