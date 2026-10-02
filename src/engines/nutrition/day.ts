import { FOOD_BY_ID } from '@/data/foods'
import type { DietStyle, TrackingMode } from '@/domain/types'
import { defaultServing, foodFitsDiet, foodMacros, type Macros } from './foods'
import type { Targets } from './targets'

export interface ScorePart {
  label: string
  points: number
  max: number
}

export interface DayScore {
  score: number
  parts: ScorePart[]
}

/** 0–100 daily nutrition score. Lite mode only looks at protein, produce and water. */
export function dayScore(o: { eaten: Macros; targets: Targets; produce: number; waterMl: number; mode: TrackingMode; logged: boolean }): DayScore {
  const proteinPct = Math.min(1, o.eaten.protein / Math.max(1, o.targets.protein))
  const produce = Math.min(1, o.produce / 5)
  const water = Math.min(1, o.waterMl / Math.max(1, o.targets.waterMl))
  let parts: ScorePart[]
  if (o.mode === 'lite') {
    parts = [
      { label: 'Protein', points: proteinPct * 40, max: 40 },
      { label: 'Fruit & veg', points: produce * 30, max: 30 },
      { label: 'Water', points: water * 30, max: 30 },
    ]
  } else {
    const err = Math.abs(o.eaten.kcal - o.targets.kcal) / Math.max(1, o.targets.kcal)
    const kcalPts = !o.logged ? 0 : err <= 0.1 ? 35 : Math.max(0, 35 * (1 - (err - 0.1) / 0.25))
    parts = [
      { label: 'Calories on target', points: kcalPts, max: 35 },
      { label: 'Protein', points: Math.min(1, proteinPct / 0.9) * 30, max: 30 },
      { label: 'Fruit & veg', points: produce * 15, max: 15 },
      { label: 'Water', points: water * 20, max: 20 },
    ]
  }
  parts = parts.map((p) => ({ ...p, points: Math.round(p.points) }))
  return { score: Math.min(100, parts.reduce((s, p) => s + p.points, 0)), parts }
}

export interface FoodIdea {
  foodId: string
  name: string
  serving: string
  protein: number
  kcal: number
}

const PROTEIN_IDEAS = [
  'greek-yogurt-nonfat',
  'cottage-cheese-lowfat',
  'tuna-canned-light',
  'chicken-breast-cooked',
  'egg-hard-boiled',
  'string-cheese',
  'turkey-deli',
  'salmon-canned',
  'whey-protein',
  'plant-protein',
  'protein-shake-rtd',
  'tofu-firm',
  'edamame',
  'tempeh',
  'lentils-cooked',
  'beef-jerky',
  'kefir',
]

/** High-protein options that fit the diet and the calories left, best protein-per-calorie first. */
export function proteinIdeas(diet: DietStyle, kcalLeft: number, limit = 3): FoodIdea[] {
  return PROTEIN_IDEAS.map((id) => FOOD_BY_ID.get(id))
    .filter((f) => !!f && foodFitsDiet(f, diet))
    .map((f) => {
      const s = defaultServing(f!)
      const m = foodMacros(f!, s.amount)
      return { foodId: f!.id, name: f!.name, serving: s.label, protein: Math.round(m.protein), kcal: Math.round(m.kcal) }
    })
    .filter((x) => x.protein >= 8 && (kcalLeft <= 0 || x.kcal <= Math.max(150, kcalLeft)))
    .sort((a, b) => b.protein / b.kcal - a.protein / a.kcal)
    .slice(0, limit)
}

export interface Nudge {
  id: string
  kind: 'protein' | 'water' | 'calories' | 'produce' | 'good'
  text: string
  ideas?: FoodIdea[]
}

/** Expected share of the day's water by this hour (8 am → 9 pm). */
export function waterPace(hour: number): number {
  return Math.min(1, Math.max(0, (hour - 8) / 13))
}

export function nudges(o: {
  eaten: Macros
  targets: Targets
  waterMl: number
  produce: number
  hour: number
  diet: DietStyle
  mode: TrackingMode
  logged: boolean
  units: 'imperial' | 'metric'
}): Nudge[] {
  const out: Nudge[] = []
  const proteinLeft = Math.round(o.targets.protein - o.eaten.protein)
  const kcalLeft = Math.round(o.targets.kcal - o.eaten.kcal)
  if (o.logged && proteinLeft >= 20 && o.hour >= 11) {
    out.push({
      id: 'protein',
      kind: 'protein',
      text: `${proteinLeft} g protein to go today. Easy wins:`,
      ideas: proteinIdeas(o.diet, o.mode === 'lite' ? 0 : kcalLeft),
    })
  }
  const behindMl = o.targets.waterMl * waterPace(o.hour) - o.waterMl
  if (behindMl >= 400) {
    const amount = o.units === 'imperial' ? `${Math.round(behindMl / 29.5735 / 8) * 8} oz` : `${Math.round(behindMl / 50) * 50} ml`
    out.push({ id: 'water', kind: 'water', text: `You're about ${amount} behind on water — grab a glass now.` })
  }
  if (o.mode === 'full' && o.logged && kcalLeft < -0.1 * o.targets.kcal) {
    out.push({ id: 'over', kind: 'calories', text: `About ${-kcalLeft} kcal over today. No stress — one day doesn't decide anything. A 20-minute walk helps, and tomorrow is a fresh start.` })
  } else if (o.mode === 'full' && o.logged && o.hour >= 19 && kcalLeft > 0.4 * o.targets.kcal) {
    out.push({ id: 'under', kind: 'calories', text: `You still have ${kcalLeft} kcal left. Eating too little stalls progress — have a balanced dinner or a protein snack.` })
  }
  if (o.hour >= 15 && o.produce < 3) {
    out.push({ id: 'produce', kind: 'produce', text: `${o.produce} fruit & veg servings so far. Add a salad, an apple or baby carrots to reach 5.` })
  }
  if (!out.length && o.logged) out.push({ id: 'good', kind: 'good', text: 'Nicely balanced so far — keep it up!' })
  return out
}
