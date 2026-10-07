import type { ISODate } from '@/domain/types'
import { addDays } from '@/lib/dates'

export const MINUTE_STEPS = [5, 10, 15, 20, 30, 45, 60]
/** Bloom's practices top out at 45 minutes. */
const YOGA_MINUTE_STEPS = [5, 10, 15, 20, 30, 45]

export interface ReviewInput {
  weekOf: ISODate
  workouts: { date: ISODate; kind: string; minutes: number }[]
  daysPerWeek: number
  sessionMinutes: number
  /** Totals for days that have any food logged. */
  food: { date: ISODate; kcal: number; protein: number }[]
  kcalTarget: number
  proteinTarget: number
  weights: { date: ISODate; kg: number }[]
  /** Completion ratio (done / planned) of the previous week. */
  lastWeekCompletion?: number
  /** Bloom: talk about practices, and keep suggestions within 45 minutes. */
  yoga?: boolean
}

export interface PlanChange {
  label: string
  daysPerWeek?: number
  sessionMinutes?: number
}

export interface Review {
  weekOf: ISODate
  workouts: number
  target: number
  minutes: number
  completion: number
  loggedDays: number
  avgKcal?: number
  avgProtein?: number
  proteinDays: number
  weightDeltaKg?: number
  headline: string
  suggestion?: { text: string; options: PlanChange[] }
}

const inWeek = (weekOf: ISODate, d: ISODate) => d >= weekOf && d <= addDays(weekOf, 6)

export function weekReview(i: ReviewInput): Review {
  const plan = i.workouts.filter((w) => w.kind === 'plan' && inWeek(i.weekOf, w.date))
  const all = i.workouts.filter((w) => inWeek(i.weekOf, w.date))
  const food = i.food.filter((f) => inWeek(i.weekOf, f.date))
  const weights = i.weights.filter((w) => inWeek(i.weekOf, w.date)).sort((a, b) => a.date.localeCompare(b.date))
  const completion = plan.length / Math.max(1, i.daysPerWeek)
  const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : undefined)
  const r: Review = {
    weekOf: i.weekOf,
    workouts: plan.length,
    target: i.daysPerWeek,
    minutes: Math.round(all.reduce((s, w) => s + w.minutes, 0)),
    completion,
    loggedDays: food.length,
    avgKcal: avg(food.map((f) => f.kcal)),
    avgProtein: avg(food.map((f) => f.protein)),
    proteinDays: food.filter((f) => f.protein >= i.proteinTarget * 0.95).length,
    weightDeltaKg: weights.length >= 2 ? weights[weights.length - 1].kg - weights[0].kg : undefined,
    headline: i.yoga
      ? completion >= 1
        ? 'Every practice done. What a lovely week!'
        : completion >= 0.66
          ? 'A steady week. Keep the rhythm going.'
          : completion > 0
            ? 'Some lovely moments in a busy week.'
            : 'A quiet week. Next week is a fresh start.'
      : completion >= 1
        ? 'Every workout done — outstanding week!'
        : completion >= 0.66
          ? 'Solid week. Keep the rhythm going.'
          : completion > 0
            ? 'Some good work in a busy week.'
            : 'A quiet week. Next week is a fresh start.',
  }
  const steps = i.yoga ? YOGA_MINUTE_STEPS : MINUTE_STEPS
  const unit = i.yoga ? 'practices' : 'workouts'
  const minIdx = steps.indexOf(i.sessionMinutes)
  if (completion >= 1 && (i.lastWeekCompletion ?? 0) >= 1) {
    const options: PlanChange[] = []
    if (i.daysPerWeek < 6) options.push({ label: `${i.yoga ? 'Practice' : 'Train'} ${i.daysPerWeek + 1} days a week`, daysPerWeek: i.daysPerWeek + 1 })
    if (minIdx >= 0 && minIdx < steps.length - 1) options.push({ label: `${steps[minIdx + 1]}-minute ${unit}`, sessionMinutes: steps[minIdx + 1] })
    if (options.length) r.suggestion = { text: "Two perfect weeks in a row. Ready for a little more? (Totally optional — consistency is what's working.)", options }
  } else if (completion < 0.5 && (i.lastWeekCompletion ?? 1) < 0.5) {
    const options: PlanChange[] = []
    if (i.daysPerWeek > 2) options.push({ label: `${i.daysPerWeek - 1} days a week`, daysPerWeek: i.daysPerWeek - 1 })
    if (minIdx > 1) options.push({ label: `${steps[minIdx - 1]}-minute ${unit}`, sessionMinutes: steps[minIdx - 1] })
    if (options.length) r.suggestion = { text: 'Life got busy two weeks running. A smaller plan you actually do beats a big one you skip — want to adjust?', options }
  }
  return r
}
