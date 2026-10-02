import type { Goal } from '@/domain/types'

export type TipCategory =
  | 'training'
  | 'form'
  | 'nutrition'
  | 'hydration'
  | 'sleep'
  | 'recovery'
  | 'mindset'
  | 'habits'
  | 'time'
  | 'safety'

export type TipContext =
  | 'any'
  | 'morning'
  | 'evening'
  | 'rest-between-sets'
  | 'pre-workout'
  | 'post-workout'
  | 'rest-day'
  | 'missed-workout'
  | 'streak'
  | 'plateau'
  | 'first-week'
  | 'low-protein'
  | 'over-calories'
  | 'under-calories'
  | 'low-water'
  | 'dumbbells'
  | 'busy'
  | 'weekend'
  | 'travel'
  | 'sore'

export interface Tip {
  id: string
  /** Optional 2–5 word headline. */
  title?: string
  /** The tip itself: one or two sentences, ≤ 220 characters, friendly and specific. */
  text: string
  category: TipCategory
  /** Goals this is most relevant to; omit for everyone. */
  goals?: Goal[]
  contexts: TipContext[]
}
