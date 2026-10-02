import type { Recipe } from './types'
import { BREAKFAST_RECIPES } from './breakfast'
import { DINNER_RECIPES } from './dinner'
import { LUNCH_RECIPES } from './lunch'
import { SNACK_RECIPES } from './snacks'

/**
 * Built-in quick, high-protein, kosher-style recipes (never meat with dairy or meat with fish).
 * Ingredient amounts are for the whole recipe; per-serving nutrition is computed from FOODS.
 */
export const RECIPES: Recipe[] = [...BREAKFAST_RECIPES, ...LUNCH_RECIPES, ...DINNER_RECIPES, ...SNACK_RECIPES]
