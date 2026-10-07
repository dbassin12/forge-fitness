import { expect, test, type Page } from '@playwright/test'
import { dismissCelebrations, expectNoErrors, trackErrors } from './helpers'

/** Fresh install of Bloom → its gentle onboarding → Today. */
async function onboardBloom(page: Page): Promise<void> {
  await page.goto('/bloom/#/')
  await page.waitForURL(/welcome/)
  await page.getByRole('button', { name: 'Let’s begin' }).click()
  await page.getByRole('button', { name: /Feel calmer/ }).click()
  await page.getByRole('button', { name: 'Continue' }).click()
  await page.getByPlaceholder('What should Lila call you?').fill('Michal')
  await page.getByRole('button', { name: 'Continue' }).click()
  await page.getByRole('button', { name: /New to yoga/ }).click()
  await page.getByRole('button', { name: 'Continue' }).click()
  await page.getByRole('button', { name: 'Continue' }).click()
  await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: 'Continue' }).click()
  await page.getByRole('button', { name: 'Continue' }).click()
  await page.getByRole('button', { name: 'Begin my practice' }).click()
  await page.waitForURL(/today/)
}

test('Bloom installs as its own app at /bloom/', async ({ page, request }) => {
  const manifest = (await (await request.get('/bloom/manifest.webmanifest')).json()) as { name: string; start_url: string; scope: string }
  expect(manifest.name).toContain('Bloom')
  expect(manifest.scope).toBe('/bloom/')
  expect(manifest.start_url.startsWith('/bloom/')).toBe(true)
  await page.goto('/bloom/')
  await expect(page).toHaveTitle(/Bloom/)
  const scope = await page.evaluate(async () => (await navigator.serviceWorker.ready).scope)
  expect(scope).toMatch(/\/bloom\/$/)
})

test('Bloom onboarding builds a gentle practice and a mini flow is logged', async ({ page }) => {
  const errors = trackErrors(page)
  await onboardBloom(page)
  await expect(page.getByRole('heading', { name: /Michal/ })).toBeVisible()
  await expect(page.getByRole('button', { name: /Begin practice|Practice anyway/ })).toBeVisible()
  await expect(page.getByText(/kcal/)).toHaveCount(0)

  await page.goto('/bloom/#/workout?snack=3&flow=wake')
  await page.getByRole('button', { name: 'Begin', exact: true }).click()
  const feedback = page.getByRole('heading', { name: 'Practice done!' })
  for (let i = 0; i < 80 && !(await feedback.isVisible()); i++) {
    for (const name of ['Done', 'Skip rest', 'Begin']) {
      const b = page.getByRole('button', { name, exact: true })
      if (await b.isVisible()) {
        await b.click()
        break
      }
    }
  }
  await expect(feedback).toBeVisible()
  await page.getByRole('button', { name: /Just right/ }).click()
  await dismissCelebrations(page)
  await expect(page.getByRole('heading', { name: 'Beautiful practice' })).toBeVisible()
  await expectNoErrors(errors)
})

test('Bloom keeps its data apart from Forge and has a calm Breathe tab', async ({ page }) => {
  const errors = trackErrors(page)
  await onboardBloom(page)
  // Forge on the same phone still starts fresh.
  await page.goto('/#/')
  await page.waitForURL(/welcome/)
  await expect(page.getByRole('button', { name: "Let's build your plan" })).toBeVisible()

  await page.goto('/bloom/#/breathe')
  await expect(page.getByRole('heading', { name: 'Breathe' })).toBeVisible()
  await page.getByRole('link', { name: /Box breathing/ }).click()
  await expect(page.getByText('Box breathing').first()).toBeVisible()
  await expectNoErrors(errors)
})
