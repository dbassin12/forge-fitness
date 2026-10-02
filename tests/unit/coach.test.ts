import { beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '@/db/db'
import type { Profile } from '@/domain/types'
import { DEFAULT_EQUIPMENT } from '@/domain/types'
import { planInputsFromProfile } from '@/engines/plan'
import { initialProgress } from '@/engines/progression/progress'
import { loadCoachContext } from '@/features/coach/context'
import { claudeUrl, coachPrompt, mealPrompt, MEAL_JSON_SHAPE, parseEstimate, sendToClaude } from '@/features/claude/handoff'
import { entryFromEstimate, pendingClaudeMeal } from '@/features/eat/ClaudeMealSheet'
import { wipeAll } from '@/state/backup'

const profile: Profile = {
  name: 'David',
  sex: 'male',
  birthYear: 1990,
  heightCm: 178,
  weightKg: 85,
  goalWeightKg: 80,
  goal: 'lose_fat',
  experience: 'beginner',
  lifestyle: 'light',
  units: 'imperial',
  aches: ['knees'],
  diet: 'kosher',
  avoidFoods: ['peanut'],
  daysPerWeek: 3,
  trainingDays: [1, 3, 5],
  sessionMinutes: 15,
  preferredTime: '07:00',
  equipment: DEFAULT_EQUIPMENT,
  trackingMode: 'full',
  reminderStyle: 'gentle',
  createdAt: '2026-09-01T00:00:00Z',
}

describe('coach context', () => {
  beforeEach(async () => {
    await wipeAll()
  })

  it('summarises profile, plan, today and the last week in plain text', async () => {
    const progress = initialProgress(planInputsFromProfile(profile))
    await db.foodLogs.add({ id: 'f1', date: '2026-10-02', meal: 'breakfast', name: 'Scrambled eggs', source: 'ai', servings: 1, servingLabel: '2 large eggs', kcal: 182, protein: 12.6, carbs: 1, fat: 14, createdAt: 1 })
    await db.foodLogs.add({ id: 'f0', date: '2026-09-30', meal: 'lunch', name: 'Tuna wrap', source: 'db', servings: 1, servingLabel: '1 wrap', kcal: 450, protein: 35, carbs: 40, fat: 12, createdAt: 1 })
    await db.water.add({ id: 'w1', date: '2026-10-02', oz: 16, at: 1 })
    await db.weights.put({ date: '2026-09-28', kg: 85.5, at: 1 })
    await db.workouts.add({ id: 'k1', date: '2026-09-30', startedAt: 0, finishedAt: 15 * 60000, sessionKey: 'w1-full-a', title: 'Full Body A', kind: 'plan', exercises: [], feedback: 'right', calories: 90, xp: 50 })
    const text = await loadCoachContext(profile, progress, new Date(2026, 9, 2, 18, 30))
    expect(text).toContain('Friday, October 2, 2026, 6:30 pm')
    expect(text).toContain('Goal: lose fat')
    expect(text).toContain('goal weight 176.4 lb')
    expect(text).toContain('Aches: knees')
    expect(text).toContain('kosher-style')
    expect(text).toContain('avoids peanut')
    expect(text).toMatch(/dumbbells 2 × 20 lb/)
    expect(text).toContain('Current levels: Push-ups:')
    expect(text).toMatch(/Next planned session \((Mon|Wed|Fri) 2026-10-0\d|today\)/)
    expect(text).toMatch(/Today so far: 182 of [\d,]+ kcal; protein 13 of \d+ g/)
    expect(text).toContain('water 16 of')
    expect(text).toContain('breakfast: Scrambled eggs (182 kcal, 13 g protein)')
    expect(text).toContain('Wed Full Body A (15 min, just right)')
    expect(text).toContain('Food logged on 1 of the last 7 days')
    expect(text).toContain('188.5 lb on 2026-09-28')
    expect(text.length).toBeLessThan(7800)
  })

  it('switches to the lite summary in Lite mode', async () => {
    const lite = { ...profile, trackingMode: 'lite' as const }
    const text = await loadCoachContext(lite, initialProgress(planInputsFromProfile(lite)), new Date(2026, 9, 2, 9, 0))
    expect(text).toContain('Lite mode')
    expect(text).not.toMatch(/Today so far: \d+ of/)
    expect(text).toContain('No food logged in the last 7 days.')
  })
})

describe('Claude hand-off', () => {
  it('builds a coach prompt with the guide, the Forge data and the question', () => {
    const p = coachPrompt('Goal: lose fat.\nProtein left today: 60 g.', '  What should I eat tonight?  ')
    expect(p).toContain("You're my fitness and nutrition coach")
    expect(p).toContain('<forge_data>\nGoal: lose fat.\nProtein left today: 60 g.\n</forge_data>')
    expect(p.trimEnd().endsWith('My question: What should I eat tonight?')).toBe(true)
  })

  it('asks for meal estimates in a format Forge can read back', () => {
    const photo = mealPrompt('', true)
    expect(photo).toContain("I've attached a photo of it.")
    expect(photo).not.toContain('What I ate:')
    expect(photo).toContain(MEAL_JSON_SHAPE)
    const text = mealPrompt('2 eggs and toast', false)
    expect(text).toContain('What I ate: 2 eggs and toast')
    expect(text).not.toContain('attached a photo')
    // The shape in the prompt must itself parse.
    expect(parseEstimate(MEAL_JSON_SHAPE).ok).toBe(false)
    expect(parseEstimate(MEAL_JSON_SHAPE.replace('"name":""', '"name":"Egg"')).ok).toBe(true)
  })

  it('reads the estimate from a whole pasted reply', () => {
    const reply = [
      'Assumed 1 tsp butter on the toast.',
      '```json',
      '{"items":[{"name":"Scrambled eggs","portion":"2 large eggs","grams":100,"kcal":182,"protein":12.6,"carbs":1.2,"fat":13.9,"fiber":0,"veg":0,"confidence":"high"},',
      '{"name":"Toast with butter","portion":"1 slice","grams":40,"kcal":"115 kcal","protein":"4 g","carbs":15,"fat":4.6,"fiber":2,"veg":0,"confidence":"Medium"}],"notes":""}',
      '```',
    ].join('\n')
    const r = parseEstimate(reply)
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.estimate.notes).toBe('Assumed 1 tsp butter on the toast.')
    expect(r.estimate.items.map((i) => [i.name, i.kcal, i.protein, i.confidence])).toEqual([
      ['Scrambled eggs', 182, 12.6, 'high'],
      ['Toast with butter', 115, 4, 'medium'],
    ])
  })

  it('tolerates curly quotes, trailing commas, other field names and a bare array', () => {
    const r = parseEstimate('[{“name”: “Apple”, “calories”: 95, “carbohydrates”: 25, “produce_servings”: 2,}]')
    expect(r.ok && r.estimate.items[0]).toMatchObject({ name: 'Apple', kcal: 95, carbs: 25, produceServings: 2, confidence: 'medium' })
  })

  it('clamps wild numbers and explains what went wrong', () => {
    const r = parseEstimate('{"items":[{"name":"Mystery","kcal":99999,"protein":-5,"grams":"lots"}]}')
    expect(r.ok && r.estimate.items[0]).toMatchObject({ kcal: 5000, protein: 0, grams: 0 })
    const none = parseEstimate('Sorry, I can’t see any food in this photo.')
    expect(none.ok).toBe(false)
    if (!none.ok) expect(none.error).toMatch(/Couldn’t find the estimate/)
    const empty = parseEstimate('{"items":[]}')
    expect(!empty.ok && empty.error).toMatch(/didn’t list any foods/)
  })

  it('copies the prompt and opens Claude inside the same tap', async () => {
    const writes: string[] = []
    const opened: string[] = []
    vi.stubGlobal('navigator', { clipboard: { writeText: async (t: string) => void writes.push(t) } })
    vi.stubGlobal('window', { open: (u: string) => void opened.push(u) })
    const copied = sendToClaude('Hi Claude & co', { prefill: true })
    // Opened synchronously, before any await.
    expect(opened).toEqual([claudeUrl('Hi Claude & co')])
    expect(opened[0]).toBe('https://claude.ai/new?q=Hi%20Claude%20%26%20co')
    expect(await copied).toBe(true)
    expect(writes).toEqual(['Hi Claude & co'])
    sendToClaude('photo prompt', { prefill: false })
    expect(opened[1]).toBe('https://claude.ai/new')
    vi.stubGlobal('navigator', { clipboard: { writeText: async () => Promise.reject(new Error('denied')) } })
    expect(await sendToClaude('x', { prefill: false })).toBe(false)
    vi.unstubAllGlobals()
  })

  it('remembers a pending estimate for a while after opening Claude', () => {
    const store = new Map<string, string>()
    vi.stubGlobal('localStorage', { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v), removeItem: (k: string) => void store.delete(k) })
    expect(pendingClaudeMeal()).toBeNull()
    store.set('forge.claudeMeal', JSON.stringify({ meal: 'dinner', date: '2026-10-02', at: 1_000_000 }))
    expect(pendingClaudeMeal(1_000_000 + 10 * 60_000)).toEqual({ meal: 'dinner', date: '2026-10-02' })
    expect(pendingClaudeMeal(1_000_000 + 60 * 60_000)).toBeNull()
    vi.unstubAllGlobals()
  })
})

describe('Claude meal estimates', () => {
  it('scales an estimate into a diary entry', () => {
    const item = { name: 'Rice', portion: '1 cup', grams: 158, kcal: 205, protein: 4.3, carbs: 44.5, fat: 0.4, fiber: 0.6, produceServings: 0, confidence: 'medium' as const }
    expect(entryFromEstimate(item, ' Jasmine rice ', 1.5)).toEqual({
      name: 'Jasmine rice',
      source: 'ai',
      servings: 1.5,
      servingLabel: '1 cup',
      kcal: 308,
      protein: 6.5,
      carbs: 66.8,
      fat: 0.6,
      fiber: 0.9,
      veg: undefined,
      produceServings: undefined,
    })
    const salad = entryFromEstimate({ ...item, name: 'Side salad', produceServings: 1 }, '', 2)
    expect(salad).toMatchObject({ name: 'Side salad', veg: true, produceServings: 2 })
  })
})
