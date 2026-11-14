// Keeps the comments of the stylesheets through lightningcss, which drops every comment. They
// carry the markup of each piece, which docs/usage.md points to. A comment that stands between
// rules is swapped for a placeholder rule, which lightningcss keeps in its place, and the
// placeholder is swapped back for the comment once the stylesheet is built. A comment inside
// a rule, between its declarations, goes as before.

const PLACEHOLDER = 'ws-build-comment'

/** At-rules whose block holds rules, where a placeholder rule may stand. */
const GROUPING = /^@(?:media|supports|container|layer|scope|starting-style)\b/

/**
 * Swaps each comment of `css` that stands between rules for a placeholder rule, and adds the
 * comment to `held`. One `held` serves every file of a bundle, so the placeholders are unique.
 */
export function holdComments(css: string, held: string[]): string {
  let out = ''
  // for each open block, whether it holds rules: true for a grouping at-rule
  const blocks: boolean[] = []
  // the statement read so far, without its comments
  let statement = ''
  let at = 0
  while (at < css.length) {
    const char = css[at]!
    if (char === '/' && css[at + 1] === '*') {
      const close = css.indexOf('*/', at + 2)
      const end = close === -1 ? css.length : close + 2
      const comment = css.slice(at, end)
      if (statement.trim() === '' && blocks.every(Boolean)) {
        out += `.${PLACEHOLDER}-${held.length} { --${PLACEHOLDER}: ${held.length} }`
        held.push(comment)
      } else out += comment
      at = end
      continue
    }
    if (char === '"' || char === "'") {
      let end = at + 1
      while (end < css.length && css[end] !== char) end += css[end] === '\\' ? 2 : 1
      const string = css.slice(at, end + 1)
      out += string
      statement += string
      at = end + 1
      continue
    }
    out += char
    if (char === '{') {
      blocks.push(GROUPING.test(statement.trim()))
      statement = ''
    } else if (char === '}') {
      blocks.pop()
      statement = ''
    } else if (char === ';') statement = ''
    else statement += char
    at++
  }
  return out
}

/**
 * Puts the comments back where `holdComments` left their placeholders in the built `css`,
 * at the indent of the placeholder and right above the rule after it.
 */
export function restoreComments(css: string, held: string[]): string {
  const restored = new Set<number>()
  const out = css.replace(
    new RegExp(
      // the blank line after it goes, unless another comment follows
      `^([ \\t]*)\\.${PLACEHOLDER}-(\\d+) \\{\\n[ \\t]*--${PLACEHOLDER}: \\d+;?\\n[ \\t]*\\}\\n(?:\\n(?![ \\t]*\\.${PLACEHOLDER}-))?`,
      'gm',
    ),
    (_match, indent: string, index: string) => {
      restored.add(Number(index))
      return `${indent}${held[Number(index)]}\n`
    },
  )
  if (out.includes(PLACEHOLDER) || restored.size !== held.length)
    throw new Error('a comment of the stylesheets did not come through the build')
  return out
}
