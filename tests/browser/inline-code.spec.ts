import { expect, test } from '@playwright/test'
import { DESKTOP, NARROWEST, PAGES, PHONE, TABLET, open } from './pages.ts'

/**
 * Where inline code breaks over lines. A line does not break next to a hyphen inside a word,
 * where --ws-field-* would read as - and -ws-field-*, or @whatsaaaa/design- as a name of
 * its own. Code too long for a line still breaks, elsewhere. Each chip is given as its lines.
 */
const measure = () => {
  const chips: string[][] = []
  const range = document.createRange()
  for (const code of document.querySelectorAll(':not(pre) > code')) {
    const lines: string[] = []
    let top: number | undefined
    const texts = document.createTreeWalker(code, NodeFilter.SHOW_TEXT)
    while (texts.nextNode()) {
      const node = texts.currentNode as Text
      for (let index = 0; index < node.data.length; index++) {
        range.setStart(node, index)
        range.setEnd(node, index + 1)
        const box = range.getBoundingClientRect()
        if (box.width === 0) continue
        if (top === undefined || box.top > top + box.height / 2) lines.push(node.data[index]!)
        else lines.push(lines.pop()! + node.data[index])
        top = box.top
      }
    }
    if (lines.length) chips.push(lines)
  }
  return chips
}

/** The two lines around each break next to a hyphen in a word, as `before | after`. */
const atHyphens = (chips: string[][]) =>
  chips.flatMap((lines) =>
    lines.slice(1).flatMap((line, index) => {
      const before = lines[index]!
      const inWord = /\S-$/.test(before) || (line.startsWith('-') && /\S$/.test(before))
      return inWord ? [`${before} | ${line}`] : []
    }),
  )

for (const [viewportName, viewport] of [
  ['narrowest phone', NARROWEST],
  ['phone', PHONE],
  ['tablet', TABLET],
  ['desktop', DESKTOP],
] as const) {
  // the themes lay text out alike, so one of them is enough
  test.describe(viewportName, () => {
    test.use({ viewport })

    // the examples are plain pages, whose inline code no docs theme marks
    for (const { name, path } of PAGES.filter(({ path }) => !path.startsWith('/examples/')))
      test(`${name} breaks no inline code at a hyphen`, async ({ page }) => {
        await open(page, path)
        expect(atHyphens(await page.evaluate(measure))).toEqual([])
      })

    test('a token pattern stays whole, and a package path breaks only after a slash', async ({
      page,
    }) => {
      await open(page, '/components/select')
      const chips = await page.evaluate(measure)
      expect(chips).toContainEqual(['--ws-field-*'])
      const path = chips.find((lines) => lines.join('').endsWith('/specs/select.spec.json'))!
      expect(path.join('')).toBe('@whatsaaaa/design-system/specs/select.spec.json')
      for (const line of path.slice(0, -1)) expect(line).toMatch(/\/$/)
    })
  })
}

test('inline code copies as the code itself', async ({ page }) => {
  await page.setViewportSize(NARROWEST)
  await open(page, '/components/select')
  const copied = await page.evaluate(() =>
    [...document.querySelectorAll('.vp-doc p > code')].map((code) => {
      const selection = getSelection()!
      selection.selectAllChildren(code)
      return [selection.toString(), code.textContent]
    }),
  )
  expect(copied.length).toBeGreaterThan(0)
  for (const [text, code] of copied) expect(text).toBe(code)
})
