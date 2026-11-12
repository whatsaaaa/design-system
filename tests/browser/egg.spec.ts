import { type Locator, type Page, expect, test } from '@playwright/test'
import { PHONE, open } from './pages.ts'

/** The ghost of the demo on the identity page: the one a visitor is told to press. */
const demoGhost = (page: Page) => page.locator('.stage:not(.held) ws-ghost')
const bubbleOf = (ghost: Locator) => ghost.locator('.ws-ghost__bubble')

async function expectInsideWindow(page: Page, bubble: Locator) {
  const box = (await bubble.locator('svg').boundingBox())!
  const width = await page.evaluate(() => document.documentElement.clientWidth)
  expect(box.x).toBeGreaterThanOrEqual(0)
  expect(box.x + box.width).toBeLessThanOrEqual(width)
  expect(box.y).toBeGreaterThanOrEqual(0)
}

test.describe('the easter egg', () => {
  test.beforeEach(async ({ page }) => {
    await open(page, '/identity/')
    await demoGhost(page).scrollIntoViewIfNeeded()
  })

  test('three presses make the ghost shout the handle, and more hold the a', async ({ page }) => {
    const ghost = demoGhost(page)
    const button = ghost.getByRole('button', { name: 'The whatsaaaa ghost' })
    await expect(ghost).toHaveAttribute('data-pose', 'idle')

    await button.click()
    await expect(ghost).toHaveAttribute('data-pose', 'wag-left')
    await button.click()
    await expect(ghost).toHaveAttribute('data-pose', 'wag-right')
    await expect(bubbleOf(ghost)).toBeHidden()

    await button.click()
    await expect(ghost).toHaveAttribute('data-pose', 'shout')
    await expect(bubbleOf(ghost)).toBeVisible()
    await expect(ghost.getByRole('status')).toHaveText('whatsaaaa!')
    await expect(bubbleOf(ghost).locator('.ws-ghost__bubble-text path')).toHaveCount(
      'whatsaaaa!'.length,
    )

    await button.click()
    await expect(bubbleOf(ghost).locator('.ws-ghost__bubble-text path')).toHaveCount(
      'whatsaaaaa!'.length,
    )
    // announced once, when the shout starts
    await expect(ghost.getByRole('status')).toHaveText('whatsaaaa!')
    await expectInsideWindow(page, bubbleOf(ghost))
  })

  test('the bubble is drawn above everything, next to the ghost', async ({ page }) => {
    const ghost = demoGhost(page)
    for (let press = 0; press < 3; press++) await ghost.getByRole('button').click()
    const bubble = bubbleOf(ghost)
    expect(await bubble.evaluate((element) => element.matches(':popover-open'))).toBe(true)
    const [ghostBox, bubbleBox] = [
      (await ghost.boundingBox())!,
      (await bubble.locator('svg').boundingBox())!,
    ]
    expect(bubbleBox.y + bubbleBox.height).toBeLessThanOrEqual(ghostBox.y)
    expect(bubbleBox.x).toBeGreaterThan(ghostBox.x)
    expect(bubbleBox.x).toBeLessThan(ghostBox.x + ghostBox.width)
  })

  test('the bubble stays with the ghost when the page moves under it', async ({ page }) => {
    const held = page.locator('.stage.held ws-ghost')
    await held.scrollIntoViewIfNeeded()
    await expect(bubbleOf(held)).toBeVisible()
    const gap = async () => {
      const [ghostBox, bubbleBox] = [
        (await held.getByRole('button').boundingBox())!,
        (await bubbleOf(held).locator('svg').boundingBox())!,
      ]
      return {
        above: Math.round(ghostBox.y - (bubbleBox.y + bubbleBox.height)),
        left: Math.round(bubbleBox.x - ghostBox.x),
      }
    }
    const atRest = await gap()
    expect(atRest.above).toBe(4)

    // the page reflows above the ghost, as it does when a font or an image arrives late:
    // nothing scrolls and the window keeps its size
    await page.locator('.stage.held').evaluate((stage) => {
      const spacer = document.createElement('div')
      spacer.style.height = '137px'
      stage.before(spacer)
    })
    await expect.poll(gap).toEqual(atRest)

    await page.mouse.wheel(0, 60)
    await expect.poll(gap).toEqual(atRest)
  })

  test('the ghost calms down by itself', async ({ page }) => {
    const ghost = demoGhost(page)
    for (let press = 0; press < 3; press++) await ghost.getByRole('button').click()
    await expect(ghost).toHaveAttribute('data-pose', 'shout')
    await expect(ghost).toHaveAttribute('data-pose', 'idle', { timeout: 6000 })
    await expect(bubbleOf(ghost)).toBeHidden()
    await expect(ghost.getByRole('status')).toHaveText('')
  })

  for (const key of ['Enter', 'Space']) {
    test(`it works from the keyboard with ${key}`, async ({ page }) => {
      const ghost = demoGhost(page)
      await ghost.getByRole('button').focus()
      for (let press = 0; press < 3; press++) await page.keyboard.press(key)
      await expect(ghost).toHaveAttribute('data-pose', 'shout')
      await expect(ghost.getByRole('status')).toHaveText('whatsaaaa!')
      // the focus stays on the ghost and can be seen
      await expect(ghost.getByRole('button')).toBeFocused()
      const outline = await ghost
        .getByRole('button')
        .evaluate((element) => getComputedStyle(element).outlineStyle)
      expect(outline).toBe('solid')
    })
  }

  test('with reduced motion nothing moves: no wag, and the bubble appears without its pop', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    const ghost = demoGhost(page)
    const button = ghost.getByRole('button')
    await button.click()
    await button.click()
    await expect(ghost).toHaveAttribute('data-pose', 'idle')
    await button.click()
    await expect(ghost).toHaveAttribute('data-pose', 'shout')
    await expect(bubbleOf(ghost)).toBeVisible()
    const animation = await bubbleOf(ghost)
      .locator('svg')
      .evaluate((element) => getComputedStyle(element).animationName)
    expect(animation).toBe('none')
  })

  test('without reduced motion the bubble pops in steps', async ({ page }) => {
    const ghost = demoGhost(page)
    for (let press = 0; press < 3; press++) await ghost.getByRole('button').click()
    const animation = await bubbleOf(ghost)
      .locator('svg')
      .evaluate((element) => {
        const style = getComputedStyle(element)
        return `${style.animationName} ${style.animationTimingFunction}`
      })
    // a browser may leave out "end", which is the default
    expect(animation).toMatch(/^ws-ghost-pop steps\(4(, end)?\)$/)
  })

  test('the shout held open on the page shows the bubble without a press', async ({ page }) => {
    const held = page.locator('.stage.held ws-ghost')
    await held.scrollIntoViewIfNeeded()
    await expect(held).toHaveAttribute('data-pose', 'shout')
    await expect(bubbleOf(held)).toBeVisible()
    await expect(held.getByRole('status')).toHaveText('whatsaaaaaa!')
  })

  test('the ghost in the tab bar shouts below itself and stays inside the window', async ({
    page,
  }) => {
    const ghost = page.locator('.WsNavGhost ws-ghost')
    for (let press = 0; press < 6; press++) await ghost.getByRole('button').click()
    const bubble = bubbleOf(ghost)
    await expect(bubble).toBeVisible()
    await expect(bubble).toHaveAttribute('data-side', 'below')
    await expectInsideWindow(page, bubble)
    const [ghostBox, bubbleBox] = [
      (await ghost.boundingBox())!,
      (await bubble.locator('svg').boundingBox())!,
    ]
    expect(bubbleBox.y).toBeGreaterThanOrEqual(ghostBox.y + ghostBox.height)
  })
})

test.describe('the easter egg on a phone', () => {
  test.use({ viewport: PHONE, hasTouch: true })

  test('the bubble stops growing at the edge of the window', async ({ page }) => {
    await open(page, '/identity/')
    const ghost = demoGhost(page)
    await ghost.scrollIntoViewIfNeeded()
    for (let press = 0; press < 20; press++) await ghost.getByRole('button').click()
    await expect(bubbleOf(ghost)).toBeVisible()
    await expectInsideWindow(page, bubbleOf(ghost))
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      ),
    ).toBe(0)
  })
})

test.describe('the easter egg on a plain page', () => {
  test('works with nothing but the stylesheet and the module', async ({ page }) => {
    await open(page, '/examples/terminal.html')
    const ghost = page.locator('.who ws-ghost')
    for (let press = 0; press < 3; press++) await ghost.getByRole('button').click()
    await expect(ghost).toHaveAttribute('data-pose', 'shout')
    await expect(bubbleOf(ghost)).toBeVisible()
    await expectInsideWindow(page, bubbleOf(ghost))
  })
})
