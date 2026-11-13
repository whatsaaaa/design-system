import { fileURLToPath } from 'node:url'
import { createMarkdownRenderer } from 'vitepress'
import { describe, expect, it } from 'vitest'
import { codeTheme } from '../src/shiki/index.ts'
import { themeColorScript } from '../src/theme/color.ts'
import { whatsaaaaConfig, whatsaaaaMarkdown } from '../src/vitepress-config/index.ts'
import { isActiveLink } from '../src/vitepress/support.ts'
import { hex } from '../scripts/lib/tokens.ts'

const root = fileURLToPath(new URL('../styleguide', import.meta.url))
const renderer = () => createMarkdownRenderer(root, whatsaaaaConfig().markdown)

describe('markdown in the docs theme', () => {
  it('shows the file name of a code block in its caption', async () => {
    const html = (await renderer()).render('```ts [conditions.ts]\nconst a = 1\n```')
    expect(html).toMatch(
      /^<div class="language-ts[^"]*"><span class="ws-code-title">conditions\.ts<\/span>/,
    )
    expect(html).toContain('<span class="lang">ts</span>')
  })

  it('leaves a code block without a file name as it is', async () => {
    const html = (await renderer()).render('```ts\nconst a = [1]\n```')
    expect(html).not.toContain('ws-code-title')
  })

  it('escapes a file name', async () => {
    const html = (await renderer()).render('```html [<b>.html]\n<p>\n```')
    expect(html).toContain('<span class="ws-code-title">&lt;b&gt;.html</span>')
  })

  it('frames a table so it scrolls by itself', async () => {
    const html = (await renderer()).render('| a | b |\n| --- | --- |\n| 1 | 2 |')
    expect(html).toMatch(/^<div class="ws-table"><table/)
    expect(html.trim()).toMatch(/<\/table>\s*<\/div>$/)
  })

  it('marks the cells of running text in a table, and leaves cells of short values alone', async () => {
    const html = (await renderer()).render(
      [
        '| Operator | Value | True when the field |',
        '| --- | --- | --- |',
        '| `equals` | a string, number or boolean | holds the value |',
        '| `empty` | [Rezervacije](/vodic/rezervacije-u-kafani) | not shown |',
      ].join('\n'),
    )
    const cells = [...html.matchAll(/<td([^>]*)>(.*?)<\/td>/g)].map(([, attributes, content]) => [
      content!.replace(/<[^>]+>/g, ''),
      attributes!.includes('class="ws-table__text"'),
    ])
    expect(cells).toEqual([
      ['equals', false],
      ['a string, number or boolean', true],
      ['holds the value', false],
      ['empty', false],
      // a link counts by its text, not by its address
      ['Rezervacije', false],
      ['not shown', false],
    ])
  })

  it('keeps a class the author gave a cell, whatever the length of its text', async () => {
    const html = (await renderer()).render(
      [
        '| Vrednost | Opis |',
        '| --- | --- |',
        '| kratko {.mine} | sto za četvoro u Čačku, u petak u osam {.mine} |',
      ].join('\n'),
    )
    const classes = [...html.matchAll(/<td class="([^"]*)"/g)].map(([, names]) =>
      names!.split(' ').sort(),
    )
    expect(classes).toEqual([['mine'], ['mine', 'ws-table__text']])
  })

  it('can be added to a site that has its own markdown setup', async () => {
    const md = await createMarkdownRenderer(root, {
      config: (instance) => whatsaaaaMarkdown(instance),
    })
    expect(md.render('| a |\n| --- |\n| 1 |')).toContain('<div class="ws-table">')
  })

  it('highlights with the code theme, one for both page themes', async () => {
    const html = (await renderer()).render("```ts\nconst name = 'Milica'\n```")
    expect(html).toContain(`color:${hex('syntax.keyword').toUpperCase()}`)
    expect(html).toContain(`color:${hex('syntax.string').toUpperCase()}`)
    expect(html).not.toContain('--shiki-dark')
  })

  it('highlights the HTML in a Markdown block, also before any HTML block of the site', async () => {
    // the first block this renderer highlights, so no HTML block has loaded the HTML grammar
    const html = (await renderer()).render('```md\n<img src="./header.svg" alt="" />\n```')
    expect(html).toContain(`color:${hex('syntax.type').toUpperCase()}">img<`)
  })
})

describe('the scripts the base config puts in the head', () => {
  /**
   * Runs every head script of the config in a page, in their order, and returns what they
   * set on <html>. `remembered` is what the browser's storage holds, or `blocked` for a
   * browser that refuses storage.
   */
  function pageAfter(remembered: Record<string, string> | 'blocked', system: 'dark' | 'light') {
    const page = { documentElement: { dataset: {} as Record<string, string> } }
    const storage = {
      getItem: (key: string) => {
        if (remembered === 'blocked') throw new Error('blocked')
        return remembered[key] ?? null
      },
    }
    const matchMedia = (query: string) => ({
      matches: query === `(prefers-color-scheme: ${system})`,
      addEventListener: () => {},
    })
    // what the scripts reach for. The theme-color script only starts listening here: it acts
    // once the stylesheet is there, which the theme module's tests show in a page
    const globals = {
      document: page,
      localStorage: storage,
      window: { matchMedia },
      matchMedia,
      MutationObserver: class {
        observe() {}
      },
      requestAnimationFrame: () => 0,
      addEventListener: () => {},
    }
    for (const [tag, , script] of whatsaaaaConfig().head as [string, object, string][]) {
      expect(tag).toBe('script')
      new Function(...Object.keys(globals), script)(...Object.values(globals))
    }
    return page.documentElement.dataset
  }

  it.each([
    ['light', 'dark', 'light'],
    ['dark', 'light', 'dark'],
    ['auto', 'dark', 'dark'],
    ['auto', 'light', 'light'],
    [null, 'dark', 'dark'],
    [null, 'light', 'light'],
  ] as const)('with %s remembered on a %s system set the theme %s', (remembered, system, theme) => {
    const storage: Record<string, string> = {}
    if (remembered) storage['vitepress-theme-appearance'] = remembered
    expect(pageAfter(storage, system).theme).toBe(theme)
  })

  it('mark a page whose keys are remembered as off, and no other', () => {
    expect(pageAfter({ 'ws-keys': 'off' }, 'dark').wsKeys).toBe('off')
    expect(pageAfter({}, 'dark').wsKeys).toBeUndefined()
    expect(pageAfter({ 'vitepress-theme-appearance': 'light' }, 'dark').wsKeys).toBeUndefined()
  })

  it("keep the color of the browser's own bars in step with the theme VitePress switches", () => {
    const scripts = (whatsaaaaConfig().head as [string, object, string][]).map(([, , s]) => s)
    expect(scripts).toContain(themeColorScript)
  })

  it.each(['dark', 'light'] as const)(
    'follow a %s system and leave the keys on where storage is refused',
    (system) => {
      expect(pageAfter('blocked', system)).toEqual({ theme: system })
    },
  )
})

describe('the code theme', () => {
  it('takes its colors from the tokens', () => {
    expect(codeTheme.type).toBe('dark')
    expect(codeTheme.colors['editor.background']).toBe(hex('code.bg'))
    expect(codeTheme.colors['editor.foreground']).toBe(hex('code.text'))
    // Shiki adds a rule without a scope to a theme it has loaded
    const colorOf = (scope: string) =>
      codeTheme.tokenColors.find((rule) => rule.scope?.includes(scope))?.settings.foreground
    expect(colorOf('keyword')).toBe(hex('syntax.keyword'))
    expect(colorOf('string')).toBe(hex('syntax.string'))
    expect(colorOf('comment')).toBe(hex('syntax.comment'))
  })
})

describe('the active link', () => {
  it.each([
    ['guide/conditions.md', '/guide/conditions', true],
    ['guide/conditions.md', '/guide/conditions.html', true],
    ['guide/index.md', '/guide/', true],
    ['index.md', '/', true],
    ['guide/conditions.md', '/guide/', false],
    ['guide/conditions.md', '/guide/condition', false],
  ])('%s and %s: %s', (page, link, active) => {
    expect(isActiveLink(page, link)).toBe(active)
  })

  it('matches a pattern for a tab that covers a section', () => {
    expect(isActiveLink('guide/conditions.md', '^/guide/', true)).toBe(true)
    expect(isActiveLink('api/index.md', '^/guide/', true)).toBe(false)
  })

  it('matches that pattern on the index page of the section, as the nav bar does', () => {
    expect(isActiveLink('guide/index.md', '^/guide/', true)).toBe(true)
    expect(isActiveLink('index.md', '^/guide/', true)).toBe(false)
  })

  it('takes a page for what it is called, not for a name that ends like an index', () => {
    expect(isActiveLink('guide/reindex.md', '/guide/reindex')).toBe(true)
    expect(isActiveLink('guide/reindex.md', '/guide/re')).toBe(false)
  })
})
