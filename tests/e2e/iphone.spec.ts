import { devices, expect, test, type Page } from '@playwright/test'
import { expectNoErrors, onboard, trackErrors } from './helpers'

/** Forge as a Home Screen app on an iPhone: standalone, no vibration API, haptic ticks counted. */
const iPhone = devices['iPhone 13']
test.use({ userAgent: iPhone.userAgent, viewport: iPhone.viewport, deviceScaleFactor: iPhone.deviceScaleFactor, isMobile: true, hasTouch: true })

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'standalone', { get: () => true })
    delete (Navigator.prototype as Partial<Navigator>).vibrate
    const w = window as unknown as { __ticks: number }
    w.__ticks = 0
    const click = HTMLLabelElement.prototype.click
    HTMLLabelElement.prototype.click = function (this: HTMLLabelElement) {
      if (this.querySelector('input[switch]')) w.__ticks++
      click.call(this)
    }
  })
})

const ticks = (page: Page) => page.evaluate(() => (window as unknown as { __ticks: number }).__ticks)

/** A one-finger drag from (x, y), as the phone's touch screen would send it. */
async function touchDrag(page: Page, from: { x: number; y: number }, by: { x: number; y: number }, during?: () => Promise<void>) {
  const cdp = await page.context().newCDPSession(page)
  const at = (i: number) => [{ x: from.x + (by.x * i) / 10, y: from.y + (by.y * i) / 10 }]
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: at(0) })
  for (let i = 1; i <= 10; i++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: at(i) })
  await during?.()
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  await cdp.detach()
}

test('iPhone: swipe from the left edge to go back', async ({ page }) => {
  const errors = trackErrors(page)
  await onboard(page)
  await page.getByRole('link', { name: 'Settings' }).click()
  await page.getByRole('link', { name: /How Forge works/ }).click()
  await expect(page).toHaveURL(/#\/guide/)
  const before = await ticks(page)

  // A short pull shows the arrow but stays put; a vertical drag is just a scroll.
  await touchDrag(page, { x: 6, y: 420 }, { x: 40, y: 0 }, () => expect(page.locator('[data-edge-back="pulling"]')).toBeVisible())
  await touchDrag(page, { x: 6, y: 420 }, { x: 20, y: -200 })
  await expect(page).toHaveURL(/#\/guide/)
  await expect(page.locator('[data-edge-back]')).toHaveCount(0)

  // Far enough and it goes back, with a tick.
  await touchDrag(page, { x: 6, y: 420 }, { x: 150, y: 12 }, () => expect(page.locator('[data-edge-back="armed"]')).toBeVisible())
  await expect(page).toHaveURL(/#\/more$/)
  await expect.poll(() => ticks(page)).toBeGreaterThan(before)
  await expectNoErrors(errors)
})

test('iPhone: sheets close with a drag down, and spring back from a nudge', async ({ page }) => {
  const errors = trackErrors(page)
  await onboard(page)
  await page.goto('/#/more')
  await page.getByRole('button', { name: /Look & feel/ }).click()
  const sheet = page.getByRole('dialog', { name: 'Look & feel' })
  await expect(sheet).toBeVisible()
  await page.waitForTimeout(400) // let it finish sliding up
  const grip = (await sheet.locator('[data-sheet-grip]').boundingBox())!
  const from = { x: grip.x + grip.width / 3, y: grip.y + 8 }

  await touchDrag(page, from, { x: 0, y: 18 })
  await page.waitForTimeout(400)
  await expect(sheet).toBeVisible()

  await touchDrag(page, from, { x: 0, y: 260 })
  await expect(sheet).toHaveCount(0)
  // Focus went back to what opened it, and the page scrolls again.
  await expect(page.getByRole('button', { name: /Look & feel/ })).toBeFocused()
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('')
  await expectNoErrors(errors)
})

test('iPhone: haptic ticks stand in for vibration, and the switch turns them off', async ({ page }) => {
  const errors = trackErrors(page)
  await onboard(page)
  await page.goto('/#/more')
  await page.getByRole('button', { name: /Look & feel/ }).click()
  const vibration = page.getByRole('switch', { name: 'Vibration' })
  await vibration.click()
  await expect(vibration).toHaveAttribute('aria-checked', 'false')
  const off = await ticks(page)
  const dark = page.getByRole('button', { name: 'Dark', exact: true })
  await dark.click()
  await page.waitForTimeout(300)
  expect(await ticks(page)).toBe(off)

  // Turning it back on says hello with a double tick, and taps tick again.
  await vibration.click()
  await expect.poll(() => ticks(page)).toBe(off + 2)
  await dark.click()
  await expect.poll(() => ticks(page)).toBe(off + 3)
  await expectNoErrors(errors)
})
