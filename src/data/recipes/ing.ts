import type { RecipeIngredient } from './types'

/** Ingredient shorthand: food id, amount in g (or ml) for the whole recipe, and display text. */
export const ing = (foodId: string, amount: number, display: string): RecipeIngredient => ({ foodId, amount, display })
