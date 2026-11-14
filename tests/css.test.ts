import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { transform } from 'lightningcss'
import { describe, expect, it } from 'vitest'
import { holdComments, restoreComments } from '../scripts/lib/css-comments.ts'

const root = fileURLToPath(new URL('..', import.meta.url))
const read = (path: string) => readFileSync(join(root, path), 'utf8')

/** The comments of a source stylesheet that stand between its rules. */
const between = (css: string) => {
  const held: string[] = []
  holdComments(css, held)
  return held
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

  it.each(sources.filter((file) => file !== 'index.css'))(
    'keep the comments between the rules of %s, in index.css too',
    (file) => {
      const comments = between(read(`src/css/${file}`))
      expect(comments.length).toBeGreaterThan(0)
      // a comment in a block is indented as the block is
      const flat = (text: string) => text.replaceAll(/^[ \t]+/gm, '')
      const index = flat(read('dist/index.css'))
      for (const comment of comments) expect(index).toContain(flat(comment))
    },
  )

  it('carry the markup of each piece, which the usage guide points to', () => {
    const terminal = read('dist/css/terminal.css')
    expect(terminal).toContain(' *   <header class="ws-tab-bar">')
    expect(terminal).toContain(' *   <footer class="ws-status-line">')
    expect(terminal).toContain(' *   <h2 class="ws-prompt">ls ~/projects</h2>')
    expect(terminal).toContain(' *   <span class="ws-state ws-state--active">active</span>')
    expect(read('dist/css/prose.css')).toContain(' *   <p class="ws-crumb">')
    expect(read('docs/usage.md')).toContain(
      'The markup of each piece is in the comment above its rules',
    )
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
    expect(between(css)).toEqual([])
    const built = build(css)
    expect(built).toContain('.a .b {')
    expect(built).toContain('"/* not a comment */"')
  })

  it('fail the build when one does not come through', () => {
    expect(() => restoreComments('.a { color: red }', ['/* lost */'])).toThrow()
  })
})
