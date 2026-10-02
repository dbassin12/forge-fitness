import type { Goal, Lifestyle, Profile, Sex } from '@/domain/types'

export const ACTIVITY_FACTOR: Record<Lifestyle, number> = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725 }
const SEX_CONSTANT: Record<Sex, number> = { male: 5, female: -161, unspecified: -78 }
/** Never prescribe below these without medical supervision. */
export const CALORIE_FLOOR: Record<Sex, number> = { male: 1500, female: 1200, unspecified: 1350 }

export interface Targets {
  kcal: number
  protein: number
  carbs: number
  fat: number
  fiber: number
  waterMl: number
  bmr: number
  tdee: number
  /** Planned daily surplus (+) or deficit (−) versus maintenance. */
  adjustment: number
}

export function ageFrom(birthYear: number, today: Date = new Date()): number {
  return Math.max(13, today.getFullYear() - birthYear)
}

/** Mifflin–St Jeor resting energy expenditure. */
export function bmr(p: { sex: Sex; weightKg: number; heightCm: number; age: number }): number {
  return 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age + SEX_CONSTANT[p.sex]
}

const round = (x: number, to: number) => Math.round(x / to) * to

export function calorieTarget(tdee: number, goal: Goal, sex: Sex): number {
  switch (goal) {
    case 'lose_fat':
      return Math.max(CALORIE_FLOOR[sex], tdee - Math.min(0.2 * tdee, 750))
    case 'build_muscle':
      return tdee + Math.min(0.08 * tdee, 350)
    case 'get_stronger':
      return tdee * 1.05
    case 'general_fitness':
      return tdee
  }
}

export function dailyTargets(
  p: Pick<Profile, 'sex' | 'birthYear' | 'heightCm' | 'weightKg' | 'goalWeightKg' | 'goal' | 'lifestyle'>,
  opts: { today?: Date; workoutMinutes?: number } = {},
): Targets {
  const age = ageFrom(p.birthYear, opts.today)
  const b = bmr({ sex: p.sex, weightKg: p.weightKg, heightCm: p.heightCm, age })
  const tdee = b * ACTIVITY_FACTOR[p.lifestyle]
  const kcal = round(calorieTarget(tdee, p.goal, p.sex), 10)
  // Protein: ~0.8 g per lb of goal weight, kept within 1.2–2.2 g per kg of current weight.
  const refKg = (p.goal === 'lose_fat' || p.goal === 'build_muscle') && p.goalWeightKg ? p.goalWeightKg : p.weightKg
  const protein = round(Math.min(250, Math.max(1.2 * p.weightKg, Math.min(2.2 * p.weightKg, 1.7637 * refKg))), 5)
  let fat = Math.round((0.27 * kcal) / 9)
  let carbs = Math.round((kcal - 4 * protein - 9 * fat) / 4)
  if (carbs < 50) {
    fat = Math.round((0.2 * kcal) / 9)
    carbs = Math.max(50, Math.round((kcal - 4 * protein - 9 * fat) / 4))
  }
  const fiber = Math.round((14 * kcal) / 1000)
  // Water: ½ oz per lb of body weight, plus 12 oz per 30 minutes of exercise.
  const waterMl = Math.min(4500, Math.max(1500, round(p.weightKg * 2.20462 * 0.5 * 29.5735 + ((opts.workoutMinutes ?? 0) / 30) * 355, 50)))
  return { kcal, protein, carbs, fat, fiber, waterMl, bmr: Math.round(b), tdee: Math.round(tdee), adjustment: Math.round(kcal - tdee) }
}

/** Estimated weekly weight change from the calorie adjustment (≈7,700 kcal per kg). */
export function weeklyChangeKg(t: Targets): number {
  return (t.adjustment * 7) / 7700
}
