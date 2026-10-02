import { readFileSync } from 'node:fs'
import { expect, test } from '@playwright/test'
import { expectNoErrors, mockAi, onboard, trackErrors } from './helpers'

test('is an installable app with a manifest and service worker', async ({ page, request }) => {
  const manifest = (await (await request.get('/manifest.webmanifest')).json()) as { name: string; display: string; start_url: string; icons: { sizes: string; purpose?: string }[] }
  expect(manifest.name).toContain('Forge')
  expect(manifest.display).toBe('standalone')
  expect(manifest.icons.map((i) => i.sizes)).toEqual(expect.arrayContaining(['192x192', '512x512']))
  expect(manifest.icons.some((i) => i.purpose?.includes('maskable'))).toBe(true)
  await page.goto('/')
  const scope = await page.evaluate(async () => (await navigator.serviceWorker.ready).scope)
  expect(scope).toMatch(/\/$/)
})

test('onboarding builds a plan and a full workout is logged', async ({ page }) => {
  const errors = trackErrors(page)
  await onboard(page)
  await expect(page.getByRole('heading', { name: 'Train' })).toBeVisible()

  // A short "exercise snack" runs through every player screen quickly.
  await page.goto('/#/workout?snack=3')
  await page.getByRole('button', { name: "Let's go" }).click()
  const feedback = page.getByRole('heading', { name: 'Workout done!' })
  for (let i = 0; i < 80 && !(await feedback.isVisible()); i++) {
    for (const name of ['Done', 'Skip rest', 'Go']) {
      const b = page.getByRole('button', { name, exact: true })
      if (await b.isVisible()) {
        await b.click()
        break
      }
    }
  }
  await expect(feedback).toBeVisible()
  await page.getByRole('button', { name: /Just right/ }).click()
  await expect(page.getByRole('heading', { name: 'Nice work!' })).toBeVisible()
  await expectNoErrors(errors)
})

test('logs food and water and shows them on the Eat tab', async ({ page }) => {
  const errors = trackErrors(page)
  await onboard(page)
  await page.goto('/#/eat/add?meal=breakfast')
  await page.getByPlaceholder(/Search foods/).fill('banana')
  await page.getByRole('button', { name: /banana/i }).first().click()
  await page.getByRole('button', { name: 'Add to breakfast' }).click()
  await expect(page.getByRole('status').filter({ hasText: /^Added .* to breakfast$/i })).toBeVisible()
  await page.goto('/#/eat')
  await expect(page.getByText(/banana/i).first()).toBeVisible()
  await page.getByRole('button', { name: /Add a \d+ oz glass/ }).click()
  await page.getByRole('button', { name: /Add a \d+ oz glass/ }).click()
  await expect(page.getByRole('button', { name: 'Remove a glass' })).toBeEnabled()
  await expectNoErrors(errors)
})

test('AI meal logging: describe → review → log', async ({ page }) => {
  const errors = trackErrors(page)
  await mockAi(page)
  await onboard(page)
  await page.goto('/#/eat/add?meal=lunch')
  await page.getByRole('button', { name: 'Describe it' }).click()
  // First use on this phone asks for the access code.
  await page.locator('#passcode').fill('letmein123')
  await page.getByRole('button', { name: 'Save' }).click()
  await page.locator('#ai-text').fill('2 scrambled eggs and toast with butter')
  await page.getByRole('button', { name: 'Estimate' }).click()
  await expect(page.getByText('Assumed 1 tsp butter.')).toBeVisible()
  await page.getByRole('button', { name: 'Leave out Toast with butter' }).click()
  await page.getByRole('button', { name: 'Add 1 to lunch' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Added Scrambled eggs to lunch' })).toBeVisible()
  await page.goto('/#/eat')
  await expect(page.getByText('Scrambled eggs', { exact: true })).toBeVisible()
  await expect(page.getByText('Toast with butter', { exact: true })).toHaveCount(0)
  await expectNoErrors(errors)
})

test('coach chat streams a reply with the app context', async ({ page }) => {
  const errors = trackErrors(page)
  const { coachRequests } = await mockAi(page)
  await onboard(page)
  await page.goto('/#/coach')
  await page.locator('#passcode').fill('letmein123')
  await page.getByRole('button', { name: 'Save' }).click()
  await page.getByRole('textbox', { name: 'Message' }).fill('My knees hurt, what instead of lunges?')
  await page.getByRole('button', { name: 'Send' }).click()
  await expect(page.locator('strong', { hasText: 'glute bridges' })).toBeVisible()
  await expect(page.getByText('Slow on the way down')).toBeVisible()
  const sent = coachRequests[0] as { messages: { role: string; text: string }[]; context: string }
  expect(sent.messages).toEqual([{ role: 'user', text: 'My knees hurt, what instead of lunges?' }])
  expect(sent.context).toContain('Goal: build muscle')
  expect(sent.context).toContain('kosher-style')
  // History stays on the phone across reloads.
  await page.reload()
  await expect(page.getByText('My knees hurt, what instead of lunges?')).toBeVisible()
  await expectNoErrors(errors)
})

test('exports a backup and restores it', async ({ page }) => {
  const errors = trackErrors(page)
  await onboard(page)
  await page.goto('/#/more')
  await page.getByRole('button', { name: /Backup & data/ }).click()
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Export backup' }).click()])
  const path = await download.path()
  const backup = JSON.parse(readFileSync(path, 'utf8')) as { app: string; tables: { kv: { key: string }[] } }
  expect(backup.app).toBe('forge')
  expect(backup.tables.kv.map((r) => r.key)).toContain('profile')
  page.once('dialog', (d) => void d.accept())
  await page.locator('input[type=file]').setInputFiles(path)
  await page.waitForURL(/today/)
  await expect(page.getByRole('button', { name: /Start workout|Do it anyway/ })).toBeVisible()
  await expectNoErrors(errors)
})

test('opens offline once installed', async ({ page, context }) => {
  await onboard(page)
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
  })
  // Make sure this page is controlled before cutting the network.
  await page.reload()
  await page.waitForFunction(() => !!navigator.serviceWorker.controller)
  await context.setOffline(true)
  await page.goto('/#/today')
  await expect(page.getByRole('button', { name: /Start workout|Do it anyway/ })).toBeVisible()
  await page.goto('/#/train/library')
  await expect(page.getByPlaceholder(/Search/)).toBeVisible()
  await context.setOffline(false)
})
