import { expect, test } from '@playwright/test'
import { DESKTOP, PAGES, PHONE, open } from './pages.ts'

/**
 * What a table does not do in its frame. The frame scrolls, so the table does not fit by
 * cutting a value inside a word or by squeezing a column until its text stands a word or
 * two to a line. And a table whose content fits the frame does not make it scroll.
 */
const measure = () => {
  const cut: string[] = []
  const squeezed: string[] = []
  const scrolling: string[] = []
  const contentWidth = (cell: Element) => {
    const content = document.createRange()
    content.selectNodeContents(cell)
    const style = getComputedStyle(cell)
    return (
      content.getBoundingClientRect().width +
      parseFloat(style.paddingLeft) +
      parseFloat(style.paddingRight)
    )
  }
  for (const cell of document.querySelectorAll('td, th')) {
    for (const code of cell.querySelectorAll('code'))
      if (code.getClientRects().length > 1) cut.push(code.textContent ?? '')
    // cells of running text only: a swatch or a sample in a cell is as tall as it likes,
    // and values in code may stand one to a line
    const text = (cell.textContent ?? '').trim()
    const words = text.split(/\s+/).length
    const prose = cell.cloneNode(true) as Element
    for (const code of prose.querySelectorAll('code')) code.remove()
    const running = (prose.textContent ?? '').split(/\s+/).filter((word) => /\p{L}/u.test(word))
    const inline = [...cell.children].every((child) =>
      getComputedStyle(child).display.startsWith('inline'),
    )
    const lineHeight = parseFloat(getComputedStyle(cell).lineHeight)
    if (running.length < 2 || !inline || Number.isNaN(lineHeight)) continue
    // the height of the text itself: the cell is as tall as the tallest one in its row
    const content = document.createRange()
    content.selectNodeContents(cell)
    const lines = Math.round(content.getBoundingClientRect().height / lineHeight)
    // a word to a line, or in a longer text without values fewer than two words to a line
    const sentence = words >= 6 && running.length === words
    if (lines >= words || (sentence && lines * 2 > words)) squeezed.push(text)
  }
  for (const table of document.querySelectorAll<HTMLTableElement>('.ws-table > table')) {
    const frame = table.parentElement!
    // the room the content asks for: in each column, the widest cell
    const columns: number[] = []
    for (const row of table.rows)
      [...row.cells].forEach((cell, index) => {
        columns[index] = Math.max(columns[index] ?? 0, contentWidth(cell))
      })
    const needed = columns.reduce((sum, width) => sum + width, 0)
    if (needed <= frame.clientWidth && frame.scrollWidth > frame.clientWidth)
      scrolling.push([...table.rows[0]!.cells].map((cell) => cell.textContent).join(' | '))
  }
  return { cut, squeezed, scrolling }
}

for (const [viewportName, viewport] of [
  ['phone', PHONE],
  ['desktop', DESKTOP],
] as const) {
  test.describe(`tables, ${viewportName}`, () => {
    test.use({ viewport })

    for (const { name, path } of PAGES) {
      test(`${name} keeps its values whole, its columns readable and its frames still`, async ({
        page,
      }) => {
        await open(page, path)
        expect(await page.evaluate(measure)).toEqual({ cut: [], squeezed: [], scrolling: [] })
      })
    }
  })
}

test.describe('the two kinds of table on a phone', () => {
  test.use({ viewport: PHONE })

  const frameOf = (page: import('@playwright/test').Page, heading: string) =>
    page.locator(`h2:has-text("${heading}") ~ .ws-table`).first()
  const widths = (frame: Element) => ({
    frame: frame.clientWidth,
    scrolls: frame.scrollWidth - frame.clientWidth,
    table: Math.round(frame.querySelector('table')!.getBoundingClientRect().width),
  })

  test('a small table fills its frame and does not scroll', async ({ page }) => {
    await open(page, '/tokens/space')
    const { frame, scrolls, table } = await frameOf(page, 'Space').evaluate(widths)
    expect(scrolls).toBe(0)
    expect(table).toBe(frame)
  })

  test('a table with long text scrolls in its frame, and the page stays still', async ({
    page,
  }) => {
    await open(page, '/')
    const { scrolls } = await frameOf(page, 'What is in it').evaluate(widths)
    expect(scrolls).toBeGreaterThan(0)
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      ),
    ).toBe(0)
  })

  for (const [path, heading] of [
    ['/styles/prose', 'Outside VitePress'],
    ['/styles/terminal', 'Small pieces'],
  ] as const) {
    test(`a long first cell wraps on ${path}, so the text next to it is on screen`, async ({
      page,
    }) => {
      await open(page, path)
      const { first, outside } = await frameOf(page, heading).evaluate((frame) => {
        const edge = frame.getBoundingClientRect()
        const rows = [...frame.querySelectorAll<HTMLTableRowElement>('tbody tr')]
        const linesOf = (cell: Element) => {
          const content = document.createRange()
          content.selectNodeContents(cell)
          return Math.round(
            content.getBoundingClientRect().height / parseFloat(getComputedStyle(cell).lineHeight),
          )
        }
        return {
          // each first cell: its text and the lines it takes
          first: rows.map((row) => ({
            text: row.cells[0]!.textContent!.trim(),
            lines: linesOf(row.cells[0]!),
          })),
          // the cells of the text column that reach past the frame before it is scrolled
          outside: rows
            .map((row) => row.cells[1]!)
            .filter((cell) => {
              const box = cell.getBoundingClientRect()
              return box.left < edge.left || box.right > edge.right + 0.5
            })
            .map((cell) => cell.textContent),
        }
      })
      expect(outside).toEqual([])
      // a short name stays on one line, the one that reads as a sentence wraps
      for (const { text, lines } of first) if (!text.includes(' ')) expect(lines, text).toBe(1)
      expect(Math.max(...first.map(({ lines }) => lines))).toBeGreaterThan(1)
    })
  }
})
