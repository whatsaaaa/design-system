import { codeToHtml } from 'shiki'
import { describe, expect, it } from 'vitest'
import { codeTheme, hangingIndent } from '../src/shiki/index.ts'

const hangs = (html: string) =>
  [...html.matchAll(/<span class="line"[^>]*?--ws-code-hang:(\d+)/g)].map(([, hang]) =>
    Number(hang),
  )

describe('the hanging indent of a code block that wraps', () => {
  it('is the indent of each line plus two, a tab counted as two', async () => {
    const html = await codeToHtml('{\n  "note": {\n\t\t"text": "a"\n  }\n}', {
      lang: 'json',
      theme: codeTheme,
      transformers: [hangingIndent()],
    })
    expect(hangs(html)).toEqual([2, 4, 6, 4, 2])
  })

  it('follows each block when one transformer highlights several', async () => {
    const transformer = hangingIndent()
    const highlight = (code: string) =>
      codeToHtml(code, { lang: 'json', theme: codeTheme, transformers: [transformer] })
    expect(hangs(await highlight('[\n    1\n]'))).toEqual([2, 6, 2])
    expect(hangs(await highlight('[\n1\n]'))).toEqual([2, 2, 2])
  })

  it('keeps a style a line already has', async () => {
    const html = await codeToHtml('a', {
      lang: 'text',
      theme: codeTheme,
      transformers: [
        {
          line(node) {
            node.properties.style = 'color:red'
          },
        },
        hangingIndent(),
      ],
    })
    expect(html).toContain('style="color:red;--ws-code-hang:2"')
  })
})
