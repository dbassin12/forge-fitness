import { describe, expect, it } from 'vitest'
import { FOOD_BY_ID, FOODS } from '@/data/foods'
import { RECIPES } from '@/data/recipes'
import type { DietStyle, Profile } from '@/domain/types'
import { DEFAULT_EQUIPMENT } from '@/domain/types'
import { groceryList, groceryText } from '@/engines/meals/grocery'
import { MEALS, mealAlternatives, planWeek, recipeById, swapMeal } from '@/engines/meals/planner'
import { dayScore, nudges, proteinIdeas } from '@/engines/nutrition/day'
import { foodFitsDiet, recipeFits, recipeKosher, recipeMacros, searchFoods } from '@/engines/nutrition/foods'
import { bmr, calorieTarget, dailyTargets, CALORIE_FLOOR } from '@/engines/nutrition/targets'

const profile: Profile = {
  name: 'Test',
  sex: 'male',
  birthYear: 1990,
  heightCm: 178,
  weightKg: 85,
  goal: 'lose_fat',
  experience: 'beginner',
  lifestyle: 'light',
  units: 'imperial',
  aches: [],
  diet: 'kosher',
  avoidFoods: [],
  daysPerWeek: 3,
  trainingDays: [1, 3, 5],
  sessionMinutes: 15,
  preferredTime: '07:00',
  equipment: DEFAULT_EQUIPMENT,
  trackingMode: 'full',
  reminderStyle: 'gentle',
  createdAt: '2026-10-01T00:00:00Z',
}

describe('targets', () => {
  it('uses Mifflin–St Jeor', () => {
    expect(Math.round(bmr({ sex: 'male', weightKg: 80, heightCm: 180, age: 30 }))).toBe(1780)
    expect(Math.round(bmr({ sex: 'female', weightKg: 60, heightCm: 165, age: 30 }))).toBe(1320)
  })

  it('sets a sensible deficit with safety floors', () => {
    const t = dailyTargets(profile, { today: new Date(2026, 9, 2) })
    expect(t.kcal).toBeLessThan(t.tdee)
    expect(t.tdee - t.kcal).toBeLessThanOrEqual(750)
    expect(calorieTarget(1500, 'lose_fat', 'female')).toBe(CALORIE_FLOOR.female)
    expect(t.protein).toBeGreaterThanOrEqual(1.2 * profile.weightKg)
    expect(t.protein).toBeLessThanOrEqual(2.2 * profile.weightKg)
    expect(Math.abs(t.protein * 4 + t.carbs * 4 + t.fat * 9 - t.kcal)).toBeLessThan(40)
    expect(t.waterMl).toBeGreaterThan(2000)
    const bulk = dailyTargets({ ...profile, goal: 'build_muscle' })
    expect(bulk.kcal).toBeGreaterThan(bulk.tdee)
  })

  it('adds water on workout days', () => {
    expect(dailyTargets(profile, { workoutMinutes: 30 }).waterMl).toBeGreaterThan(dailyTargets(profile).waterMl)
  })
})

describe('food search and diet rules', () => {
  it('finds common foods quickly', () => {
    expect(searchFoods('egg')[0].id).toMatch(/egg/)
    expect(searchFoods('greek yogurt')[0].id).toMatch(/greek-yogurt/)
    expect(searchFoods('chicken breast').slice(0, 3).map((f) => f.id)).toContain('chicken-breast-cooked')
    expect(searchFoods('')).toEqual([])
  })

  it('hides pork and shellfish for kosher-style eaters', () => {
    expect(searchFoods('bacon', { diet: 'kosher' }).some((f) => f.id === 'bacon')).toBe(false)
    expect(searchFoods('bacon').some((f) => f.id === 'bacon')).toBe(true)
  })

  it('classifies recipes for kosher-style planning', () => {
    for (const r of RECIPES) {
      const k = recipeKosher(r)
      expect(k).not.toBe('nonkosher')
      expect(recipeFits(r, 'kosher')).toBe(true)
    }
    const vegan = RECIPES.filter((r) => recipeFits(r, 'vegan'))
    for (const r of vegan) for (const i of r.ingredients) expect(FOOD_BY_ID.get(i.foodId)!.vegan).toBe(true)
  })

  it('respects foods to avoid', () => {
    const withPeanut = RECIPES.filter((r) => r.ingredients.some((i) => i.foodId.includes('peanut')))
    for (const r of withPeanut) expect(recipeFits(r, 'none', ['peanut'])).toBe(false)
  })

  it('suggests protein ideas that fit the diet', () => {
    const ideas = proteinIdeas('vegan', 600)
    expect(ideas.length).toBeGreaterThan(0)
    for (const i of ideas) expect(foodFitsDiet(FOOD_BY_ID.get(i.foodId)!, 'vegan')).toBe(true)
  })
})

describe('meal planner', () => {
  const DIETS: DietStyle[] = ['none', 'kosher', 'vegetarian', 'pescatarian', 'vegan']

  it('hits calories within ±5% on average (±10% every day) for every diet', () => {
    for (const diet of DIETS) {
      for (const kcal of [1400, 1800, 2200, 2600, 3000]) {
        const protein = Math.round(kcal / 16)
        const plan = planWeek({ weekOf: '2026-10-05', kcal, protein, diet })
        expect(plan.days).toHaveLength(7)
        const errs = plan.days.map((d) => Math.abs(d.totals.kcal - kcal) / kcal)
        expect(errs.reduce((a, b) => a + b, 0) / errs.length, `${diet} ${kcal}`).toBeLessThanOrEqual(0.05)
        for (const e of errs) expect(e, `${diet} ${kcal}`).toBeLessThanOrEqual(0.1)
        for (const d of plan.days) {
          expect(d.meals.map((m) => m.meal)).toEqual(MEALS)
          for (const m of d.meals) expect(recipeFits(recipeById(m.recipeId)!, diet)).toBe(true)
        }
      }
    }
  })

  it('reaches most of the protein target for omnivores', () => {
    const plan = planWeek({ weekOf: '2026-10-05', kcal: 2200, protein: 150, diet: 'kosher' })
    const avg = plan.days.reduce((s, d) => s + d.totals.protein, 0) / 7
    expect(avg).toBeGreaterThanOrEqual(150 * 0.85)
  })

  it('never puts a dairy snack after a meat lunch (kosher-style)', () => {
    for (let seed = 0; seed < 8; seed++) {
      const plan = planWeek({ weekOf: '2026-10-05', kcal: 2400, protein: 160, diet: 'kosher', seed })
      for (const d of plan.days) {
        const lunch = recipeById(d.meals.find((m) => m.meal === 'lunch')!.recipeId)!
        const snack = recipeById(d.meals.find((m) => m.meal === 'snack')!.recipeId)!
        if (recipeKosher(lunch) === 'meat') expect(recipeKosher(snack)).not.toBe('dairy')
      }
    }
  })

  it('varies meals across the week', () => {
    const plan = planWeek({ weekOf: '2026-10-05', kcal: 2000, protein: 130, diet: 'none' })
    for (const meal of MEALS) {
      const ids = plan.days.map((d) => d.meals.find((m) => m.meal === meal)!.recipeId)
      expect(new Set(ids).size, meal).toBeGreaterThanOrEqual(3)
    }
  })

  it('swaps a meal and offers alternatives', () => {
    const plan = planWeek({ weekOf: '2026-10-05', kcal: 2000, protein: 130, diet: 'kosher' })
    const alts = mealAlternatives(plan, '2026-10-06', 'dinner')
    expect(alts.length).toBeGreaterThan(0)
    const next = swapMeal(plan, '2026-10-06', 'dinner', alts[0].id)
    expect(next.days[1].meals.find((m) => m.meal === 'dinner')!.recipeId).toBe(alts[0].id)
  })

  it('builds a grocery list grouped by aisle', () => {
    const plan = planWeek({ weekOf: '2026-10-05', kcal: 2000, protein: 130, diet: 'kosher' })
    const list = groceryList(plan)
    expect(list.length).toBeGreaterThan(3)
    const items = list.flatMap((a) => a.items)
    expect(new Set(items.map((i) => i.foodId)).size).toBe(items.length)
    for (const i of items) expect(i.amount).toBeGreaterThan(0)
    expect(groceryText(list)).toContain('•')
  })

  it('computes per-serving recipe nutrition', () => {
    for (const r of RECIPES) {
      const m = recipeMacros(r)
      expect(m.kcal).toBeGreaterThan(50)
      expect(m.protein).toBeGreaterThan(0)
    }
    expect(FOODS.length).toBeGreaterThan(300)
  })
})

describe('daily score and nudges', () => {
  const t = dailyTargets(profile)
  it('rewards a balanced day', () => {
    const good = dayScore({ eaten: { kcal: t.kcal, protein: t.protein, carbs: t.carbs, fat: t.fat, fiber: t.fiber }, targets: t, produce: 5, waterMl: t.waterMl, mode: 'full', logged: true })
    expect(good.score).toBe(100)
    const empty = dayScore({ eaten: { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }, targets: t, produce: 0, waterMl: 0, mode: 'full', logged: false })
    expect(empty.score).toBe(0)
    const lite = dayScore({ eaten: { kcal: 0, protein: t.protein, carbs: 0, fat: 0, fiber: 0 }, targets: t, produce: 5, waterMl: t.waterMl, mode: 'lite', logged: true })
    expect(lite.score).toBe(100)
  })

  it('nudges toward protein and water when behind', () => {
    const n = nudges({ eaten: { kcal: 900, protein: 40, carbs: 100, fat: 30, fiber: 10 }, targets: t, waterMl: 300, produce: 1, hour: 16, diet: 'kosher', mode: 'full', logged: true, units: 'imperial' })
    const kinds = n.map((x) => x.kind)
    expect(kinds).toContain('protein')
    expect(kinds).toContain('water')
    expect(kinds).toContain('produce')
    expect(n.find((x) => x.kind === 'protein')!.ideas!.length).toBeGreaterThan(0)
  })
})

describe('grocery wording', () => {
  it('pluralizes household units sensibly', async () => {
    const { pluralize, friendlyAmount } = await import('@/engines/meals/grocery')
    expect(pluralize('breast')).toBe('breasts')
    expect(pluralize('medium')).toBe('medium')
    expect(pluralize('large egg')).toBe('large eggs')
    expect(pluralize('berry')).toBe('berries')
    expect(friendlyAmount('egg-large', 175)).toMatch(/^about 3\.5 large eggs/)
  })
})
