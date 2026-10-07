import { readFileSync } from 'node:fs'
import { expect, test } from '@playwright/test'
import { dismissCelebrations, expectNoErrors, onboard, recordOpens, trackErrors } from './helpers'

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
  await expect(page.getByRole('button', { name: /Start workout|Do it anyway/ })).toBeVisible()

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

test('meal estimate: Forge asks Claude, then reads the pasted answer', async ({ page, context }) => {
  const errors = trackErrors(page)
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  const opens = await recordOpens(page)
  await onboard(page)
  await page.goto('/#/eat/add?meal=lunch')
  await page.getByRole('button', { name: /Estimate with Claude/ }).click()
  await page.getByRole('checkbox').uncheck()
  await page.locator('#meal-text').fill('2 scrambled eggs and toast with butter')
  await page.getByRole('button', { name: 'Open Claude' }).click()
  const url = (await opens())[0]!
  expect(url.startsWith('https://claude.ai/new?q=')).toBe(true)
  expect(decodeURIComponent(url.split('q=')[1]!)).toContain('What I ate: 2 scrambled eggs and toast with butter')
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('Reply with one short sentence')
  const reply = [
    'Assumed 1 tsp butter.',
    '```json',
    '{"items":[{"name":"Scrambled eggs","portion":"2 large eggs","grams":100,"kcal":182,"protein":12.6,"carbs":1.2,"fat":13.9,"fiber":0,"veg":0,"confidence":"high"},{"name":"Toast with butter","portion":"1 slice","grams":40,"kcal":115,"protein":4,"carbs":15,"fat":4.6,"fiber":2,"veg":0,"confidence":"medium"}],"notes":""}',
    '```',
  ].join('\n')
  await page.getByRole('textbox', { name: 'Claude’s answer' }).fill(reply)
  await page.getByRole('button', { name: 'Read estimate' }).click()
  await expect(page.getByText('Assumed 1 tsp butter.')).toBeVisible()
  await page.getByRole('button', { name: 'Leave out Toast with butter' }).click()
  await page.getByRole('button', { name: 'Add 1 to lunch' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Added Scrambled eggs to lunch' })).toBeVisible()
  await page.goto('/#/eat')
  await expect(page.getByText('Scrambled eggs', { exact: true })).toBeVisible()
  await expect(page.getByText('Toast with butter', { exact: true })).toHaveCount(0)
  await expectNoErrors(errors)
})

test('Ask Claude opens the Claude app with the question and a Forge summary', async ({ page, context }) => {
  const errors = trackErrors(page)
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  const opens = await recordOpens(page)
  await onboard(page)
  await page.goto('/#/coach')
  await page.getByRole('button', { name: /My knees ache/ }).click()
  await expect(page.getByRole('textbox', { name: 'Your question' })).toHaveValue('My knees ache. What can I do instead of lunges?')
  await page.getByRole('button', { name: 'Ask in Claude' }).click()
  const prompt = decodeURIComponent((await opens())[0]!.split('q=')[1]!)
  expect(prompt).toContain('<forge_data>')
  expect(prompt).toContain('Goal: build muscle')
  expect(prompt).toContain('kosher-style')
  expect(prompt).toContain('My question: My knees ache. What can I do instead of lunges?')
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(prompt)
  await page.getByRole('button', { name: 'What Claude will see' }).click()
  await expect(page.locator('pre')).toContainText('Current levels:')
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

test('Today shows daily quests and the streak week', async ({ page }) => {
  const errors = trackErrors(page)
  await onboard(page)
  await page.goto('/#/today')
  await expect(page.getByText('Daily quests')).toBeVisible()
  await expect(page.getByRole('img', { name: /of 3 quests done/ })).toBeVisible()
  await expect(page.getByText(/Light your streak|week streak/)).toBeVisible()
  await expect(page.getByRole('link', { name: 'Settings' })).toBeVisible()
  // The "Log a glass of water" Home Screen shortcut.
  await page.goto('/#/today?water=1')
  await expect(page.getByRole('status').filter({ hasText: /oz of water/ })).toBeVisible()
  await expect(page).toHaveURL(/#\/today$/)
  await page.goto('/#/eat')
  await expect(page.getByText(/^1 of \d+ glasses$|^1$/).first()).toBeVisible()
  await expectNoErrors(errors)
})

test('Play: spin the wheel, do the move and save the session', async ({ page }) => {
  const errors = trackErrors(page)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await onboard(page)
  await page.getByRole('link', { name: 'Play' }).click()
  await expect(page.getByRole('heading', { name: 'Play' })).toBeVisible()
  await page.getByRole('link', { name: /Spin the wheel/ }).click()
  await page.getByRole('button', { name: 'Spin', exact: true }).first().click()
  await page.getByRole('button', { name: /Do it · / }).click()
  await expect(page.getByRole('button', { name: 'Done' })).toBeEnabled({ timeout: 6000 })
  await page.getByRole('button', { name: 'Done' }).click()
  await page.getByRole('button', { name: /Finish & save/ }).click()
  await expect(page.getByRole('heading', { name: 'Play' })).toBeVisible()
  await expect(page.getByRole('status').filter({ hasText: 'Wheel session saved' })).toBeVisible()
  await expectNoErrors(errors)
})

test('Play: a quick deck of cards runs to the end', async ({ page }) => {
  const errors = trackErrors(page)
  await onboard(page)
  await page.goto('/#/play/deck')
  await page.getByRole('button', { name: /Quick · 13/ }).click()
  await page.getByRole('button', { name: 'Shuffle & start' }).click()
  for (let i = 0; i < 13; i++) {
    const done = page.getByRole('button', { name: /Done · next card/ })
    await expect(done).toBeEnabled()
    await done.click()
  }
  await expect(page.getByRole('heading', { name: /Deck done!|New best time!/ })).toBeVisible()
  await expectNoErrors(errors)
})

test('Play: a plank challenge sets a first record', async ({ page }) => {
  const errors = trackErrors(page)
  await onboard(page)
  await page.goto('/#/play/challenge/plank')
  await page.getByRole('button', { name: 'Start' }).click()
  await expect(page.getByText('Hold it!')).toBeVisible({ timeout: 8000 })
  await page.waitForTimeout(2200)
  await page.getByRole('button', { name: 'Stop' }).click()
  await expect(page.getByRole('heading', { name: 'First record set!' })).toBeVisible()
  await page.getByRole('button', { name: 'Save result' }).click()
  await expect(page.getByRole('dialog', { name: 'Celebration' }).getByText('New personal best')).toBeVisible()
  await dismissCelebrations(page)
  await page.getByRole('button', { name: 'Done' }).click()
  await expect(page.getByRole('heading', { name: 'Play' })).toBeVisible()
  await expectNoErrors(errors)
})

test('guide, weekly recap and "try a set" all work', async ({ page }) => {
  const errors = trackErrors(page)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await onboard(page)
  await page.getByRole('link', { name: /See how Forge works/ }).click()
  await expect(page.getByRole('heading', { name: 'How Forge works' })).toBeVisible()
  await page.getByRole('button', { name: 'Something hurts.' }).click()
  await expect(page.getByText(/Aches & limits/)).toBeVisible()

  await page.goto('/#/recap')
  await expect(page.getByRole('dialog', { name: 'Weekly recap' })).toBeVisible()
  for (let i = 0; i < 8 && !(await page.getByRole('button', { name: 'Let’s go' }).isVisible()); i++) await page.mouse.click(300, 400)
  await page.getByRole('button', { name: 'Let’s go' }).click()
  await page.waitForURL(/today/)

  await page.goto('/#/exercise/bodyweight-squat')
  await page.getByRole('button', { name: 'Try a set' }).click()
  await expect(page.getByRole('button', { name: 'Done' })).toBeEnabled({ timeout: 6000 })
  await page.getByRole('button', { name: 'Done' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Nice set!' })).toBeVisible()
  await expectNoErrors(errors)
})

test('Look & feel: theme, accent and coach personality stick', async ({ page }) => {
  const errors = trackErrors(page)
  await onboard(page)
  await page.getByRole('link', { name: 'Settings' }).click()
  await page.getByRole('button', { name: /Look & feel/ }).click()
  await page.getByRole('button', { name: 'Light', exact: true }).click()
  await page.getByRole('button', { name: 'Ocean', exact: true }).click()
  await page.getByRole('button', { name: /Drill sergeant/ }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  await expect(page.locator('html')).toHaveAttribute('data-accent', 'ocean')
  await expect(page.getByRole('button', { name: /Violet, unlocks at level 3/ })).toBeDisabled()
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  await expect(page.locator('html')).toHaveAttribute('data-accent', 'ocean')
  await page.goto('/#/workout')
  await expect(page.getByRole('button', { name: /Drill/ })).toHaveAttribute('aria-pressed', 'true')
  await expectNoErrors(errors)
})

test('phone reminders: no setup, straight into the calendar', async ({ page }) => {
  const errors = trackErrors(page)
  await onboard(page)
  await expect(page.getByText('Get reminders on your phone')).toBeVisible()
  await page.goto('/#/more/reminders')
  await expect(page.getByRole('radio', { name: /Phone reminders/ })).toHaveAttribute('aria-checked', 'true')
  await expect(page.getByText(/APP_PASSCODE/)).toHaveCount(0)
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: /Add \d+ reminders? to my calendar/ }).click()])
  expect(download.suggestedFilename()).toBe('forge-reminders.ics')
  const ics = readFileSync(await download.path(), 'utf8')
  expect(ics.startsWith('BEGIN:VCALENDAR')).toBe(true)
  expect(ics).toContain('BEGIN:VALARM')
  expect(ics).toMatch(/SUMMARY:.*Workout time/)
  await expect(page.getByText(/In your calendar since/)).toBeVisible()
  await expect(page.getByRole('link', { name: /Google Calendar/ })).toHaveAttribute('href', /calendar\.google\.com\/calendar\/render\?action=TEMPLATE/)
  // Smart notifications are still there for anyone who set up the server.
  await page.getByRole('radio', { name: /Smart notifications/ }).click()
  await expect(page.getByText(/APP_PASSCODE/).first()).toBeVisible()
  await page.getByRole('radio', { name: /Phone reminders/ }).click()
  await page.goto('/#/today')
  await expect(page.getByText('Get reminders on your phone')).toHaveCount(0)
  await expect(page.getByRole('link', { name: /Get phone reminders, done/ })).toBeVisible()
  await expectNoErrors(errors)
})
