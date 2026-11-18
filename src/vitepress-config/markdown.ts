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

/** A piece of inline code: plain text, hyphens held to their neighbors, or a place to break. */
export type CodePart = { kind: 'text' | 'joined'; text: string } | { kind: 'break' }

/**
 * Splits inline code where its line breaks are decided. A browser breaks code after any
 * hyphen, where --ws-field-* would read as - and -ws-field-*, and never after the slashes of
 * a path. So each run of hyphens is joined to the characters on both sides of it, which the
 * prose styles keep on one line, and a slash between two parts of a path is followed by a break.
 */
export function codeParts(code: string): CodePart[] {
  const parts: CodePart[] = []
  let rest = 0
  for (const match of code.matchAll(/[^\s-]?(?:-+[^\s-])*-+[^\s-]?|(?<=[^\s/])\/+(?=[^\s/])/gu)) {
    if (match.index > rest) parts.push({ kind: 'text', text: code.slice(rest, match.index) })
    if (match[0].includes('-')) parts.push({ kind: 'joined', text: match[0] })
    else parts.push({ kind: 'text', text: match[0] }, { kind: 'break' })
    rest = match.index + match[0].length
  }
  if (rest < code.length) parts.push({ kind: 'text', text: code.slice(rest) })
  return parts
}

/** Inline code with its hyphens held: <code>dat<span class="ws-code-joined">a-s</span>pec</code> */
function codeInline(md: MarkdownRenderer) {
  const defaultCodeInline = md.renderer.rules.code_inline!
  md.renderer.rules.code_inline = (tokens, index, options, env, self) => {
    const token = tokens[index]!
    // a Vue interpolation is an expression on the page, which markup in it would break
    if (token.content.includes('{{')) return defaultCodeInline(tokens, index, options, env, self)
    const html = codeParts(token.content).map((part) => {
      if (part.kind === 'break') return '<wbr>'
      const text = md.utils.escapeHtml(part.text)
      return part.kind === 'joined' ? `<span class="ws-code-joined">${text}</span>` : text
    })
    return `<code${self.renderAttrs(token)}>${html.join('')}</code>`
  }
}

/**
 * A cell with more characters than this is running text. It is about what one line holds
 * at the width the styles keep for such a cell, so the mark never widens a cell of short values.
 */
const TEXT_CELL = 21

/**
 * Puts every table in a frame that scrolls sideways, so a wide table never widens the page,
 * and marks its cells of running text, which the styles keep from being squeezed and let
 * wrap where they come first in a row.
 */
function tableFrame(md: MarkdownRenderer) {
  type Rule = NonNullable<MarkdownRenderer['renderer']['rules'][string]>
  const plain: Rule = (tokens, index, options, _env, self) =>
    self.renderToken(tokens, index, options)
  const open = md.renderer.rules.table_open ?? plain
  const close = md.renderer.rules.table_close ?? plain
  const cell = md.renderer.rules.td_open ?? plain
  md.renderer.rules.table_open = (...args) => `<div class="ws-table">${open(...args)}`
  md.renderer.rules.table_close = (...args) => `${close(...args)}</div>`
  md.renderer.rules.td_open = (tokens, index, ...rest) => {
    // the cell's content is the token after the one that opens it
    const text = (tokens[index + 1]?.children ?? [])
      .map((part) => (part.type === 'text' || part.type === 'code_inline' ? part.content : ''))
      .join('')
    if (text.length > TEXT_CELL) tokens[index]!.attrJoin('class', 'ws-table__text')
    return cell(tokens, index, ...rest)
  }
}

/**
 * The markdown-it setup of the docs theme. The base config applies it. A site with its own
 * `markdown.config` calls it there: `config: (md) => { whatsaaaaMarkdown(md); ... }`.
 */
export function whatsaaaaMarkdown(md: MarkdownRenderer): void {
  codeTitle(md)
  codeInline(md)
  tableFrame(md)
}
