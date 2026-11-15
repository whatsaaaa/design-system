import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { transform } from 'lightningcss'
import { describe, expect, it } from 'vitest'
import { tokens } from '../scripts/lib/tokens.ts'

const root = fileURLToPath(new URL('..', import.meta.url))
const read = (file: string) => readFileSync(join(root, file), 'utf8')

const SHEET = 'dist/css/nuxt-ui.css'

/** What the stylesheet given has: the kind of each rule, at any depth, and each variable it reads. */
function parse(file: string) {
  const rules: string[] = []
  const reads = new Set<string>()
  transform({
    filename: file,
    code: Buffer.from(read(file)),
    visitor: {
      Rule(rule) {
        rules.push(rule.type)
      },
      Variable(variable) {
        reads.add(variable.name.ident)
      },
    },
  })
  return { rules, reads }
}

describe("the Nuxt UI colors, the stylesheet that points Nuxt UI's variables at the roles", () => {
  it('is built into dist/css/, and not into index.css or tailwind.css, as it comes after Nuxt UI', () => {
    expect(read(SHEET)).toContain('--ui-primary: var(--ws-color-interactive);')
    expect(read('dist/index.css')).not.toContain('--ui-')
    expect(read('dist/tailwind.css')).not.toContain('nuxt-ui.css')
  })

  it('reads only tokens', () => {
    const { reads } = parse(SHEET)
    const variables = new Set(
      (['dark', 'light'] as const).flatMap((theme) =>
        Object.keys(tokens(theme)).map((id) => `--ws-${id.replaceAll('.', '-')}`),
      ),
    )
    expect([...reads]).toEqual(
      expect.arrayContaining(['--ws-color-interactive', '--ws-color-bg', '--ws-color-text']),
    )
    expect([...reads].filter((name) => !variables.has(name))).toEqual([])
  })

  it('keeps every rule outside a layer, so it wins over the values Nuxt UI keeps in its own', () => {
    expect(parse(SHEET).rules).toEqual(['style'])
  })

  it('declares the variables on the root and on every element that chooses a theme', () => {
    expect(read(SHEET)).toContain('\n:root, :host, [data-theme], .dark, .light {\n')
  })
})
