import { type Locator, type Page, expect, test } from '@playwright/test'
import { DESKTOP, NARROWEST, PHONE, at, open } from './pages.ts'

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

/** A screenshot of an element as the page decodes it: its size, and its pixels row by row. */
async function pixels(locator: Locator) {
  const png = await locator.screenshot()
  return locator.page().evaluate(async (data) => {
    const image = new Image()
    image.src = `data:image/png;base64,${data}`
    await image.decode()
    const canvas = document.createElement('canvas')
    canvas.width = image.width
    canvas.height = image.height
    const context = canvas.getContext('2d')!
    context.drawImage(image, 0, 0)
    const { data: rgba } = context.getImageData(0, 0, image.width, image.height)
    return { width: image.width, height: image.height, rgba: [...rgba] }
  }, png.toString('base64'))
}

/**
 * Where the chevron of a prompt is drawn, top and bottom, in px from the prompt's top: the
 * rows of a screenshot of the prompt, with its text taken out, that differ from its background.
 */
async function chevron(prompt: Locator) {
  await prompt.evaluate((element) => (element.style.color = 'transparent'))
  const { width, height, rgba } = await pixels(prompt)
  await prompt.evaluate((element) => (element.style.color = ''))
  const differs = (at: number) =>
    [0, 1, 2].reduce((sum, channel) => sum + Math.abs(rgba[at + channel]! - rgba[channel]!), 0) > 60
  const rows: number[] = []
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++)
      if (differs((y * width + x) * 4)) {
        rows.push(y)
        break
      }
  return { top: rows[0] ?? -1, bottom: (rows.at(-1) ?? -2) + 1 }
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
        const { top, bottom } = await chevron(prompt)
        expect(top, `${width} px`).toBeGreaterThan(0)
        // centered on the first line, as a prompt of one line centers it
        expect(Math.abs((top + bottom) / 2 - line / 2), `${width} px`).toBeLessThanOrEqual(1)
      }
      expect(wrapped).toBeGreaterThan(0)

      // a prompt of one line: the chevron in its middle
      await page.setViewportSize(DESKTOP)
      const { height } = (await prompt.boundingBox())!
      expect(height).toBeCloseTo(line, 0)
      const { top, bottom } = await chevron(prompt)
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
      await page.goto(at(path))
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
      await page.goto(at(path))
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

test.describe('the current tab in forced colors', () => {
  /** The color in the middle of an element's top edge, as the page draws it. */
  const top = async (tab: Locator) => {
    const { width, rgba } = await pixels(tab)
    const [r, g, b] = rgba.slice(Math.floor(width / 2) * 4)
    return `rgb(${r}, ${g}, ${b})`
  }

  for (const [name, path, current, other, marked] of [
    [
      'the tab bar',
      TERMINAL,
      '.ws-tabs a[aria-current="page"]',
      '.ws-tabs a:not([aria-current])',
      false,
    ],
    // as Vue and React render a tab that is not current
    [
      'the tab bar, the other tabs marked not current',
      TERMINAL,
      '.ws-tabs a[aria-current="page"]',
      '.ws-tabs a:not([aria-current="page"])',
      true,
    ],
    [
      'the docs theme',
      '/styles/prose',
      '.VPNavBarMenuLink.active',
      '.VPNavBarMenuLink:not(.active)',
      false,
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
        const tabs = page.locator(other)
        if (marked)
          await tabs.evaluateAll((links) => {
            for (const link of links) link.setAttribute('aria-current', 'false')
          })
        const [highlight, canvas] = [await system(page, 'Highlight'), await system(page, 'Canvas')]
        expect(highlight).not.toBe(canvas)
        // the bar over the current tab, where the browser would drop its shadow
        expect(await top(page.locator(current).first())).toBe(highlight)
        // and no other tab has one, or an edge of its own. The edges are read from the style: a
        // tab starts between two pixels, so a picture of it can take in its neighbor's edge
        expect(await tabs.count()).toBeGreaterThan(0)
        for (const tab of await tabs.all()) {
          expect(await top(tab)).toBe(canvas)
          const sides = await tab.evaluate((element) => {
            const style = getComputedStyle(element)
            return [style.borderLeftColor, style.borderRightColor]
          })
          expect(sides).toEqual([canvas, canvas])
        }
      })
})

test.describe('a mask icon in forced colors', () => {
  /**
   * How many pixels of an element its pseudo-element draws clearly apart from what is under
   * it: the element as it is, next to the element with the pseudo-element hidden in its place.
   */
  const painted = async (page: Page, selector: string, pseudo: string) => {
    const element = page.locator(selector).first()
    const shown = await pixels(element)
    const hidden = await page.addStyleTag({
      content: `${selector}${pseudo} { visibility: hidden !important }`,
    })
    const bare = await pixels(element)
    await hidden.evaluate((style: HTMLStyleElement) => style.remove())
    expect([bare.width, bare.height]).toEqual([shown.width, shown.height])
    let count = 0
    for (let i = 0; i < shown.rgba.length; i += 4)
      if ([0, 1, 2].some((c) => Math.abs(shown.rgba[i + c]! - bare.rgba[i + c]!) > 48)) count++
    return count
  }

  /** The window between the widths at which the docs theme has its links out in the bar and a phone. */
  const LAPTOP = { width: 1024, height: 800 }

  /** The menu behind the three dots, open as under the pointer. */
  const flyout = (page: Page) => page.locator('.VPNavBarExtra').hover()

  /** The phone's menu, open. */
  const menu = (page: Page) => page.locator('.VPNavBarHamburger').click()

  /** A link of the sidebar that leaves the site, as the default theme renders one. */
  const external = (page: Page) =>
    page
      .locator('.VPSidebar a.VPLink')
      .first()
      .evaluate((link: HTMLAnchorElement) => {
        link.href = 'https://example.com/'
        link.classList.add('vp-external-link-icon')
      })

  /** An icon: its name, its page, its element, the part of it drawn as a mask and its color. */
  type Icon = [
    name: string,
    path: string,
    selector: string,
    pseudo: string,
    color: string,
    viewport?: { width: number; height: number },
    prepare?: (page: Page) => Promise<unknown>,
  ]

  const icons: Icon[] = [
    ['the arrow of a link that leaves the site', TERMINAL, 'a.ws-arrow', '::after', 'LinkText'],
    ['the chevron of a prompt', TERMINAL, '.ws-prompt', '::before', 'CanvasText'],
    [
      'the icon of a callout',
      '/examples/prose.html',
      '.ws-callout__title',
      '::before',
      'CanvasText',
    ],
    [
      "the icon of the docs theme's callout",
      '/styles/prose',
      '.vp-doc .custom-block .custom-block-title',
      '::before',
      'CanvasText',
    ],
    [
      "the arrow of the docs theme's link out",
      '/styles/prose',
      '.VPNav .VPNavBarSocialLinks .VPSocialLink',
      '::after',
      'LinkText',
    ],
    ["an icon of the guide's grid", '/styles/forms', '.icons .icon', ' .drawn', 'CanvasText'],
    [
      "the guide's one-color cut of the ghost",
      '/identity/',
      '.kit .preview:has(.mono)',
      ' .mono',
      'CanvasText',
    ],
    [
      'the tick of a done step in the form example',
      '/examples/form.html',
      '.steps__item--done .steps__number',
      '::before',
      'CanvasText',
    ],
    // the default theme's own icons, which the docs theme keeps
    [
      "the docs theme's link out in the menu behind the three dots",
      '/styles/prose',
      '.VPNavBarExtra .VPSocialLink',
      ' > [class*="vpi-social-"]',
      'LinkText',
      LAPTOP,
      flyout,
    ],
    [
      "the docs theme's three dots",
      '/styles/prose',
      '.VPNavBarExtra .button',
      ' .vpi-more-horizontal',
      'ButtonText',
      LAPTOP,
    ],
    [
      "the docs theme's link out in the phone's menu",
      '/styles/prose',
      '.VPNavScreen .VPSocialLink',
      ' > [class*="vpi-social-"]',
      'LinkText',
      PHONE,
      menu,
    ],
    [
      "the arrow of the docs theme's link that leaves the site",
      '/styles/prose',
      '.VPSidebar a.vp-external-link-icon',
      '::after',
      'LinkText',
      DESKTOP,
      external,
    ],
  ]

  for (const [name, path, selector, pseudo, color, viewport = DESKTOP, prepare] of icons)
    test(`${name} is drawn in the color of its text`, async ({ page }) => {
      await page.setViewportSize(viewport)
      await open(page, path)
      await prepare?.(page)
      const element = page.locator(selector).first()
      await element.scrollIntoViewIfNeeded()
      // out of forced colors the icon is there, which says the count below is of the icon
      const themed = await painted(page, selector, pseudo)
      expect(themed).toBeGreaterThan(0)

      await page.emulateMedia({ forcedColors: 'active' })
      const [expected, canvas] = [await system(page, color), await system(page, 'Canvas')]
      expect(expected).not.toBe(canvas)
      // its fill is the system's color of its text, which the browser leaves as it is
      const fill = await element.evaluate(
        (host, pseudo) =>
          pseudo.startsWith('::')
            ? getComputedStyle(host, pseudo).backgroundColor
            : getComputedStyle(host.querySelector(`:scope ${pseudo}`)!).backgroundColor,
        pseudo.trim(),
      )
      expect(fill).toBe(expected)
      if (color !== 'CanvasText')
        expect(await element.evaluate((host) => getComputedStyle(host).color)).toBe(expected)
      // and it shows: as much of it stands apart from the page as in the theme
      expect(await painted(page, selector, pseudo)).toBeGreaterThanOrEqual(themed / 2)
    })
})
