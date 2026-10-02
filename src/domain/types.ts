/** Local calendar date, `YYYY-MM-DD` (always in the user's own timezone). */
export type ISODate = string

export type Sex = 'male' | 'female' | 'unspecified'
export type Goal = 'lose_fat' | 'build_muscle' | 'get_stronger' | 'general_fitness'
export type Experience = 'beginner' | 'intermediate' | 'advanced'
export type Ache = 'knees' | 'lower_back' | 'shoulders' | 'wrists'
export type DietStyle = 'none' | 'vegetarian' | 'vegan' | 'pescatarian' | 'kosher'
export type Units = 'imperial' | 'metric'
export type Lifestyle = 'sedentary' | 'light' | 'moderate' | 'active'
export type TrackingMode = 'full' | 'lite'
export type ReminderStyle = 'gentle' | 'coach' | 'custom' | 'off'

export interface Dumbbell {
  id: string
  weightLb: number
  count: number
  /** false = "I own it but can't find it right now" (e.g. the heavier one). */
  found: boolean
  label?: string
}

export interface Equipment {
  dumbbells: Dumbbell[]
  chair: boolean
  wall: boolean
  table: boolean
  stairs: boolean
  pullupBar: boolean
  mat: boolean
}

export interface Profile {
  name: string
  sex: Sex
  birthYear: number
  heightCm: number
  weightKg: number
  goalWeightKg?: number
  goal: Goal
  experience: Experience
  lifestyle: Lifestyle
  units: Units
  aches: Ache[]
  diet: DietStyle
  /** Free-text ingredient keywords to avoid, e.g. "peanut", "shellfish". */
  avoidFoods: string[]
  daysPerWeek: number
  /** ISO weekday numbers, 1 = Monday … 7 = Sunday. */
  trainingDays: number[]
  sessionMinutes: number
  /** 24h local time, e.g. "07:00". */
  preferredTime: string
  equipment: Equipment
  /** No jumping: apartment-friendly, joint-friendly. */
  quietMode?: boolean
  trackingMode: TrackingMode
  reminderStyle: ReminderStyle
  createdAt: string
}

export const DEFAULT_EQUIPMENT: Equipment = {
  dumbbells: [
    { id: 'db-20', weightLb: 20, count: 2, found: true, label: '20 lb pair' },
    { id: 'db-heavy', weightLb: 25, count: 1, found: false, label: 'heavier one' },
  ],
  chair: true,
  wall: true,
  table: false,
  stairs: false,
  pullupBar: false,
  mat: false,
}
