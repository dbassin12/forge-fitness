import { describe, expect, it } from 'vitest'
import { FOODS } from '@/data/foods'
import type { FoodCategory } from '@/data/foods/types'

const MIN_PER_CATEGORY: Record<FoodCategory, number> = {
  protein: 25, dairy: 15, eggs: 3, grains: 14, bread: 8, fruit: 25, vegetables: 35, legumes: 10,
  'nuts-seeds': 10, 'fats-oils': 6, snacks: 12, beverages: 10, prepared: 20, condiments: 10, sweets: 8,
}

describe('food database', () => {
  it('is large enough and covers every category', () => {
    expect(FOODS.length).toBeGreaterThanOrEqual(230)
    for (const [cat, min] of Object.entries(MIN_PER_CATEGORY)) {
      expect(FOODS.filter((f) => f.category === cat).length, `category ${cat}`).toBeGreaterThanOrEqual(min)
    }
  })
  it('has unique kebab-case ids and names', () => {
    const ids = new Set<string>()
    const names = new Set<string>()
    for (const f of FOODS) {
      expect(f.id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
      expect(ids.has(f.id), `dup id ${f.id}`).toBe(false)
      expect(names.has(f.name.toLowerCase()), `dup name ${f.name}`).toBe(false)
      ids.add(f.id)
      names.add(f.name.toLowerCase())
    }
  })
  for (const f of FOODS) {
    it(`${f.id} has consistent nutrition`, () => {
      const n = f.per100
      for (const v of [n.kcal, n.protein, n.carbs, n.fat, n.fiber]) expect(v).toBeGreaterThanOrEqual(0)
      expect(n.protein + n.carbs + n.fat).toBeLessThanOrEqual(100.5)
      expect(n.fiber).toBeLessThanOrEqual(n.carbs + 0.5)
      const est = 4 * n.protein + 4 * n.carbs + 9 * n.fat + 7 * (n.alcohol ?? 0)
      const tol = Math.max(30, n.kcal * 0.2)
      expect(Math.abs(est - n.kcal), `energy ${n.kcal} vs Atwater ${est.toFixed(0)}`).toBeLessThanOrEqual(tol)
      expect(f.servings.length).toBeGreaterThan(0)
      expect(f.defaultServing).toBeGreaterThanOrEqual(0)
      expect(f.defaultServing).toBeLessThan(f.servings.length)
      for (const s of f.servings) expect(s.amount).toBeGreaterThan(0)
      if (f.vegan) expect(f.vegetarian).toBe(true)
      if (f.kosher === 'meat' || f.kosher === 'fish') expect(f.vegetarian).toBe(false)
      if (f.category === 'dairy' && f.kosher === 'dairy') expect(f.allergens).toContain('milk')
      if (f.kosher === 'dairy') expect(f.vegan).toBe(false)
    })
  }
})
