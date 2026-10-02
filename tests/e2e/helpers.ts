import { expect, type Page } from '@playwright/test'

/** Fresh install → onboarding with sensible answers → lands on the Train tab. */
export async function onboard(page: Page): Promise<void> {
  await page.goto('/#/')
  await page.waitForURL(/welcome/)
  await page.getByRole('button', { name: "Let's build your plan" }).click()
  await page.getByRole('button', { name: /Build muscle/ }).click()
  for (let i = 0; i < 5; i++) await page.getByRole('button', { name: 'Continue' }).click()
  await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: 'Continue' }).click()
  await page.getByRole('button', { name: 'Kosher-style' }).click()
  await page.getByRole('button', { name: 'Continue' }).click()
  await page.getByRole('button', { name: /Skip — use my experience level/ }).click()
  await page.getByRole('button', { name: 'Start my plan' }).click()
  await page.waitForURL(/train/)
}

/** Collects console errors and uncaught exceptions so every test can assert a clean run. */
export function trackErrors(page: Page): string[] {
  const errors: string[] = []
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text())
  })
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
  return errors
}

export async function expectNoErrors(errors: string[]): Promise<void> {
  expect(errors, errors.join('\n')).toEqual([])
}

/** Stand-ins for the optional AI endpoints (the real ones need an Anthropic key). */
export async function mockAi(page: Page): Promise<{ coachRequests: unknown[] }> {
  const coachRequests: unknown[] = []
  await page.route('**/api/ai/config', (r) => r.fulfill({ json: { ok: true, configured: { apiKey: true, passcode: true } } }))
  await page.route('**/api/ai/coach', async (r) => {
    coachRequests.push(r.request().postDataJSON())
    const pieces = ['Try **glute bridges** ', '3 × 15 instead.\n', '- Slow on the way down']
    const body = pieces.map((t) => `${JSON.stringify({ type: 'text', text: t })}\n`).join('') + `${JSON.stringify({ type: 'done', model: 'test' })}\n`
    await r.fulfill({ status: 200, headers: { 'content-type': 'application/x-ndjson' }, body })
  })
  await page.route('**/api/ai/food-*', (r) =>
    r.fulfill({
      json: {
        ok: true,
        model: 'test',
        estimate: {
          isFood: true,
          notes: 'Assumed 1 tsp butter.',
          items: [
            { name: 'Scrambled eggs', portion: '2 large eggs', grams: 100, kcal: 182, protein: 12.6, carbs: 1.2, fat: 13.9, fiber: 0, produceServings: 0, confidence: 'high' },
            { name: 'Toast with butter', portion: '1 slice', grams: 40, kcal: 115, protein: 4, carbs: 15, fat: 4.6, fiber: 2, produceServings: 0, confidence: 'medium' },
          ],
        },
      },
    }),
  )
  return { coachRequests }
}
