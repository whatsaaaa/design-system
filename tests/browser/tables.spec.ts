import { expect, test } from '@playwright/test'
import { DESKTOP, PAGES, PHONE, open } from './pages.ts'

/**
 * What a table does not do to fit its frame, because the frame scrolls: cut a value inside
 * a word, or squeeze a column until its text stands a word to a line.
 */
const measure = () => {
  const cut: string[] = []
  const squeezed: string[] = []
  for (const cell of document.querySelectorAll('td, th')) {
    for (const code of cell.querySelectorAll('code'))
      if (code.getClientRects().length > 1) cut.push(code.textContent ?? '')
    // cells of running text only: a swatch or a sample in a cell is as tall as it likes
    const text = (cell.textContent ?? '').trim()
    const words = text.split(/\s+/).length
    const inline = [...cell.children].every((child) =>
      getComputedStyle(child).display.startsWith('inline'),
    )
    const lineHeight = parseFloat(getComputedStyle(cell).lineHeight)
    if (words < 4 || !inline || Number.isNaN(lineHeight)) continue
    // the height of the text itself: the cell is as tall as the tallest one in its row
    const content = document.createRange()
    content.selectNodeContents(cell)
    if (Math.round(content.getBoundingClientRect().height / lineHeight) >= words)
      squeezed.push(text)
  }
  return { cut, squeezed }
}

for (const [viewportName, viewport] of [
  ['phone', PHONE],
  ['desktop', DESKTOP],
] as const) {
  test.describe(`tables, ${viewportName}`, () => {
    test.use({ viewport })

    for (const { name, path } of PAGES) {
      test(`${name} keeps its values whole and its columns readable`, async ({ page }) => {
        await open(page, path)
        expect(await page.evaluate(measure)).toEqual({ cut: [], squeezed: [] })
      })
    }
  })
}
