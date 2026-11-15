import { expect, test } from '@playwright/test'
import { DESKTOP, PAGES, PHONE, open } from './pages.ts'

test.describe('the asset kit on the page', () => {
  test('a file without a preview says so on the page background, where the note reads', async ({
    page,
  }) => {
    await open(page, '/identity/banners')
    const preview = page.locator('.kit .card', { hasText: 'favicon.ico' }).locator('.preview')
    await expect(preview).toHaveText('no preview')
    const background = (element: Element) => {
      const style = getComputedStyle(element)
      return `${style.backgroundImage} ${style.backgroundColor}`
    }
    expect(await preview.evaluate(background)).toBe(
      `none ${await page.locator('body').evaluate((body) => getComputedStyle(body).backgroundColor)}`,
    )
  })
})

test.describe('code blocks', () => {
  test('a block has a caption bar only when it has a file name or a language to show', async ({
    page,
  }) => {
    await open(page, '/styles/prose')
    const caption = (block: Element) => ({
      room: getComputedStyle(block).paddingTop,
      bar: getComputedStyle(block, '::before').content,
    })
    // the first block of the page has both
    expect(await page.locator('.vp-doc div[class*="language-"]').first().evaluate(caption)).toEqual(
      { room: '36px', bar: '""' },
    )
    // the output in the callout has neither
    const plain = page.locator('.vp-doc .custom-block div[class*="language-"]')
    await expect(plain.locator('.lang')).toBeEmpty()
    expect(await plain.evaluate(caption)).toEqual({ room: '0px', bar: 'none' })
  })

  for (const [name, viewport] of [
    ['on a wide screen', DESKTOP],
    ['on a phone', PHONE],
  ] as const)
    test(`in a group the language stands in the row of the tabs, off the code, ${name}`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport)
      await open(page, '/styles/prose')
      const group = page.locator('.vp-code-group')
      // a first line long enough to reach the right edge of the block
      await group
        .locator('div[class*="language-"].active .line')
        .first()
        .evaluate(
          (line) => (line.textContent = `pnpm add ${'@whatsaaaa/design-system '.repeat(8)}`),
        )
      const shown = await group.evaluate((element) => {
        const box = (selector: string) => element.querySelector(selector)!.getBoundingClientRect()
        /** The box of the text of an element, as it is drawn. */
        const text = (selector: string) => {
          const range = document.createRange()
          range.selectNodeContents(element.querySelector(selector)!)
          return range.getBoundingClientRect()
        }
        const tabs = box('.tabs')
        const labels = [...element.querySelectorAll('.tabs label')].map((label) =>
          label.getBoundingClientRect(),
        )
        const lang = text('div[class*="language-"].active > span.lang')
        const code = box('div[class*="language-"].active pre')
        const label = text('.tabs label')
        return {
          lang: element.querySelector('div[class*="language-"].active > span.lang')!.textContent,
          // the language is in the row of the tabs, on the line of their names
          inRow: lang.top >= tabs.top && lang.bottom <= tabs.bottom,
          sameLine: Math.abs(lang.top - label.top) < 0.5,
          // and over no code and no tab
          overCode: lang.bottom > code.top,
          overTab: labels.some((tab) => tab.right > lang.left),
          // the rule under the tabs runs on under the language, to the frame
          rule: getComputedStyle(element.querySelector('.blocks')!).boxShadow,
        }
      })
      expect(shown).toMatchObject({
        lang: 'sh',
        inRow: true,
        sameLine: true,
        overCode: false,
        overTab: false,
      })
      expect(shown.rule).toMatch(/0px -1px 0px 0px$/)
    })
})

test.describe('the focus ring of the docs theme', () => {
  test("a button takes it, as a link does, and not the browser's own", async ({ page }) => {
    await open(page, '/styles/prose')
    const copy = page.locator('.vp-doc div[class*="language-"] > button.copy').first()
    await copy.evaluate((button) => button.scrollIntoView({ block: 'center' }))
    // reached with the keyboard, from the control before it
    await page.keyboard.press('Tab')
    await copy.focus()
    const ring = (element: Element) => {
      const style = getComputedStyle(element)
      return {
        visible: element.matches(':focus-visible'),
        outline: `${style.outlineStyle} ${style.outlineWidth} ${style.outlineColor}`,
      }
    }
    const link = page.locator('.vp-doc p a[href]').first()
    await link.focus()
    const linkRing = await link.evaluate(ring)
    await copy.focus()
    expect(await copy.evaluate(ring)).toEqual(linkRing)
    expect(linkRing).toEqual({ visible: true, outline: 'solid 2px rgb(156, 207, 216)' })
  })

  for (const [name, viewport, selector, scrolled] of [
    ['a tab of the bar', DESKTOP, '.VPNavBarMenuLink', false],
    [
      'the button of a menu in the bar',
      { width: 1000, height: 800 },
      '.VPNavBarExtra > .button',
      false,
    ],
    ['the search button of the bar on a phone', PHONE, '.VPNavBarSearch .DocSearch-Button', false],
    // the row under the bar sticks to the top of the window once the page scrolls past it
    ['the menu button of the row under the bar on a phone', PHONE, '.VPLocalNav .menu', true],
  ] as const)
    test(`${name} draws it inside, where the top of the window would cut it off`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport)
      await open(page, '/styles/prose')
      await page.keyboard.press('Tab')
      if (scrolled) await page.evaluate(() => window.scrollTo(0, 900))
      const target = page.locator(selector).first()
      await target.focus()
      const ring = await target.evaluate((element) => {
        const style = getComputedStyle(element)
        const box = element.getBoundingClientRect()
        return {
          visible: element.matches(':focus-visible'),
          outline: `${style.outlineStyle} ${style.outlineWidth} ${style.outlineColor}`,
          edge: box.top,
          top: box.top - parseFloat(style.outlineOffset) - parseFloat(style.outlineWidth),
        }
      })
      // the control starts at the top edge of the window, where a ring outside it is cut off
      expect(ring).toMatchObject({
        visible: true,
        outline: 'solid 2px rgb(156, 207, 216)',
        edge: 0,
      })
      expect(ring.top).toBeGreaterThanOrEqual(0)
    })
})

test.describe('links to a section', () => {
  /** The sections the page links to, as the id each link expects by the page it is on. */
  const sections = () => {
    const byPage: Record<string, string[]> = {}
    for (const link of document.querySelectorAll<HTMLAnchorElement>('.vp-doc a[href*="#"]')) {
      if (link.origin !== location.origin || link.hash.length < 2) continue
      ;(byPage[link.pathname] ??= []).push(decodeURIComponent(link.hash.slice(1)))
    }
    return byPage
  }
  const missing = (ids: string[]) => ids.filter((id) => !document.getElementById(id))

  for (const { name, path } of PAGES.filter((entry) => !entry.path.startsWith('/examples/'))) {
    test(`${name}: every one lands on a section that exists`, async ({ page }) => {
      await open(page, path)
      for (const [target, ids] of Object.entries(await page.evaluate(sections))) {
        await page.goto(target)
        expect(await page.evaluate(missing, ids), `sections of ${target}`).toEqual([])
      }
    })
  }
})
