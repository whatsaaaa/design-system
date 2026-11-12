import { fileURLToPath } from 'node:url'
import { createMarkdownRenderer } from 'vitepress'
import { describe, expect, it } from 'vitest'
import { codeTheme } from '../src/shiki/index.ts'
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
})

describe('the base config', () => {
  it('applies the remembered theme before the first paint', () => {
    const [tag, attributes, script] = whatsaaaaConfig().head![0] as [string, object, string]
    expect(tag).toBe('script')
    expect(attributes).toEqual({ id: 'ws-theme' })
    expect(script).toContain("localStorage.getItem('vitepress-theme-appearance')")
    expect(script).toContain('document.documentElement.dataset.theme')
  })

  it('lets the site build the theme from source', () => {
    expect(whatsaaaaConfig().vite?.ssr?.noExternal).toEqual(['@whatsaaaa/design-system'])
  })
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
})
