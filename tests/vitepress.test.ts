import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { Window } from 'happy-dom'
import { createMarkdownRenderer } from 'vitepress'
import { describe, expect, it, vi } from 'vitest'
import { codeTheme } from '../src/shiki/index.ts'
import { whatsaaaaConfig, whatsaaaaMarkdown } from '../src/vitepress-config/index.ts'
import { codeParts } from '../src/vitepress-config/markdown.ts'
import { isActiveLink } from '../src/vitepress/support.ts'
import { hex } from '../scripts/lib/tokens.ts'

const root = fileURLToPath(new URL('../styleguide', import.meta.url))
const renderer = () => createMarkdownRenderer(root, whatsaaaaConfig().markdown)

describe('markdown in the docs theme', () => {
  // The first renderer of the file loads the highlighter with its languages: seconds beside
  // other builds.
  it('shows the file name of a code block in its caption', async () => {
    const html = (await renderer()).render('```ts [conditions.ts]\nconst a = 1\n```')
    expect(html).toMatch(
      /^<div class="language-ts[^"]*"><span class="ws-code-title">conditions\.ts<\/span>/,
    )
    expect(html).toContain('<span class="lang">ts</span>')
  }, 30_000)

  it('leaves a code block without a file name as it is', async () => {
    const html = (await renderer()).render('```ts\nconst a = [1]\n```')
    expect(html).not.toContain('ws-code-title')
  })

  it('escapes a file name', async () => {
    const html = (await renderer()).render('```html [<b>.html]\n<p>\n```')
    expect(html).toContain('<span class="ws-code-title">&lt;b&gt;.html</span>')
  })

  it('holds the hyphens of inline code, and breaks a path after its slashes', async () => {
    const html = (await renderer()).render(
      'The `--ws-field-*` tokens, in `@whatsaaaa/design-system/specs/button.spec.json`.',
    )
    expect(html).toContain(
      '<code><span class="ws-code-joined">--w</span><span class="ws-code-joined">s-f</span>iel<span class="ws-code-joined">d-*</span></code>',
    )
    expect(html).toContain(
      '<code>@whatsaaaa/<wbr>desig<span class="ws-code-joined">n-s</span>ystem/<wbr>specs/<wbr>button.spec.json</code>',
    )
  })

  it('escapes inline code around the marks', async () => {
    const html = (await renderer()).render('`<a href="/x">` and `a -- b`')
    expect(html).toContain('<code>&lt;a href=&quot;/<wbr>x&quot;&gt;</code>')
    expect(html).toContain('<code>a <span class="ws-code-joined">--</span> b</code>')
  })

  it('leaves a Vue interpolation in inline code as it is, so the page still compiles', async () => {
    const html = (await renderer()).render(
      "`{{ count-1 }}` and `{{ $frontmatter['package-name'] }}`",
    )
    expect(html).toContain('<code>{{ count-1 }}</code>')
    expect(html).toContain("<code>{{ $frontmatter['package-name'] }}</code>")
  })

  it('keeps a character outside the basic plane whole next to a hyphen', () => {
    for (const code of ['🎉-party', 'x-𝑥', '--𝑥'])
      for (const part of codeParts(code))
        // in u mode a pair is one character, so the class matches only half of one
        if (part.kind !== 'break') expect(part.text, code).not.toMatch(/[\uD800-\uDFFF]/u)
  })

  it('splits inline code with nothing lost', () => {
    const text = (code: string) =>
      codeParts(code)
        .map((part) => (part.kind === 'break' ? '' : part.text))
        .join('')
    for (const code of ['/a//b/', 'https://example.com/a', '--ws-*', 'a-', '-', '', 'a -- b'])
      expect(text(code)).toBe(code)
    // a slash breaks only between two parts of a path
    expect(codeParts('/components/button').filter((part) => part.kind === 'break')).toHaveLength(1)
    expect(codeParts('a / b').filter((part) => part.kind === 'break')).toHaveLength(0)
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

describe('the tags the base config puts in the head', () => {
  it('give the page the color of each theme as it is sent, dark first and light for a light system', () => {
    const tags = whatsaaaaConfig().head!.filter(([tag]) => tag === 'meta')
    expect(tags).toEqual([
      [
        'meta',
        {
          name: 'theme-color',
          content: hex('color.bg', 'dark'),
          media: 'not all and (prefers-color-scheme: light)',
        },
      ],
      [
        'meta',
        {
          name: 'theme-color',
          content: hex('color.bg', 'light'),
          media: '(prefers-color-scheme: light)',
        },
      ],
    ])
  })
})

describe('the scripts the base config puts in the head', () => {
  const tokens = readFileSync(new URL('../dist/tokens.css', import.meta.url), 'utf8')

  /**
   * Puts the tags of the config in the head of a page that has the token stylesheet, and runs
   * each script among them in their order. Returns its <html>. `remembered` is what the browser's storage holds,
   * or `blocked` for a browser that refuses storage.
   */
  function pageAfter(remembered: Record<string, string> | 'blocked', system: 'dark' | 'light') {
    const window = new Window({ settings: { device: { prefersColorScheme: system } } })
    const style = window.document.createElement('style')
    style.textContent = tokens
    window.document.head.append(style)
    const storage = {
      getItem: (key: string) => {
        if (remembered === 'blocked') throw new Error('blocked')
        return remembered[key] ?? null
      },
    }
    // what the scripts reach for, from the page but for the storage
    const globals = {
      window,
      document: window.document,
      localStorage: storage,
      matchMedia: window.matchMedia,
      getComputedStyle: window.getComputedStyle,
      MutationObserver: window.MutationObserver,
      requestAnimationFrame: window.requestAnimationFrame,
      addEventListener: window.addEventListener,
    }
    for (const [tag, attributes, script] of whatsaaaaConfig().head as [
      string,
      Record<string, string>,
      string?,
    ][]) {
      if (tag === 'script') {
        new Function(...Object.keys(globals), script!)(...Object.values(globals))
        continue
      }
      expect(tag).toBe('meta')
      const meta = window.document.createElement('meta')
      for (const [name, value] of Object.entries(attributes)) meta.setAttribute(name, value)
      window.document.head.append(meta)
    }
    return window.document.documentElement
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
    expect(pageAfter(storage, system).dataset.theme).toBe(theme)
  })

  it('mark the keys off where they are remembered so, and pending until the module runs', () => {
    expect(pageAfter({ 'ws-keys': 'off' }, 'dark').dataset.wsKeys).toBe('off')
    expect(pageAfter({}, 'dark').dataset.wsKeys).toBe('pending')
    expect(pageAfter({ 'vitepress-theme-appearance': 'light' }, 'dark').dataset.wsKeys).toBe(
      'pending',
    )
  })

  it("keep the color of the browser's own bars at the background of the theme shown", async () => {
    const root = pageAfter({ 'vitepress-theme-appearance': 'light' }, 'dark')
    const colors = () =>
      [...root.ownerDocument.querySelectorAll('meta[name="theme-color"]')].map((tag) =>
        tag.getAttribute('content'),
      )
    // both tags, whatever their media, take the theme shown
    await vi.waitFor(() =>
      expect(colors()).toEqual([hex('color.bg', 'light'), hex('color.bg', 'light')]),
    )
    // as the docs theme does, from VitePress's own switch
    root.dataset.theme = 'dark'
    await vi.waitFor(() =>
      expect(colors()).toEqual([hex('color.bg', 'dark'), hex('color.bg', 'dark')]),
    )
  })

  it.each(['dark', 'light'] as const)(
    'follow a %s system and leave the keys on where storage is refused',
    (system) => {
      // pending is on to come, once the module runs
      expect({ ...pageAfter('blocked', system).dataset }).toEqual({
        theme: system,
        wsKeys: 'pending',
      })
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
