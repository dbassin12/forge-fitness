import { describe, expect, it } from 'vitest'
import { FOODS } from '@/data/foods'
import { RECIPES } from '@/data/recipes'

const byId = new Map(FOODS.map((f) => [f.id, f]))

function totals(r: (typeof RECIPES)[number]) {
  let kcal = 0
  let protein = 0
  const kosher = new Set<string>()
  let vegetarian = true
  let vegan = true
  for (const ing of r.ingredients) {
    const f = byId.get(ing.foodId)!
    kcal += (f.per100.kcal * ing.amount) / 100
    protein += (f.per100.protein * ing.amount) / 100
    kosher.add(f.kosher)
    vegetarian &&= f.vegetarian
    vegan &&= f.vegan
  }
  return { kcal: kcal / r.servings, protein: protein / r.servings, kosher, vegetarian, vegan }
}

describe('recipes', () => {
  it('has enough variety for weekly meal plans', () => {
    expect(RECIPES.length).toBeGreaterThanOrEqual(48)
    const count = (m: string) => RECIPES.filter((r) => r.meals.includes(m as never)).length
    expect(count('breakfast')).toBeGreaterThanOrEqual(12)
    expect(count('lunch')).toBeGreaterThanOrEqual(12)
    expect(count('dinner')).toBeGreaterThanOrEqual(12)
    expect(count('snack')).toBeGreaterThanOrEqual(10)
    const t = RECIPES.map(totals)
    expect(t.filter((x) => x.vegetarian).length).toBeGreaterThanOrEqual(16)
    expect(t.filter((x) => x.vegan).length).toBeGreaterThanOrEqual(7)
    expect(t.filter((x) => x.kosher.has('fish')).length).toBeGreaterThanOrEqual(5)
    expect(RECIPES.filter((r) => r.noCook).length).toBeGreaterThanOrEqual(10)
    expect(RECIPES.filter((r) => r.prepMin + r.cookMin <= 20).length / RECIPES.length).toBeGreaterThanOrEqual(0.7)
  })
  for (const r of RECIPES) {
    it(`${r.id} is valid, kosher-style and sensible`, () => {
      expect(r.id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
      for (const ing of r.ingredients) expect(byId.has(ing.foodId), `unknown food ${ing.foodId}`).toBe(true)
      const t = totals(r)
      expect(t.kosher.has('nonkosher'), 'no pork/shellfish').toBe(false)
      expect(t.kosher.has('meat') && t.kosher.has('dairy'), 'never mix meat and dairy').toBe(false)
      expect(t.kosher.has('meat') && t.kosher.has('fish'), 'never mix meat and fish').toBe(false)
      expect(t.kcal).toBeGreaterThanOrEqual(80)
      expect(t.kcal).toBeLessThanOrEqual(950)
      if (!r.meals.every((m) => m === 'snack')) expect(t.protein, 'meals should carry protein').toBeGreaterThanOrEqual(12)
      expect(r.steps.length).toBeGreaterThanOrEqual(1)
      expect(r.servings).toBeGreaterThanOrEqual(1)
      if (r.tags.includes('vegetarian')) expect(t.vegetarian).toBe(true)
      if (r.tags.includes('vegan')) expect(t.vegan).toBe(true)
    })
  }
})
