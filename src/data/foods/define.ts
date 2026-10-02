import type { Allergen, FoodCategory, FoodItem, KosherClass } from './types'

/**
 * Compact nutrient tuple, per 100 g (or per 100 ml when the food is measured in ml):
 * [kcal, protein g, carbs g, fat g, fiber g, sugar g, sodium mg]
 */
export type NutrientTuple = [kcal: number, protein: number, carbs: number, fat: number, fiber: number, sugar: number, sodium: number]

/** [label, amount in g (or ml)] */
export type ServingTuple = [label: string, amount: number]

export interface FoodSpec {
  id: string
  name: string
  /** Search synonyms. */
  aka?: string[]
  n: NutrientTuple
  /** Grams of alcohol per 100 ml (drinks). */
  alc?: number
  /** Measured in ml rather than g. */
  ml?: boolean
  sv: ServingTuple[]
  /** Index of the default serving (0 when omitted). */
  def?: number
  k: KosherClass
  /**
   * Diet override. When omitted it is derived: meat/fish/nonkosher → neither; anything with a
   * milk or egg allergen (or kosher dairy) → vegetarian; otherwise vegan.
   */
  diet?: 'vegan' | 'vegetarian' | 'neither'
  al?: Allergen[]
  produce?: boolean
}

function dietOf(s: FoodSpec): 'vegan' | 'vegetarian' | 'neither' {
  if (s.diet) return s.diet
  const al = s.al ?? []
  if (s.k === 'meat' || s.k === 'fish' || s.k === 'nonkosher') return 'neither'
  if (al.includes('fish') || al.includes('shellfish')) return 'neither'
  if (s.k === 'dairy' || al.includes('milk') || al.includes('egg')) return 'vegetarian'
  return 'vegan'
}

/** Expand compact specs into full FoodItems for one category. */
export function defineFoods(category: FoodCategory, specs: FoodSpec[]): FoodItem[] {
  return specs.map((s) => {
    const [kcal, protein, carbs, fat, fiber, sugar, sodium] = s.n
    const diet = dietOf(s)
    const item: FoodItem = {
      id: s.id,
      name: s.name,
      aliases: s.aka ?? [],
      category,
      per100: s.alc ? { kcal, protein, carbs, fat, fiber, sugar, sodium, alcohol: s.alc } : { kcal, protein, carbs, fat, fiber, sugar, sodium },
      unit: s.ml ? 'ml' : 'g',
      servings: s.sv.map(([label, amount]) => ({ label, amount })),
      defaultServing: s.def ?? 0,
      kosher: s.k,
      vegan: diet === 'vegan',
      vegetarian: diet !== 'neither',
      allergens: s.al ?? [],
    }
    if (s.produce) item.produce = true
    return item
  })
}
