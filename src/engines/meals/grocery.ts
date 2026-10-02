import { FOOD_BY_ID } from '@/data/foods'
import type { FoodCategory } from '@/data/foods/types'
import { recipeById, type MealPlan } from './planner'

export const AISLE: Record<FoodCategory, string> = {
  vegetables: 'Vegetables',
  fruit: 'Fruit',
  protein: 'Meat, fish & tofu',
  eggs: 'Eggs',
  dairy: 'Dairy',
  bread: 'Bakery',
  grains: 'Grains & pasta',
  legumes: 'Beans & lentils',
  'nuts-seeds': 'Nuts & seeds',
  'fats-oils': 'Oils',
  condiments: 'Condiments & spices',
  sweets: 'Baking & sweets',
  snacks: 'Snacks',
  beverages: 'Drinks',
  prepared: 'Deli & prepared',
}

const AISLE_ORDER: FoodCategory[] = ['vegetables', 'fruit', 'protein', 'eggs', 'dairy', 'bread', 'grains', 'legumes', 'nuts-seeds', 'fats-oils', 'condiments', 'sweets', 'snacks', 'beverages', 'prepared']

export interface GroceryItem {
  foodId: string
  name: string
  amount: number
  unit: 'g' | 'ml'
  /** Friendly quantity, e.g. "about 6 large eggs (300 g)". */
  display: string
}

export interface GroceryAisle {
  category: FoodCategory
  label: string
  items: GroceryItem[]
}

function metric(amount: number, unit: 'g' | 'ml'): string {
  if (unit === 'g') return amount >= 1000 ? `${(amount / 1000).toFixed(amount >= 10000 ? 0 : 1)} kg` : `${Math.round(amount)} g`
  return amount >= 1000 ? `${(amount / 1000).toFixed(1)} L` : `${Math.round(amount)} ml`
}

/** Prefer a countable household unit ("1 large egg", "1 medium banana") when the food has one. */
export function friendlyAmount(foodId: string, amount: number): string {
  const f = FOOD_BY_ID.get(foodId)
  if (!f) return metric(amount, 'g')
  const countable = f.servings.find((s) => /^1 (?!cup|tbsp|tsp|oz|lb|slice of|scoop|serving|can|container|bottle|glass|pinch)/.test(s.label))
  const m = metric(amount, f.unit)
  if (countable && countable.amount > 0) {
    const n = Math.max(1, Math.ceil((amount / countable.amount) * 2) / 2)
    const what = countable.label.replace(/^1 /, '')
    if (/[()"]/.test(what)) return `about ${n} × ${what} (${m})`
    return `about ${n} ${n > 1 ? pluralize(what) : what} (${m})`
  }
  return m
}

const NO_PLURAL = new Set(['small', 'medium', 'large', 'whole', 'mini'])

/** "breast" → "breasts", "medium" stays "medium", "berry" → "berries". */
export function pluralize(label: string): string {
  const words = label.split(' ')
  const last = words[words.length - 1]
  if (NO_PLURAL.has(last) || last.endsWith('s') || !/^[a-z-]+$/i.test(last)) return label
  words[words.length - 1] = /[^aeiou]y$/i.test(last) ? `${last.slice(0, -1)}ies` : /(ch|sh|x)$/i.test(last) ? `${last}es` : `${last}s`
  return words.join(' ')
}

/** Shopping list for a plan: every ingredient summed across days and grouped by aisle. */
export function groceryList(plan: MealPlan, dates?: string[]): GroceryAisle[] {
  const totals = new Map<string, number>()
  for (const day of plan.days) {
    if (dates && !dates.includes(day.date)) continue
    for (const m of day.meals) {
      const r = recipeById(m.recipeId)
      if (!r) continue
      for (const ing of r.ingredients) totals.set(ing.foodId, (totals.get(ing.foodId) ?? 0) + (ing.amount * m.servings) / r.servings)
    }
  }
  const aisles = new Map<FoodCategory, GroceryItem[]>()
  for (const [foodId, amount] of totals) {
    const f = FOOD_BY_ID.get(foodId)
    if (!f) continue
    const list = aisles.get(f.category) ?? []
    list.push({ foodId, name: f.name, amount, unit: f.unit, display: friendlyAmount(foodId, amount) })
    aisles.set(f.category, list)
  }
  return AISLE_ORDER.filter((c) => aisles.has(c)).map((c) => ({
    category: c,
    label: AISLE[c],
    items: aisles.get(c)!.sort((a, b) => a.name.localeCompare(b.name)),
  }))
}

export function groceryText(aisles: GroceryAisle[]): string {
  return aisles.map((a) => `${a.label}\n${a.items.map((i) => `• ${i.name} — ${i.display}`).join('\n')}`).join('\n\n')
}
