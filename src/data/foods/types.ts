export type FoodCategory =
  | 'protein'
  | 'dairy'
  | 'eggs'
  | 'grains'
  | 'bread'
  | 'fruit'
  | 'vegetables'
  | 'legumes'
  | 'nuts-seeds'
  | 'fats-oils'
  | 'snacks'
  | 'beverages'
  | 'prepared'
  | 'condiments'
  | 'sweets'

/** Kosher category of the food itself (used to keep meat and dairy apart in meal plans). */
export type KosherClass = 'meat' | 'dairy' | 'pareve' | 'fish' | 'nonkosher'

export type Allergen = 'milk' | 'egg' | 'fish' | 'shellfish' | 'tree-nuts' | 'peanuts' | 'wheat' | 'soy' | 'sesame'

export interface Nutrients {
  kcal: number
  protein: number
  carbs: number
  fat: number
  fiber: number
  sugar?: number
  /** milligrams */
  sodium?: number
  /** grams of alcohol (7 kcal/g), for drinks */
  alcohol?: number
}

export interface FoodItem {
  /** kebab-case, unique, stable (referenced by recipes and logs). */
  id: string
  /** Display name, e.g. "Egg, large" or "Greek yogurt, plain nonfat". */
  name: string
  /** Extra search words (brand-free synonyms, plurals, common misspellings). */
  aliases: string[]
  category: FoodCategory
  /** Nutrients per 100 g (or per 100 ml when unit is 'ml'). */
  per100: Nutrients
  unit: 'g' | 'ml'
  /** Household servings; `amount` is in grams (or ml). */
  servings: { label: string; amount: number }[]
  /** Index into `servings` used by default. */
  defaultServing: number
  kosher: KosherClass
  vegan: boolean
  vegetarian: boolean
  allergens: Allergen[]
  /** Counts as a fruit/vegetable serving for the daily habit tracker. */
  produce?: boolean
}
