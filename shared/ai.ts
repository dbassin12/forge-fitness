/** Shapes shared by the AI endpoints and the app. */

export type Confidence = 'high' | 'medium' | 'low'

export interface FoodEstimateItem {
  name: string
  portion: string
  /** Estimated edible weight as served. */
  grams: number
  kcal: number
  protein: number
  carbs: number
  fat: number
  fiber: number
  /** Fruit and vegetable servings (~80 g each). */
  produceServings: number
  confidence: Confidence
}

export interface FoodEstimate {
  isFood: boolean
  items: FoodEstimateItem[]
  notes: string
}

export interface ChatTurn {
  role: 'user' | 'assistant'
  text: string
}

/** One line of the coach's NDJSON stream. */
export type CoachEvent =
  | { type: 'text'; text: string }
  | { type: 'done'; truncated?: boolean; model: string }
  | { type: 'refusal' }
  | { type: 'error'; error: string }
