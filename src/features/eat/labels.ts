import type { MealSlot } from '@/db/db'

export const MEAL_LABEL: Record<MealSlot, string> = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snacks' }

/** Default meal for "now". */
export function mealForHour(h: number): MealSlot {
  if (h < 10.5) return 'breakfast'
  if (h < 15) return 'lunch'
  if (h >= 17 && h < 21) return 'dinner'
  return 'snack'
}
