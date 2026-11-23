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

/**
 * The search dialog, open from the bar's search button with its field focused, and with the
 * results of a query, if one is given, once they are there.
 */
const search = async (page: Page, query = '') => {
  await page.locator('.VPNavBarSearch .DocSearch-Button').click()
  const field = page.locator('.VPLocalSearchBox .search-input')
  await expect(field).toBeFocused()
  if (!query) return
  await field.fill(query)
  await expect(
    page.locator('.VPLocalSearchBox .result .title > .local-search-icon').first(),
  ).toBeVisible()
}
/** The search dialog with what "color" finds, which has results under a title of their own. */
const found = (page: Page) => search(page, 'color')

test.describe('an icon in forced colors', () => {
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

  /**
   * Once what moves in an element has stopped, such as a fill of the default theme that takes
   * half a second to come to the color of forced colors.
   */
  const still = (element: Locator) =>
    element.evaluate((host) =>
      Promise.all(host.getAnimations({ subtree: true }).map((motion) => motion.finished)),
    )

  /** The window between the widths at which the docs theme has its links out in the bar and a phone. */
  const LAPTOP = { width: 1024, height: 800 }

  /** The menu behind the three dots, open as under the pointer, once it has faded in. */
  const flyout = async (page: Page) => {
    await page.locator('.VPNavBarExtra').hover()
    await expect(page.locator('.VPNavBarExtra > .menu')).toHaveCSS('opacity', '1')
  }

  /** The phone's menu, open, once it has faded in. */
  const menu = async (page: Page) => {
    await page.locator('.VPNavBarHamburger').click()
    await expect(page.locator('.VPNavScreen')).toHaveCSS('opacity', '1')
  }

  /** The theme switched to light by the switch of the phone's menu, once its knob has moved. */
  const light = async (page: Page) => {
    await menu(page)
    const toggle = page.locator('.VPNavScreen .VPSwitchAppearance')
    await toggle.click()
    await expect(toggle).toHaveAttribute('aria-checked', 'false')
    await still(toggle)
  }

  /** A link of the sidebar that leaves the site, as the default theme renders one. */
  const external = (page: Page) =>
    page
      .locator('.VPSidebar a.VPLink')
      .first()
      .evaluate((link: HTMLAnchorElement) => {
        link.href = 'https://example.com/'
        link.classList.add('vp-external-link-icon')
      })

  /** An icon: its name, its page, its element, the part of it that draws it and its color. */
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
    // the docs theme's controls drawn by an icon alone: the theme switch's sun and moon, which
    // are masks, and the lines of the menu button, which are fills and go the same way
    [
      "the moon of the docs theme's theme switch in the menu behind the three dots",
      '/styles/prose',
      '.VPNavBarExtra .VPSwitchAppearance',
      ' .moon',
      'ButtonText',
      LAPTOP,
      flyout,
    ],
    [
      "the moon of the docs theme's theme switch in the phone's menu",
      '/styles/prose',
      '.VPNavScreen .VPSwitchAppearance',
      ' .moon',
      'ButtonText',
      PHONE,
      menu,
    ],
    [
      "the sun of the docs theme's theme switch",
      '/styles/prose',
      '.VPNavScreen .VPSwitchAppearance',
      ' .sun',
      'ButtonText',
      PHONE,
      light,
    ],
    [
      "the docs theme's menu button",
      '/styles/prose',
      '.VPNavBarHamburger',
      ' .container > span',
      'ButtonText',
      PHONE,
    ],
    [
      "the docs theme's menu button, its menu open and under the pointer",
      '/styles/prose',
      '.VPNavBarHamburger',
      ' .container > span',
      'ButtonText',
      PHONE,
      menu,
    ],
    // on a phone the search button is its magnifier alone, a mask like the sun and moon
    [
      "the magnifier of the docs theme's search button",
      '/styles/prose',
      '.VPNavBarSearch .DocSearch-Button',
      ' .DocSearch-Search-Icon',
      'ButtonText',
      PHONE,
    ],
    // the search dialog's icons, masks too: three of them are a button's only content
    [
      "the back button of the docs theme's search dialog",
      '/styles/prose',
      '.VPLocalSearchBox .back-button',
      ' > .local-search-icon',
      'ButtonText',
      PHONE,
      search,
    ],
    [
      "the layout toggle of the docs theme's search dialog",
      '/styles/prose',
      '.VPLocalSearchBox .toggle-layout-button',
      ' > .local-search-icon',
      'ButtonText',
      DESKTOP,
      search,
    ],
    [
      "the reset button of the docs theme's search dialog",
      '/styles/prose',
      '.VPLocalSearchBox .clear-button',
      ' > .local-search-icon',
      'ButtonText',
      DESKTOP,
      found,
    ],
    [
      "the disabled reset button of the docs theme's search dialog",
      '/styles/prose',
      '.VPLocalSearchBox .clear-button',
      ' > .local-search-icon',
      'GrayText',
      DESKTOP,
      search,
    ],
    [
      "the magnifier of the field of the docs theme's search dialog",
      '/styles/prose',
      '.VPLocalSearchBox .search-bar label',
      ' > .search-icon',
      'CanvasText',
      DESKTOP,
      search,
    ],
    [
      "a chevron between the titles of a result of the docs theme's search dialog",
      '/styles/prose',
      '.VPLocalSearchBox .result:has(.title > .local-search-icon)',
      ' .title > .local-search-icon',
      'LinkText',
      DESKTOP,
      found,
    ],
    [
      "an arrow of a key under the results of the docs theme's search dialog",
      '/styles/prose',
      '.VPLocalSearchBox .search-keyboard-shortcuts',
      ' kbd > .navigate-icon',
      'CanvasText',
      DESKTOP,
      search,
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
      await still(element)
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

  test("the knob of the docs theme's theme switch is drawn as a ring", async ({ page }) => {
    await page.setViewportSize(PHONE)
    await open(page, '/styles/prose')
    await menu(page)
    await page.emulateMedia({ forcedColors: 'active' })
    const toggle = '.VPNavScreen .VPSwitchAppearance'
    await still(page.locator(toggle))
    // the knob alone, without its moon
    await page.addStyleTag({ content: `${toggle} .icon { visibility: hidden }` })
    const knob = page.locator(`${toggle} .check`)
    const [ring, canvas] = [await system(page, 'ButtonText'), await system(page, 'Canvas')]
    expect(ring).not.toBe(canvas)
    expect(await knob.evaluate((check) => getComputedStyle(check).outlineColor)).toBe(ring)
    // a ring all round the knob, at least as long as the knob is wide
    const { width } = (await knob.boundingBox())!
    expect(await painted(page, toggle, ' .check')).toBeGreaterThan(width)
  })

  /** A control on a phone: its name, its element, the part of the page its ring is drawn in. */
  type Control = [
    name: string,
    selector: string,
    around: string,
    prepare?: (page: Page) => Promise<unknown>,
  ]
  const controls: Control[] = [
    [
      "the docs theme's theme switch",
      '.VPNavScreen .VPSwitchAppearance',
      '.VPNavScreenAppearance',
      menu,
    ],
    ["the docs theme's menu button", '.VPNavBarHamburger', '.VPNavBarHamburger'],
    [
      "the docs theme's search button",
      '.VPNavBarSearch .DocSearch-Button',
      '.VPNavBarSearch .DocSearch-Button',
    ],
    // in the search dialog, with something in the field, which the reset button needs to be
    // enabled, and without the field's caret, which blinks
    ...(
      [
        ['back button', 'back-button'],
        ['layout toggle', 'toggle-layout-button'],
        ['reset button', 'clear-button'],
      ] as const
    ).map(([name, button]): Control => [
      `the ${name} of the docs theme's search dialog`,
      `.VPLocalSearchBox .${button}`,
      '.VPLocalSearchBox .search-bar',
      async (page: Page) => {
        await found(page)
        await page.locator('.VPLocalSearchBox .search-input').blur()
      },
    ]),
  ]

  for (const [name, selector, around, prepare] of controls)
    test(`${name} keeps its focus ring`, async ({ page }) => {
      await page.setViewportSize(PHONE)
      await open(page, '/styles/prose')
      await prepare?.(page)
      await page.emulateMedia({ forcedColors: 'active' })
      const control = page.locator(selector)
      const area = page.locator(around)
      await control.blur()
      await still(area)
      const blurred = await pixels(area)
      // from the keyboard, so the ring is the one a keyboard user sees
      await control.focus()
      await page.keyboard.press('Shift+Tab')
      await page.keyboard.press('Tab')
      await expect(control).toBeFocused()
      expect(await control.evaluate((element) => element.matches(':focus-visible'))).toBe(true)
      const focused = await pixels(area)
      let count = 0
      for (let i = 0; i < focused.rgba.length; i += 4)
        if ([0, 1, 2].some((c) => Math.abs(focused.rgba[i + c]! - blurred.rgba[i + c]!) > 48))
          count++
      // a ring around the control, at least as long as one of its sides
      const box = (await control.boundingBox())!
      expect(count).toBeGreaterThan(Math.min(box.width, box.height))
    })
})

test.describe("the look of the docs theme's search dialog", () => {
  /**
   * The styles of an element, as the page computes them: the longhands named, for a part of the
   * dialog, or for a probe on the page that takes the theme's declarations for it alone.
   */
  const styles = (element: Locator, properties: string[]) =>
    element.evaluate(
      (host, properties) =>
        Object.fromEntries(
          properties.map((property) => [
            property,
            getComputedStyle(host).getPropertyValue(property),
          ]),
        ),
      properties,
    )
  const theme = (page: Page, declarations: Record<string, string>, properties: string[]) =>
    page.evaluate(
      ({ declarations, properties }) => {
        const probe = document.createElement('div')
        for (const [property, value] of Object.entries(declarations))
          probe.style.setProperty(property, value)
        document.body.append(probe)
        const style = getComputedStyle(probe)
        const values = Object.fromEntries(
          properties.map((property) => [property, style.getPropertyValue(property)]),
        )
        probe.remove()
        return values
      },
      { declarations, properties },
    )

  /** An edge: its weight and color, and its corner. */
  const EDGE = ['border-top-width', 'border-top-color', 'border-top-left-radius']
  const TEXT = ['font-size', 'line-height']

  for (const scheme of ['dark', 'light'] as const)
    test(`takes the theme's edges, corners, fills and text, over the default theme's, ${scheme}`, async ({
      page,
    }) => {
      await page.setViewportSize(DESKTOP)
      await page.emulateMedia({ colorScheme: scheme })
      await open(page, '/styles/prose')
      expect(await page.locator('html').evaluate((html) => html.classList.contains('dark'))).toBe(
        scheme === 'dark',
      )
      await found(page)
      const dialog = (selector: string) => page.locator(`.VPLocalSearchBox ${selector}`).first()
      const thin = 'var(--ws-border-width-thin) solid'
      const parts: [string, Locator, Record<string, string>, string[]][] = [
        [
          'the panel',
          dialog('.shell'),
          {
            border: `${thin} var(--ws-color-border)`,
            'border-radius': 'var(--ws-radius-xl)',
            'box-shadow': 'none',
          },
          [...EDGE, 'box-shadow'],
        ],
        [
          'the field, focused',
          dialog('.search-bar'),
          {
            border: `${thin} var(--ws-color-interactive)`,
            'border-radius': 'var(--ws-radius-md)',
          },
          EDGE,
        ],
        [
          "the field's text",
          dialog('.search-input'),
          { color: 'var(--ws-color-text)', font: 'var(--ws-text-label)' },
          ['color', ...TEXT],
        ],
        [
          'a result',
          dialog('.result:not(.selected)'),
          { border: `${thin} transparent`, 'border-radius': 'var(--ws-radius-md)' },
          ['border-top-width', 'border-top-left-radius'],
        ],
        ["a result's titles", dialog('.result .titles'), { font: 'var(--ws-text-label-sm)' }, TEXT],
        [
          "a result's mark",
          dialog('.result:not(.selected) .title-icon'),
          { color: 'var(--ws-color-brand)', opacity: '1' },
          ['color', 'opacity'],
        ],
        [
          'the keys under the results',
          dialog('.search-keyboard-shortcuts'),
          { color: 'var(--ws-color-text-secondary)', font: 'var(--ws-text-caption)' },
          ['color', ...TEXT],
        ],
        [
          'a key',
          dialog('.search-keyboard-shortcuts kbd'),
          {
            border: `${thin} var(--ws-color-border-strong)`,
            'border-radius': 'var(--ws-radius-xs)',
            background: 'none',
            'box-shadow': 'none',
            color: 'var(--ws-color-text)',
          },
          [...EDGE, 'background-color', 'box-shadow', 'color'],
        ],
      ]
      for (const [name, part, declarations, properties] of parts)
        expect
          .soft(await styles(part, properties), name)
          .toEqual(await theme(page, declarations, properties))

      // a key cap holds an arrow or a word, and each is as tall as the others, its top and
      // bottom edges in line with theirs
      const caps = await dialog('.search-keyboard-shortcuts')
        .locator('kbd')
        .evaluateAll((keys) =>
          keys.map((key) => {
            const { top, bottom } = key.getBoundingClientRect()
            return { text: key.textContent!.trim(), top, bottom }
          }),
        )
      expect(caps.map(({ text }) => text)).toContain('esc')
      expect(caps.filter(({ text }) => !text).length).toBeGreaterThan(1)
      for (const { text, top, bottom } of caps)
        expect.soft({ top, bottom }, `the key cap ${text || 'of an arrow'}`).toEqual({
          top: caps[0]!.top,
          bottom: caps[0]!.bottom,
        })

      // the field without the focus
      await dialog('.search-input').blur()
      expect(await styles(dialog('.search-bar'), EDGE), 'the field').toEqual(
        await theme(
          page,
          {
            border: `${thin} var(--ws-color-field-border)`,
            'border-radius': 'var(--ws-radius-md)',
          },
          EDGE,
        ),
      )

      // and what the dialog says when nothing is found
      await dialog('.search-input').fill('qqqzzzxxx')
      expect(await styles(dialog('.no-results'), ['color', ...TEXT]), 'no results').toEqual(
        await theme(
          page,
          { color: 'var(--ws-color-text-secondary)', font: 'var(--ws-text-caption)' },
          ['color', ...TEXT],
        ),
      )
    })

  test('on a phone the panel fills the window, without corners', async ({ page }) => {
    await page.setViewportSize(PHONE)
    await open(page, '/styles/prose')
    await found(page)
    const panel = page.locator('.VPLocalSearchBox .shell')
    expect(await panel.evaluate((element) => getComputedStyle(element).borderTopLeftRadius)).toBe(
      '0px',
    )
    expect(await panel.boundingBox()).toEqual({ x: 0, y: 0, ...PHONE })
  })
})

test.describe("a state of the docs theme's search dialog in forced colors", () => {
  test.use({ viewport: DESKTOP })

  type Image = Awaited<ReturnType<typeof pixels>>

  /** How many pixels of two images of one element differ clearly. */
  const differ = (one: Image, other: Image) => {
    expect([other.width, other.height]).toEqual([one.width, one.height])
    let count = 0
    for (let i = 0; i < one.rgba.length; i += 4)
      if ([0, 1, 2].some((c) => Math.abs(one.rgba[i + c]! - other.rgba[i + c]!) > 48)) count++
    return count
  }

  /** How many pixels of an image stand clearly apart from a color, as "rgb(r, g, b)". */
  const ink = ({ rgba }: Image, color: string) => {
    const rgb = color.match(/\d+/g)!.map(Number)
    let count = 0
    for (let i = 0; i < rgba.length; i += 4)
      if ([0, 1, 2].some((c) => Math.abs(rgba[i + c]! - rgb[c]!) > 48)) count++
    return count
  }

  /**
   * A system color as the page computes it, as a style of the page takes it: unlike as the page
   * draws it, without its background, which the system's color of a selection lets through.
   */
  const computed = (page: Page, color: string) =>
    page.evaluate((color) => {
      const probe = document.createElement('span')
      probe.style.color = color
      document.body.append(probe)
      const value = getComputedStyle(probe).color
      probe.remove()
      return value
    }, color)

  /** The colors of an element's four edges, as the page computes them. */
  const edges = (element: Locator) =>
    element.evaluate((host) => {
      const style = getComputedStyle(host)
      return [
        style.borderTopColor,
        style.borderRightColor,
        style.borderBottomColor,
        style.borderLeftColor,
      ]
    })

  test('the selected result, which the arrow keys move, has a heavier edge in the color of a selection', async ({
    page,
  }) => {
    await open(page, '/styles/prose')
    await found(page)
    await page.emulateMedia({ forcedColors: 'active' })
    const results = page.locator('.VPLocalSearchBox .result')
    expect(await results.count()).toBeGreaterThan(1)
    const [first, second] = [results.nth(0), results.nth(1)]
    const canvas = await system(page, 'Canvas')
    expect(await system(page, 'Highlight')).not.toBe(canvas)
    const highlight = await computed(page, 'Highlight')
    // the first result is selected as the results come
    await expect(first).toHaveClass(/\bselected\b/)
    expect(await edges(first)).toEqual(Array(4).fill(highlight))
    expect(await edges(second)).not.toContain(highlight)
    // its outline lies just inside its border, where it leaves the content where it is
    expect(
      await first.evaluate((element) => {
        const style = getComputedStyle(element)
        return parseFloat(style.outlineOffset) + parseFloat(style.borderTopWidth)
      }),
    ).toBe(-parseFloat(await first.evaluate((element) => getComputedStyle(element).outlineWidth)))
    const selected = await pixels(first)

    // the arrow key moves the selection while the field keeps the focus, so only the edge
    // shows which result the enter key opens
    await page.keyboard.press('ArrowDown')
    await expect(second).toHaveClass(/\bselected\b/)
    await expect(page.locator('.VPLocalSearchBox .search-input')).toBeFocused()
    expect(await edges(second)).toEqual(Array(4).fill(highlight))
    expect(await edges(first)).not.toContain(highlight)
    // and the edge shows by its weight too, not by its color alone, which the other results'
    // edges may come close to: selected, the result draws one more ring all around
    const { width } = (await first.boundingBox())!
    expect(ink(selected, canvas) - ink(await pixels(first), canvas)).toBeGreaterThan(2 * width)
  })

  test('the layout toggle, while it shows the excerpts, is drawn in the color of a selection', async ({
    page,
  }) => {
    await open(page, '/styles/prose')
    await found(page)
    await page.emulateMedia({ forcedColors: 'active' })
    const toggle = page.locator('.VPLocalSearchBox .toggle-layout-button')
    const icon = toggle.locator('> .local-search-icon')
    const colors = async () => [
      await icon.evaluate((element) => getComputedStyle(element).backgroundColor),
      await toggle.evaluate((element) => getComputedStyle(element).color),
    ]
    expect(await system(page, 'Highlight')).not.toBe(await system(page, 'ButtonText'))
    const [highlight, text] = [
      await computed(page, 'Highlight'),
      await computed(page, 'ButtonText'),
    ]
    await expect(toggle).not.toHaveClass(/\bdetailed-list\b/)
    expect(await colors()).toEqual([text, text])
    const off = await pixels(toggle)

    // on, and under the pointer, which the default theme colors too
    await toggle.click()
    await expect(toggle).toHaveClass(/\bdetailed-list\b/)
    await expect(page.locator('.VPLocalSearchBox .excerpt').first()).toBeVisible()
    expect(await toggle.evaluate((element) => element.matches(':hover'))).toBe(true)
    expect(await colors()).toEqual([highlight, highlight])
    // and its icon shows it: the toggle looks unlike itself off, across the icon
    const { width } = (await icon.boundingBox())!
    expect(differ(off, await pixels(toggle))).toBeGreaterThan(width)
  })
})
