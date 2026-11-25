import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { gallery } from './spec-gallery.ts'

/**
 * axe's contrast rule over the plain gallery, in each theme: any text the gallery draws, of
 * whatever tokens it is made of, holds the contrast WCAG asks of it on what is painted behind it.
 * A pair the contrast table does not list, a tint over another fill than the page, a component
 * inside another's fill: the check of the tokens does not see these, and this one does.
 */
for (const theme of ['dark', 'light'] as const) {
  test(`every text of the spec gallery holds its contrast in the ${theme} theme`, async ({
    browser,
  }) => {
    const { context, page } = await gallery(browser)
    // the theme as the parity helper puts it: on <html>, with the system's scheme to match
    await page.emulateMedia({ colorScheme: theme })
    await page.evaluate(
      (theme) => document.documentElement.setAttribute('data-theme', theme),
      theme,
    )

    const { violations, passes } = await new AxeBuilder({ page })
      .withRules(['color-contrast'])
      .analyze()
    await context.close()

    const failing = violations.flatMap(({ nodes }) =>
      nodes.map(({ target, any }) => {
        const data = any[0]?.data as
          | {
              contrastRatio: number
              expectedContrastRatio: string
              fgColor: string
              bgColor: string
            }
          | undefined
        return data
          ? `${target.join(' ')}: ${data.contrastRatio}:1, needs ${data.expectedContrastRatio} ` +
              `(${data.fgColor} on ${data.bgColor})`
          : `${target.join(' ')}: ${any[0]?.message}`
      }),
    )
    expect(failing, `${failing.length} texts below their contrast in the ${theme} theme`).toEqual(
      [],
    )
    // the rule measured the gallery, and did not pass for finding no text
    expect(passes.flatMap(({ nodes }) => nodes).length).toBeGreaterThan(0)
  })
}
