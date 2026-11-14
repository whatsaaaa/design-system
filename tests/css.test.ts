import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { transform } from 'lightningcss'
import { describe, expect, it } from 'vitest'
import { holdComments, restoreComments } from '../scripts/lib/css-comments.ts'

const root = fileURLToPath(new URL('..', import.meta.url))
const read = (path: string) => readFileSync(join(root, path), 'utf8')

/**
 * The comments of a source stylesheet that stand between its rules, read line by line: each
 * comment that opens a line at the top of the file or in the block of an at-rule.
 */
const between = (css: string) => {
  const comments: string[] = []
  // for each open block, whether it is an at-rule's
  const blocks: boolean[] = []
  const lines = css.split('\n')
  for (let line = 0; line < lines.length; line++) {
    const text = lines[line]!.trim()
    if (text.startsWith('/*')) {
      let end = line
      while (!lines[end]!.includes('*/')) end++
      if (blocks.every(Boolean)) comments.push(lines.slice(line, end + 1).join('\n'))
      line = end
    } else if (text.endsWith('{')) blocks.push(text.startsWith('@'))
    else if (text.startsWith('}')) blocks.pop()
  }
  return comments
}

/** Builds as scripts/build-css.ts does, without the imports. */
const build = (css: string) => {
  const held: string[] = []
  const { code } = transform({
    filename: 'test.css',
    code: Buffer.from(holdComments(css, held)),
    drafts: { customMedia: true },
    minify: false,
  })
  return restoreComments(code.toString(), held)
}

describe('the built stylesheets', () => {
  const sources = readdirSync(join(root, 'src/css')).filter((file) => file.endsWith('.css'))

  it.each(sources)('keep the comments between the rules of %s', (file) => {
    const comments = between(read(`src/css/${file}`))
    expect(comments.length).toBeGreaterThan(0)
    // breakpoints.css only declares a custom media query, so it ships inside the others
    const built = ['index.css', 'breakpoints.css'].includes(file)
      ? ['dist/index.css']
      : ['dist/index.css', `dist/css/${file}`]
    // a comment in a block is indented as the block is
    const flat = (text: string) => text.replaceAll(/^[ \t]+/gm, '')
    for (const path of built) {
      const css = flat(read(path))
      for (const comment of comments) expect(css, path).toContain(flat(comment))
    }
  })

  it('carry the markup of each piece', () => {
    const terminal = read('dist/css/terminal.css')
    expect(terminal).toContain(' *   <header class="ws-tab-bar">')
    expect(terminal).toContain(' *   <footer class="ws-status-line">')
    expect(terminal).toContain(' *   <h2 class="ws-prompt">ls ~/projects</h2>')
    expect(terminal).toContain(' *   <span class="ws-state ws-state--active">active</span>')
    expect(read('dist/css/prose.css')).toContain(' *   <p class="ws-crumb">')
  })

  it('are left with no placeholder of a comment', () => {
    for (const file of [
      'dist/index.css',
      ...readdirSync(join(root, 'dist/css')).map((file) => `dist/css/${file}`),
    ])
      expect(read(file), file).not.toContain('ws-build-comment')
  })
})

describe('the comments of a stylesheet', () => {
  it('come through the build in their place, above their rules', () => {
    const css = `/* first */
.a {
  color: red;
}

/*
 * second
 *   <p class="b">markup</p>
 */
.b {
  color: red;
}

@media (width < 64rem) {
  /* in a block of rules */
  .a {
    color: blue;
  }
}
`
    expect(build(css)).toBe(`/* first */
.a {
  color: red;
}

/*
 * second
 *   <p class="b">markup</p>
 */
.b {
  color: red;
}

@media (width < 64rem) {
  /* in a block of rules */
  .a {
    color: #00f;
  }
}
`)
  })

  it('keep a blank line between two in a row', () => {
    expect(build('/* one */\n\n/* two */\n.a { color: red }\n')).toBe(
      '/* one */\n\n/* two */\n.a {\n  color: red;\n}\n',
    )
  })

  it('are left alone inside a rule, in a selector and in a string', () => {
    const css = `.a /* in a selector */ .b {
  /* between declarations */
  color: red;
}

.c::before {
  content: '/* not a comment */';
}
`
    const held: string[] = []
    holdComments(css, held)
    expect(held).toEqual([])
    const built = build(css)
    expect(built).toContain('.a .b {')
    expect(built).toContain('"/* not a comment */"')
  })

  it('fail the build when one does not come through', () => {
    expect(() => restoreComments('.a { color: red }', ['/* lost */'])).toThrow()
  })
})
