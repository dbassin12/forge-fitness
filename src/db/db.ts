import Dexie, { type Table } from 'dexie'
import type { ISODate } from '@/domain/types'

/** Generic key/value store for singletons: profile, settings, plan state, gamification, etc. */
export interface KVRow {
  key: string
  value: unknown
  updatedAt: number
}

export interface SetLog {
  reps?: number
  seconds?: number
  /** Load used, in lb (0 for bodyweight). */
  loadLb?: number
  targetReps?: number
  targetSeconds?: number
}

export interface ExerciseLog {
  exerciseId: string
  slot?: string
  /** Progression ladder the exercise was planned for. */
  ladder?: string
  block?: 'warmup' | 'main' | 'finisher' | 'cooldown'
  sets: SetLog[]
  /** Per-exercise difficulty the user reported (optional). */
  rating?: 'easy' | 'right' | 'hard'
}

export interface WorkoutLog {
  id: string
  date: ISODate
  startedAt: number
  finishedAt: number
  /** Stable identifier of the planned session (e.g. "w3-full-b"), or "snack" / "custom". */
  sessionKey: string
  title: string
  kind: 'plan' | 'snack' | 'custom' | 'test'
  exercises: ExerciseLog[]
  feedback?: 'easy' | 'right' | 'hard'
  calories: number
  xp: number
}

export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack'

export interface FoodLogEntry {
  id: string
  date: ISODate
  meal: MealSlot
  name: string
  /** Where it came from: built-in DB id, custom food id, barcode, recipe id, AI estimate, or quick add. */
  source: 'db' | 'custom' | 'barcode' | 'search' | 'recipe' | 'ai' | 'quick'
  refId?: string
  servings: number
  servingLabel: string
  kcal: number
  protein: number
  carbs: number
  fat: number
  fiber?: number
  /** Counts toward the "veggies" habit in lite mode. */
  veg?: boolean
  createdAt: number
}

export interface CustomFood {
  id: string
  name: string
  servingLabel: string
  kcal: number
  protein: number
  carbs: number
  fat: number
  fiber?: number
  barcode?: string
  favorite?: boolean
  createdAt: number
}

export interface WaterEntry {
  id: string
  date: ISODate
  oz: number
  at: number
}

export interface WeightEntry {
  date: ISODate
  kg: number
  at: number
}

export interface Measurement {
  id: string
  date: ISODate
  waistCm?: number
  chestCm?: number
  hipsCm?: number
  armCm?: number
  thighCm?: number
  at: number
}

export interface ProgressPhoto {
  id: string
  date: ISODate
  blob: Blob
  pose: 'front' | 'side' | 'back'
  at: number
}

export interface AchievementUnlock {
  id: string
  unlockedAt: number
}

export interface XpEvent {
  id: string
  date: ISODate
  kind: string
  xp: number
  at: number
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  createdAt: number
}

export class ForgeDB extends Dexie {
  kv!: Table<KVRow, string>
  workouts!: Table<WorkoutLog, string>
  foodLogs!: Table<FoodLogEntry, string>
  customFoods!: Table<CustomFood, string>
  water!: Table<WaterEntry, string>
  weights!: Table<WeightEntry, string>
  measurements!: Table<Measurement, string>
  photos!: Table<ProgressPhoto, string>
  achievements!: Table<AchievementUnlock, string>
  xpEvents!: Table<XpEvent, string>
  chat!: Table<ChatMessage, string>

  constructor(name = 'forge') {
    super(name)
    this.version(1).stores({
      kv: 'key',
      workouts: 'id, date, sessionKey, kind',
      foodLogs: 'id, date, [date+meal], refId',
      customFoods: 'id, name, barcode',
      water: 'id, date',
      weights: 'date',
      measurements: 'id, date',
      photos: 'id, date',
      achievements: 'id',
      xpEvents: 'id, date, kind',
      chat: 'id, createdAt',
    })
  }
}

export const db = new ForgeDB()

export async function kvGet<T>(key: string): Promise<T | undefined> {
  const row = await db.kv.get(key)
  return row?.value as T | undefined
}

export async function kvSet<T>(key: string, value: T): Promise<void> {
  await db.kv.put({ key, value, updatedAt: Date.now() })
}
