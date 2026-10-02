export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'

export interface RecipeIngredient {
  /** Must be a FoodItem id from src/data/foods. */
  foodId: string
  /** Grams (or ml for liquids) for the WHOLE recipe. */
  amount: number
  /** Human text shown in the recipe, e.g. "2 large eggs". */
  display: string
}

export interface Recipe {
  id: string
  name: string
  /** One-line description. */
  blurb: string
  meals: MealType[]
  prepMin: number
  cookMin: number
  noCook: boolean
  servings: number
  ingredients: RecipeIngredient[]
  steps: string[]
  tags: ('high-protein' | 'quick' | 'budget' | 'meal-prep' | 'leftovers' | 'no-cook' | 'vegetarian' | 'vegan' | 'pescatarian' | 'gluten-free' | 'dairy-free' | 'one-pan' | 'high-fiber' | 'low-carb')[]
  /** Good for cooking once and eating the next day too. */
  leftoverFriendly?: boolean
}
