import { type Page, expect, test } from '@playwright/test'
import { DESKTOP, PHONE, open } from './pages.ts'

/**
 * The status line lies over the bottom of the window. A control that takes the focus has to
 * come to rest above it, where it and its focus ring can be seen.
 */
test('a link reached with Tab is not left under the status line', async ({ page }) => {
  await open(page, '/docs/sample/conditions')
  const link = page.locator('.vp-doc a[href]').last()
  const statusLine = (await page.locator('.WsStatusLine').boundingBox())!

  // start on the control before the link
  await link.evaluate((element) => element.focus({ preventScroll: true }))
  await page.keyboard.press('Shift+Tab')
  await expect(link).not.toBeFocused()
  // with the link far down the page, at the very bottom of the window: behind the status line
  await link.evaluate((element) => {
    const { bottom } = element.getBoundingClientRect()
    window.scrollTo({ top: window.scrollY + bottom - window.innerHeight, behavior: 'instant' })
  })
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(statusLine.height)
  const behind = (await link.boundingBox())!
  expect(behind.y + behind.height).toBeGreaterThan(statusLine.y)

  await page.keyboard.press('Tab')
  await expect(link).toBeFocused()
  await expect
    .poll(async () => {
      const box = (await link.boundingBox())!
      return box.y + box.height
    })
    .toBeLessThanOrEqual(statusLine.y)
})

/**
 * Where the focus ring of the focused element is cut off: the boxes that clip it, with the
 * points of its outer edge that fall outside them. A box clips at its padding edge, rounded
 * as the box is, so the window's corners count too.
 */
const cutRing = () => {
  const element = document.activeElement!
  const style = getComputedStyle(element)
  const grow = parseFloat(style.outlineOffset) + parseFloat(style.outlineWidth)
  const box = element.getBoundingClientRect()
  const ring = {
    left: box.left - grow,
    top: box.top - grow,
    right: box.right + grow,
    bottom: box.bottom + grow,
  }
  // points along the outer edge of the ring, around each of its rounded corners
  const points: [number, number][] = []
  for (const [corner, x, y, sx, sy] of [
    ['TopLeft', ring.left, ring.top, 1, 1],
    ['TopRight', ring.right, ring.top, -1, 1],
    ['BottomRight', ring.right, ring.bottom, -1, -1],
    ['BottomLeft', ring.left, ring.bottom, 1, -1],
  ] as const) {
    const set = parseFloat(style[`border${corner}Radius`])
    const radius = set > 0 ? Math.max(0, set + grow) : 0
    for (let step = 0; step <= 8; step++) {
      const angle = (step / 8) * (Math.PI / 2)
      points.push([
        x + sx * radius * (1 - Math.cos(angle)),
        y + sy * radius * (1 - Math.sin(angle)),
      ])
    }
  }
  const cuts: string[] = []
  for (let clip = element.parentElement; clip; clip = clip.parentElement) {
    const clipStyle = getComputedStyle(clip)
    if (clipStyle.overflowX === 'visible' && clipStyle.overflowY === 'visible') continue
    const outer = clip.getBoundingClientRect()
    const edge = {
      left: outer.left + parseFloat(clipStyle.borderLeftWidth),
      top: outer.top + parseFloat(clipStyle.borderTopWidth),
      right: outer.right - parseFloat(clipStyle.borderRightWidth),
      bottom: outer.bottom - parseFloat(clipStyle.borderBottomWidth),
    }
    const curve = Math.max(
      0,
      parseFloat(clipStyle.borderTopLeftRadius) - parseFloat(clipStyle.borderLeftWidth),
    )
    const outside = points.filter(([x, y]) => {
      if (x < edge.left - 0.5 || x > edge.right + 0.5) return true
      if (y < edge.top - 0.5 || y > edge.bottom + 0.5) return true
      // in a corner, beyond its curve
      const cx = Math.min(Math.max(x, edge.left + curve), edge.right - curve)
      const cy = Math.min(Math.max(y, edge.top + curve), edge.bottom - curve)
      return Math.hypot(x - cx, y - cy) > curve + 0.5
    })
    if (outside.length > 0)
      cuts.push(`${clip.className}: ${outside.map((point) => point.map(Math.round)).join(' ')}`)
  }
  return { cuts, visible: element.matches(':focus-visible') }
}

/** Tabs through the page and returns, for each control of the window's bars, where its ring is cut. */
async function ringsOfTheBars(page: Page) {
  const rings: Record<string, string[]> = {}
  for (let presses = 0; presses < 40; presses++) {
    await page.keyboard.press('Tab')
    const focused = await page.evaluate(() => {
      const element = document.activeElement!
      if (!element.closest('.ws-term :is(.ws-tab-bar, .ws-status-line)')) return null
      const name = element.getAttribute('aria-label') ?? (element as HTMLElement).innerText
      return `${element.className || element.tagName.toLowerCase()} "${name.replace(/\s+/g, ' ')}"`
    })
    if (!focused) continue
    if (focused in rings) break
    const { cuts, visible } = await page.evaluate(cutRing)
    expect(visible, focused).toBe(true)
    rings[focused] = cuts
  }
  return rings
}

for (const [name, viewport] of [
  ['on a wide screen', DESKTOP],
  ['in a window too narrow for the key hints', { width: 900, height: 800 }],
  ['on a phone', PHONE],
  ['on the narrowest phone', { width: 320, height: 640 }],
] as const) {
  test.describe(`the focus rings of the window's bars ${name}`, () => {
    test.use({ viewport })

    test('are seen whole: no box cuts them off, nor a corner of the window', async ({ page }) => {
      await open(page, '/examples/terminal.html')
      const rings = await ringsOfTheBars(page)
      // the tabs, the switch and the theme button are all there, and the hints where they show
      const names = Object.keys(rings).join('\n')
      expect(names).toContain('"home"')
      expect(names).toContain('"writing"')
      expect(names).toContain('ws-status-line__switch')
      expect(names).toContain('ws-status-line__theme')
      if (viewport.width >= 1024) expect(names).toContain('"t theme"')
      for (const [control, cuts] of Object.entries(rings)) expect(cuts, control).toEqual([])
    })

    test('are seen whole when the brand is the link, as in the markup of the guide', async ({
      page,
    }) => {
      await open(page, '/examples/terminal.html')
      // <a class="ws-tab-bar__brand" href="/">...mark... name</a>, at the start of the window
      await page.locator('.ws-tab-bar__brand').evaluate((brand) => {
        const link = document.createElement('a')
        link.className = 'ws-tab-bar__brand'
        link.href = './terminal.html'
        link.textContent = 'whatsaaaa'
        brand.replaceWith(link)
      })
      const rings = await ringsOfTheBars(page)
      const brand = Object.keys(rings).find((control) => control.startsWith('ws-tab-bar__brand'))
      expect(brand).toBeDefined()
      expect(rings[brand!]).toEqual([])
    })
  })
}
