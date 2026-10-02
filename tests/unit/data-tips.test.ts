import { describe, expect, it } from 'vitest'
import { TIPS } from '@/data/tips'

describe('tips', () => {
  it('has a broad, unique set', () => {
    expect(TIPS.length).toBeGreaterThanOrEqual(150)
    const ids = new Set(TIPS.map((t) => t.id))
    expect(ids.size).toBe(TIPS.length)
    const cats = new Map<string, number>()
    for (const t of TIPS) cats.set(t.category, (cats.get(t.category) ?? 0) + 1)
    for (const c of ['training', 'form', 'nutrition', 'hydration', 'sleep', 'recovery', 'mindset', 'habits', 'time', 'safety']) {
      expect(cats.get(c) ?? 0, `category ${c}`).toBeGreaterThanOrEqual(6)
    }
  })
  for (const t of TIPS) {
    it(`${t.id} reads well`, () => {
      expect(t.text.length).toBeGreaterThanOrEqual(30)
      expect(t.text.length).toBeLessThanOrEqual(220)
      expect(t.contexts.length).toBeGreaterThan(0)
      if (t.title) expect(t.title.split(/\s+/).length).toBeLessThanOrEqual(6)
    })
  }
})
