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

/** Records the URLs the page opens in new windows (the Claude hand-off) instead of opening them. */
export async function recordOpens(page: Page): Promise<() => Promise<string[]>> {
  await page.addInitScript(() => {
    const w = window as unknown as { __opened: string[] }
    w.__opened = []
    window.open = (url?: string | URL) => {
      w.__opened.push(String(url))
      return null
    }
  })
  return () => page.evaluate(() => (window as unknown as { __opened: string[] }).__opened)
}
