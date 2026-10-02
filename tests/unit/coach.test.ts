import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { db } from '@/db/db'
import type { Profile } from '@/domain/types'
import { DEFAULT_EQUIPMENT } from '@/domain/types'
import { planInputsFromProfile } from '@/engines/plan'
import { initialProgress } from '@/engines/progression/progress'
import { loadCoachContext } from '@/features/coach/context'
import { plainText, RichText } from '@/features/coach/RichText'
import { entryFromEstimate } from '@/features/eat/AiFoodSheet'
import { askCoach } from '@/state/ai'
import { wipeAll } from '@/state/backup'
import { setPasscode } from '@/state/reminders'

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

describe('coach replies', () => {
  it('renders lists and bold as safe markup', () => {
    const html = renderToStaticMarkup(createElement(RichText, { text: 'Try this:\n- **3 × 10** squats\n- 30 s plank\n\n<b>hi</b> 1. not a list' }))
    expect(html).toContain('<ul class="list-disc space-y-1 pl-5"><li><strong class="font-semibold">3 × 10</strong> squats</li><li>30 s plank</li></ul>')
    expect(html).toContain('&lt;b&gt;hi&lt;/b&gt;')
    expect(renderToStaticMarkup(createElement(RichText, { text: '1. One\n2. Two' }))).toContain('<ol')
    expect(plainText('- **Bold** move\n- next')).toBe('Bold move\nnext')
  })

  it('streams NDJSON events from the server', async () => {
    await setPasscode('letmein123')
    const lines = ['{"type":"text","text":"Do 3 rounds"}\n{"type":"te', 'xt","text":" of squats."}\n', '{"type":"done","model":"m"}\n']
    const fetchMock = vi.fn(async (_url: string, init: RequestInit) => {
      expect((init.headers as Record<string, string>)['x-forge-passcode']).toBe('letmein123')
      const body = new ReadableStream({
        start(c) {
          for (const l of lines) c.enqueue(new TextEncoder().encode(l))
          c.close()
        },
      })
      return new Response(body, { headers: { 'content-type': 'application/x-ndjson' } })
    })
    vi.stubGlobal('fetch', fetchMock)
    let text = ''
    const r = await askCoach([{ role: 'user', text: 'Hi' }], 'ctx', (p) => (text += p), new AbortController().signal)
    expect(r).toEqual({ ok: true, truncated: undefined })
    expect(text).toBe('Do 3 rounds of squats.')
    expect(JSON.parse(fetchMock.mock.calls[0]![1].body as string)).toEqual({ messages: [{ role: 'user', text: 'Hi' }], context: 'ctx' })
    vi.unstubAllGlobals()
  })

  it('reports refusals and server errors', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{"type":"text","text":"Hm"}\n{"type":"refusal"}\n', { headers: { 'content-type': 'application/x-ndjson' } })))
    expect(await askCoach([{ role: 'user', text: 'x' }], '', () => undefined, new AbortController().signal)).toMatchObject({ ok: false, refused: true })
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ error: 'Wrong access code.' }, { status: 401 })))
    expect(await askCoach([{ role: 'user', text: 'x' }], '', () => undefined, new AbortController().signal)).toEqual({ ok: false, error: 'Wrong access code.' })
    vi.unstubAllGlobals()
  })
})

describe('AI food estimates', () => {
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
