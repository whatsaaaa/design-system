import { expect, test } from '@playwright/test'
import { open } from './pages.ts'

const SERBIAN = 'čćšžđČĆŠŽĐ'
const FACES = [
  ['Inter', '400'],
  ['Inter', 'italic 400'],
  ['Inter', '800'],
  ['JetBrains Mono', '400'],
  ['JetBrains Mono', 'italic 400'],
  ['JetBrains Mono', '800'],
] as const

/**
 * Whether a family draws a text with its own glyphs. A glyph the family lacks comes from
 * the fallback, so the text is as wide with a serif fallback as with a mono one only when
 * every glyph is the family's own.
 */
const drawsItself = ({ family, text, style }: { family: string; text: string; style: string }) => {
  const context = document.createElement('canvas').getContext('2d')!
  const width = (fallback: string) => {
    context.font = `${style} 40px "${family}", ${fallback}`
    return context.measureText(text).width
  }
  return width('serif') === width('monospace')
}

test.describe('the fonts', () => {
  test.beforeEach(async ({ page }) => {
    await open(page, '/tokens/typography')
  })

  for (const [family, style] of FACES) {
    test(`${family} ${style}: Serbian Latin loads the latin-ext file of this site`, async ({
      page,
    }) => {
      const faces = await page.evaluate(
        async ({ font, text }) =>
          (await document.fonts.load(font, text)).map((face) => ({
            family: face.family.replaceAll('"', ''),
            status: face.status,
            range: face.unicodeRange,
          })),
        { font: `${style} 40px "${family}"`, text: SERBIAN },
      )
      expect(faces.length).toBeGreaterThan(0)
      for (const face of faces) expect(face).toMatchObject({ family, status: 'loaded' })
      // č is U+010D, in the range the latin-ext subset declares
      expect(faces.some((face) => /U\+0?100-0?2BA/i.test(face.range))).toBe(true)
    })

    test(`${family} ${style}: Serbian Latin is drawn with the family's own glyphs`, async ({
      page,
    }) => {
      await page.evaluate(({ font, text }) => document.fonts.load(font, text), {
        font: `${style} 40px "${family}"`,
        text: `${SERBIAN} Ljubazni fenjerdžija čađavog lica`,
      })
      // Cyrillic is not shipped. Where the two fallbacks are told apart, the check can be trusted.
      const tellsApart = !(await page.evaluate(drawsItself, { family, text: 'Жж', style }))
      test.skip(
        !tellsApart,
        'this system draws both fallbacks with one font, so widths prove nothing',
      )
      expect(await page.evaluate(drawsItself, { family, text: SERBIAN, style })).toBe(true)
      expect(
        await page.evaluate(drawsItself, {
          family,
          text: 'Ljubazni fenjerdžija čađavog lica',
          style,
        }),
      ).toBe(true)
    })
  }

  test('the specimen on the page is set in the two families', async ({ page }) => {
    const family = (selector: string) =>
      page
        .locator(selector)
        .evaluate((element) => getComputedStyle(element).fontFamily.split(',')[0])
    expect(await family('.serbian .mono-800')).toBe('"JetBrains Mono"')
    expect(await family('.serbian .sans-400')).toBe('Inter')
  })

  test('the fonts come from this site, not from anywhere else', async ({ page }) => {
    const requests: string[] = []
    page.on('request', (request) => requests.push(request.url()))
    await page.reload()
    await page.evaluate(() => document.fonts.ready)
    const fonts = requests.filter((url) => url.endsWith('.woff2'))
    expect(fonts.length).toBeGreaterThan(0)
    for (const url of requests) expect(new URL(url).hostname).toBe('127.0.0.1')
  })
})
