// What the docs theme needs from the Markdown renderer. VitePress renders with markdown-it.
import type { MarkdownRenderer } from 'vitepress'

/**
 * Shows the file name of a code block in its caption: ```ts [conditions.ts]
 * VitePress reads that bracket only inside a code group and drops it elsewhere.
 */
function codeTitle(md: MarkdownRenderer) {
  const fence = md.renderer.rules.fence!
  md.renderer.rules.fence = (tokens, index, options, env, self) => {
    const title = /\[(.+?)\]/.exec(tokens[index]!.info)?.[1]
    const html = fence(tokens, index, options, env, self)
    if (!title) return html
    // the title goes right inside the block's wrapper, where the styles pick it up
    return html.replace(
      /^(<div class="language-[^"]*">)/,
      `$1<span class="ws-code-title">${md.utils.escapeHtml(title)}</span>`,
    )
  }
}

/** Puts every table in a frame that scrolls sideways, so a wide table never widens the page. */
function tableFrame(md: MarkdownRenderer) {
  type Rule = NonNullable<MarkdownRenderer['renderer']['rules'][string]>
  const plain: Rule = (tokens, index, options, _env, self) =>
    self.renderToken(tokens, index, options)
  const open = md.renderer.rules.table_open ?? plain
  const close = md.renderer.rules.table_close ?? plain
  md.renderer.rules.table_open = (...args) => `<div class="ws-table">${open(...args)}`
  md.renderer.rules.table_close = (...args) => `${close(...args)}</div>`
}

/**
 * The markdown-it setup of the docs theme. The base config applies it. A site with its own
 * `markdown.config` calls it there: `config: (md) => { whatsaaaaMarkdown(md); ... }`.
 */
export function whatsaaaaMarkdown(md: MarkdownRenderer): void {
  codeTitle(md)
  tableFrame(md)
}
