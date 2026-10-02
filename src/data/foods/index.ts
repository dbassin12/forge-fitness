import type { FoodItem } from './types'
import { CONDIMENT_FOODS, SWEET_FOODS } from './condiments-sweets'
import { DAIRY_FOODS, EGG_FOODS } from './dairy-eggs'
import { BREAD_FOODS, GRAIN_FOODS } from './grains-bread'
import { FAT_OIL_FOODS, LEGUME_FOODS, NUT_SEED_FOODS } from './legumes-nuts-fats'
import { PREPARED_FOODS } from './prepared'
import { FRUIT_FOODS, VEGETABLE_FOODS } from './produce'
import { PROTEIN_FOODS } from './protein'
import { BEVERAGE_FOODS, SNACK_FOODS } from './snacks-drinks'

/**
 * Built-in food database (values per 100 g / 100 ml, from USDA FoodData Central reference data —
 * SR Legacy, Foundation and FNDDS — rounded; composite dishes are typical-recipe estimates).
 */
export const FOODS: FoodItem[] = [
  ...PROTEIN_FOODS,
  ...EGG_FOODS,
  ...DAIRY_FOODS,
  ...GRAIN_FOODS,
  ...BREAD_FOODS,
  ...FRUIT_FOODS,
  ...VEGETABLE_FOODS,
  ...LEGUME_FOODS,
  ...NUT_SEED_FOODS,
  ...FAT_OIL_FOODS,
  ...SNACK_FOODS,
  ...BEVERAGE_FOODS,
  ...PREPARED_FOODS,
  ...CONDIMENT_FOODS,
  ...SWEET_FOODS,
]

/** Lookup by id (ids are stable and referenced by recipes and logs). */
export const FOOD_BY_ID: ReadonlyMap<string, FoodItem> = new Map(FOODS.map((f) => [f.id, f]))
