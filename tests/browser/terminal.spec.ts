import { type Locator, type Page, expect, test } from '@playwright/test'
import { DESKTOP, NARROWEST, PHONE, open } from './pages.ts'

/**
 * Small pieces of the terminal frame: a state lines up with the text beside it, a prompt that
 * wraps keeps its chevron on its first line, and the numbers of the tabs show only while the
 * keys they name work.
 */
const TERMINAL = '/examples/terminal.html'

/** The baseline of the text of each element, from the top of the page. */
const baselines = (locator: Locator) =>
  locator.evaluateAll((elements) =>
    elements.map((element) => {
      // the top of the text's box, and how far its font's baseline lies under that top
      const range = document.createRange()
      range.selectNodeContents(element)
      const context = document.createElement('canvas').getContext('2d')!
      context.font = getComputedStyle(element).font
      return (
        range.getBoundingClientRect().top +
        context.measureText(element.textContent!).fontBoundingBoxAscent
      )
    }),
  )

/**
 * Where the chevron of a prompt is drawn, top and bottom, in px from the prompt's top: the
 * rows of a screenshot of the prompt, with its text taken out, that differ from its background.
 */
async function chevron(page: Page, prompt: Locator) {
  await prompt.evaluate((element) => (element.style.color = 'transparent'))
  const png = await prompt.screenshot()
  await prompt.evaluate((element) => (element.style.color = ''))
  return page.evaluate(async (data) => {
    const image = new Image()
    image.src = `data:image/png;base64,${data}`
    await image.decode()
    const canvas = document.createElement('canvas')
    canvas.width = image.width
    canvas.height = image.height
    const context = canvas.getContext('2d')!
    context.drawImage(image, 0, 0)
    const pixels = context.getImageData(0, 0, image.width, image.height).data
    const differs = (at: number) =>
      [0, 1, 2].reduce(
        (sum, channel) => sum + Math.abs(pixels[at + channel]! - pixels[channel]!),
        0,
      ) > 60
    const rows: number[] = []
    for (let y = 0; y < image.height; y++)
      for (let x = 0; x < image.width; x++)
        if (differs((y * image.width + x) * 4)) {
          rows.push(y)
          break
        }
    return { top: rows[0] ?? -1, bottom: (rows.at(-1) ?? -2) + 1 }
  }, png.toString('base64'))
}

for (const colorScheme of ['dark', 'light'] as const) {
  test.describe(colorScheme, () => {
    test.use({ colorScheme })

    test('a state shares its baseline with the title beside it', async ({ page }) => {
      await page.setViewportSize(DESKTOP)
      await open(page, TERMINAL)
      const states = await baselines(page.locator('.entry .ws-state'))
      const titles = await baselines(page.locator('.entry h3 a'))
      expect(states).toHaveLength(3)
      // the dot gave the state its baseline once, half a pixel under the word's
      for (const [index, state] of states.entries())
        expect(Math.abs(state - titles[index]!)).toBeLessThan(0.05)
    })

    test('a prompt keeps its chevron on its first line, at every width from 320 px', async ({
      page,
    }) => {
      await page.setViewportSize(NARROWEST)
      await open(page, TERMINAL)
      const prompt = page.locator('.ws-prompt').first()
      // a command a phone has to wrap
      await prompt.evaluate(
        (element) => (element.textContent = 'cat ~/ideas/react-component-library.md'),
      )
      const line = await prompt.evaluate((element) =>
        parseFloat(getComputedStyle(element).lineHeight),
      )
      let wrapped = 0
      for (let width = 320; width <= 400; width += 8) {
        await page.setViewportSize({ width, height: 640 })
        const { height } = (await prompt.boundingBox())!
        if (height > line * 1.5) wrapped++
        const { top, bottom } = await chevron(page, prompt)
        expect(top, `${width} px`).toBeGreaterThan(0)
        // centered on the first line, as a prompt of one line centers it
        expect(Math.abs((top + bottom) / 2 - line / 2), `${width} px`).toBeLessThanOrEqual(1)
      }
      expect(wrapped).toBeGreaterThan(0)

      // a prompt of one line: the chevron in its middle
      await page.setViewportSize(DESKTOP)
      const { height } = (await prompt.boundingBox())!
      expect(height).toBeCloseTo(line, 0)
      const { top, bottom } = await chevron(page, prompt)
      expect(Math.abs((top + bottom) / 2 - height / 2)).toBeLessThanOrEqual(1)
    })
  })
}

test.describe('the numbers of the tabs', () => {
  test.use({ viewport: DESKTOP })

  /**
   * Whether each tab's number is drawn, and seen, and how far into its tab the label of the
   * second tab starts. The brand before the tabs may change with the app, the tab may not.
   */
  const tabs = (page: Page, selector: string) =>
    page.evaluate((selector) => {
      const links = [...document.querySelectorAll(selector)]
      const range = document.createRange()
      range.selectNodeContents(links[1]!)
      return {
        drawn: links.map((link) => getComputedStyle(link, '::before').content !== 'none'),
        seen: links.map((link) => getComputedStyle(link, '::before').visibility === 'visible'),
        label: range.getBoundingClientRect().left - links[1]!.getBoundingClientRect().left,
      }
    }, selector)

  for (const [name, path, selector, scripts] of [
    ['the tab bar', TERMINAL, '.ws-tabs a', '**/example.js'],
    ['the docs theme', '/styles/prose', '.VPNavBarMenuLink', '**/assets/**/*.js'],
  ] as const) {
    test(`are not drawn without JavaScript, in ${name}`, async ({ browser }) => {
      const context = await browser.newContext({ viewport: DESKTOP, javaScriptEnabled: false })
      const page = await context.newPage()
      await page.goto(path)
      const { drawn } = await tabs(page, selector)
      expect(drawn.length).toBeGreaterThan(1)
      expect(drawn).not.toContain(true)
      await context.close()
    })

    test(`keep their place unseen until the keys are on, so the labels stay, in ${name}`, async ({
      page,
    }) => {
      // the page before its app runs: the head script has run, the module never arrives
      await page.route(scripts, (route) => route.abort())
      await page.goto(path)
      await expect(page.locator('html')).toHaveAttribute('data-ws-keys', 'pending')
      const before = await tabs(page, selector)
      expect(before.drawn).not.toContain(false)
      expect(before.seen).not.toContain(true)

      await page.unroute(scripts)
      await open(page, path)
      await expect(page.locator('html')).toHaveAttribute('data-ws-keys', 'on')
      const after = await tabs(page, selector)
      expect(after.seen).not.toContain(false)
      expect(after.label).toBe(before.label)
    })
  }
})

test.describe('the current tab in forced colors', () => {
  /** The color in the middle of an element's top edge, as the page draws it. */
  const top = async (page: Page, tab: Locator) => {
    const png = await tab.screenshot()
    return page.evaluate(async (data) => {
      const image = new Image()
      image.src = `data:image/png;base64,${data}`
      await image.decode()
      const canvas = document.createElement('canvas')
      canvas.width = image.width
      canvas.height = image.height
      const context = canvas.getContext('2d')!
      context.drawImage(image, 0, 0)
      const [r, g, b] = context.getImageData(Math.floor(image.width / 2), 0, 1, 1).data
      return `rgb(${r}, ${g}, ${b})`
    }, png.toString('base64'))
  }

  /** A system color as the page draws it on its background, which the color may let through. */
  const system = (page: Page, color: string) =>
    page.evaluate((color) => {
      const context = document.createElement('canvas').getContext('2d')!
      for (const fill of ['Canvas', color]) {
        // as the page computes it: a canvas does not take the colors of forced colors
        const probe = document.createElement('span')
        probe.style.color = fill
        document.body.append(probe)
        context.fillStyle = getComputedStyle(probe).color
        probe.remove()
        context.fillRect(0, 0, 1, 1)
      }
      const [r, g, b] = context.getImageData(0, 0, 1, 1).data
      return `rgb(${r}, ${g}, ${b})`
    }, color)

  for (const [name, path, current, other] of [
    ['the tab bar', TERMINAL, '.ws-tabs a[aria-current="page"]', '.ws-tabs a:not([aria-current])'],
    [
      'the docs theme',
      '/styles/prose',
      '.VPNavBarMenuLink.active',
      '.VPNavBarMenuLink:not(.active)',
    ],
  ] as const)
    for (const [size, viewport] of [
      ['desktop', DESKTOP],
      ['phone', PHONE],
    ] as const)
      test(`keeps its bar in the selection color, in ${name} on a ${size}`, async ({ page }) => {
        await page.setViewportSize(viewport)
        await page.emulateMedia({ forcedColors: 'active' })
        await open(page, path)
        const [highlight, canvas] = [await system(page, 'Highlight'), await system(page, 'Canvas')]
        expect(highlight).not.toBe(canvas)
        // the bar over the current tab, where the browser would drop its shadow
        expect(await top(page, page.locator(current).first())).toBe(highlight)
        // and no other tab has one, or an edge of its own. The edges are read from the style: a
        // tab starts between two pixels, so a picture of it can take in its neighbor's edge
        const tabs = page.locator(other)
        expect(await tabs.count()).toBeGreaterThan(0)
        for (const tab of await tabs.all()) {
          expect(await top(page, tab)).toBe(canvas)
          const sides = await tab.evaluate((element) => {
            const style = getComputedStyle(element)
            return [style.borderLeftColor, style.borderRightColor]
          })
          expect(sides).toEqual([canvas, canvas])
        }
      })
})
