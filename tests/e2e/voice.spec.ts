import { expect, test } from '@playwright/test'
import { expectNoErrors, onboard, trackErrors } from './helpers'

test('the coach speaks with a natural voice, and you can pick another', async ({ page }) => {
  const errors = trackErrors(page)
  const clips: string[] = []
  page.on('request', (r) => {
    const m = new URL(r.url()).pathname.match(/^\/voice\/(\w+)\/\w+\.mp3$/)
    if (m) clips.push(m[1])
  })
  await onboard(page)

  // The workout intro downloads the voice for this workout, and the player uses it.
  await page.goto('/#/workout')
  await expect.poll(() => clips.length, { timeout: 15_000 }).toBeGreaterThan(20)
  expect(new Set(clips)).toEqual(new Set(['heart']))
  await page.getByRole('button', { name: "Let's go" }).click()
  await expect(page.getByText('First up · how to do it')).toBeVisible()
  await page.getByRole('button', { name: 'End workout' }).click()
  await page.getByRole('button', { name: 'Discard workout' }).click()
  await page.waitForURL(/today/)

  // Settings: Heart by default; Michael and the phone's voice are a tap away, and it sticks.
  await page.goto('/#/more')
  await expect(page.getByRole('button', { name: /Voice & sounds/ })).toContainText('Heart (natural voice)')
  await page.getByRole('button', { name: /Voice & sounds/ }).click()
  const voices = page.getByRole('radiogroup', { name: 'Voice' })
  await expect(voices.getByRole('radio', { name: /Heart/ })).toHaveAttribute('aria-checked', 'true')
  await voices.getByRole('radio', { name: /Michael/ }).click()
  await expect(voices.getByRole('radio', { name: /Michael/ })).toHaveAttribute('aria-checked', 'true')
  await expect.poll(() => clips.includes('michael'), { timeout: 10_000 }).toBe(true)
  await voices.getByRole('radio', { name: /Phone voice/ }).click()
  await expect(page.getByRole('combobox', { name: 'Phone voice' })).toBeVisible()
  await expect(page.getByText(/download an “Enhanced” or “Premium” voice/)).toBeVisible()
  await voices.getByRole('radio', { name: /Michael/ }).click()
  await page.reload()
  await page.getByRole('button', { name: /Voice & sounds/ }).click()
  await expect(page.getByRole('radio', { name: /Michael/ })).toHaveAttribute('aria-checked', 'true')
  await expectNoErrors(errors)
})
