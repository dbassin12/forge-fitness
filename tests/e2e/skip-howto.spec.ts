import { expect, test } from '@playwright/test'
import { expectNoErrors, onboard, trackErrors } from './helpers'

test('exercises you skip stay out of your workouts until you bring them back', async ({ page }) => {
  const errors = trackErrors(page)
  await onboard(page)

  // From the workout preview: swap sheet → never include.
  await page.goto('/#/train/session')
  const swap = page.getByRole('button', { name: /^Swap / }).first()
  const name = (await swap.getAttribute('aria-label'))!.replace(/^Swap /, '')
  await expect(page.getByRole('link', { name: `${name} guide` })).toBeVisible()
  await swap.click()
  await page.getByRole('button', { name: `Never include ${name}` }).click()
  await expect(page.getByRole('status').filter({ hasText: `${name} is out` })).toBeVisible()
  await expect(page.getByRole('link', { name: `${name} guide` })).toHaveCount(0)

  // Settings lists it; the skip list can bring it back.
  await page.goto('/#/more')
  await expect(page.getByRole('link', { name: /Exercises I skip/ })).toContainText(name)
  await page.getByRole('link', { name: /Exercises I skip/ }).click()
  await expect(page.getByRole('heading', { name: 'Exercises I skip' })).toBeVisible()
  await expect(page.getByRole('button', { name: `Skip ${name}` })).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('button', { name: `Bring back ${name}` }).click()
  await expect(page.getByRole('button', { name: `Skip ${name}` })).toHaveAttribute('aria-pressed', 'false')

  // Skip from the list and from an exercise's own page.
  await page.getByRole('button', { name: 'Skip Burpee' }).click()
  await expect(page.getByRole('button', { name: 'Bring back Burpee' })).toBeVisible()
  await page.goto('/#/exercise/burpee')
  await expect(page.getByText('You skip this exercise.')).toBeVisible()
  await page.getByRole('button', { name: 'Bring back' }).click()
  await expect(page.getByRole('button', { name: /Not for me: leave it out/ })).toBeVisible()
  await page.getByRole('button', { name: /Not for me: leave it out/ }).click()
  await expect(page.getByText('You skip this exercise.')).toBeVisible()

  // The library marks it.
  await page.goto('/#/train/library')
  await expect(page.getByRole('link', { name: /Burpee/ }).getByText('Skipped')).toBeVisible()
  await expectNoErrors(errors)
})

test('the player explains a new exercise first, and you can skip one mid-workout', async ({ page }) => {
  const errors = trackErrors(page)
  await onboard(page)
  await page.goto('/#/workout')
  await expect(page.getByRole('radio', { name: 'New moves' })).toHaveAttribute('aria-checked', 'true')
  await page.getByRole('button', { name: "Let's go" }).click()

  // The first exercise opens on its how-to: demo, numbered steps, breathing.
  await expect(page.getByText('First up · how to do it')).toBeVisible()
  const first = (await page.getByRole('heading', { level: 1 }).textContent())!.trim()
  await expect(page.getByRole('listitem').first()).toBeVisible()
  await page.getByRole('button', { name: 'Start now' }).click()

  // Mid-set help, then skip the exercise for today.
  await expect(page.getByRole('heading', { level: 1, name: first })).toBeVisible()
  await page.getByRole('button', { name: 'How to' }).click()
  const sheet = page.getByRole('dialog', { name: first })
  await expect(sheet.getByRole('button', { name: 'Read it to me' })).toBeVisible()
  await sheet.getByRole('button', { name: /Not for me: skip this exercise/ }).click()
  await page.getByRole('dialog', { name: `Skip ${first}?` }).getByRole('button', { name: 'Skip it today' }).click()
  await expect(page.getByRole('heading', { level: 1, name: first })).toHaveCount(0)
  await expect(page.getByText(/how to do it|Next up/).first()).toBeVisible()

  // "Just go" turns the how-to off: the workout opens on a plain get-ready countdown.
  await page.getByRole('button', { name: 'End workout' }).click()
  await page.getByRole('button', { name: 'Discard workout' }).click()
  await page.waitForURL(/today/)
  await page.goto('/#/workout')
  await page.getByRole('radio', { name: 'Just go' }).click()
  await page.getByRole('button', { name: /Let's go|Start fresh/ }).click()
  await expect(page.getByText('Get ready', { exact: true })).toBeVisible()
  await expect(page.getByText('First up · how to do it')).toHaveCount(0)
  await expectNoErrors(errors)
})

test('after a workout you can leave out a move you didn’t like, and look moves up before starting', async ({ page }) => {
  const errors = trackErrors(page)
  await onboard(page)

  // From the intro, any move opens its guide.
  await page.goto('/#/workout?snack=3')
  const move = page.getByRole('link').filter({ hasText: /\w/ }).first()
  const name = (await move.textContent())!.trim()
  await move.click()
  await expect(page.getByRole('heading', { name, level: 1 })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Tutorial' })).toBeVisible()
  await page.goBack()

  await page.getByRole('button', { name: "Let's go" }).click()
  const feedback = page.getByRole('heading', { name: 'Workout done!' })
  for (let i = 0; i < 80 && !(await feedback.isVisible()); i++) {
    for (const n of ['Done', 'Skip rest', 'Go', /^Start( now| · \d+)$/]) {
      const b = page.getByRole('button', { name: n, exact: typeof n === 'string' })
      if (await b.isVisible()) {
        await b.click()
        break
      }
    }
  }
  await page.getByRole('button', { name: /Just right/ }).click()
  await expect(page.getByRole('heading', { name: 'Nice work!' })).toBeVisible()

  // "Not a fan?" on the summary skips it from now on (and a second tap keeps it).
  const chip = page.getByRole('button', { name: `Leave out ${name}` })
  await chip.click()
  await expect(chip).toHaveAttribute('aria-pressed', 'true')
  await page.goto('/#/train/skipped')
  await expect(page.getByRole('button', { name: `Bring back ${name}` })).toBeVisible()
  await expectNoErrors(errors)
})
