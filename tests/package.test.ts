import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const root = fileURLToPath(new URL('..', import.meta.url))
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))

/** Every file in a folder and below, as paths from the repository root. */
function walk(dir: string): string[] {
  return readdirSync(join(root, dir), { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? walk(join(dir, entry.name)) : [join(dir, entry.name)],
  )
}

describe('the package', () => {
  const targets = Object.entries<string | Record<string, string>>(pkg.exports).flatMap(
    ([name, target]) =>
      (typeof target === 'string' ? [target] : Object.values(target)).map(
        (file) => [name, file] as const,
      ),
  )

  it.each(targets.filter(([, file]) => !file.includes('*')))(
    '%s points at a file that exists: %s',
    (_name, file) => {
      expect(existsSync(join(root, file))).toBe(true)
    },
  )

  it.each(targets.filter(([, file]) => file.includes('*')))(
    '%s matches at least one file: %s',
    (_name, file) => {
      const [dir, rest] = file.replace(/^\.\//, '').split('*') as [string, string]
      expect(readdirSync(join(root, dir)).some((entry) => entry.endsWith(rest))).toBe(true)
    },
  )

  it('ships what its exports point at', () => {
    for (const [, file] of targets) {
      const path = file.replace(/^\.\//, '')
      expect(
        pkg.files.some((entry: string) => path === entry || path.startsWith(`${entry}/`)) ||
          path === 'package.json',
        file,
      ).toBe(true)
    }
  })

  it('cannot be published by accident before the first release', () => {
    expect(pkg.private).toBe(true)
  })
})

describe('the browser tests', () => {
  it('run in CI in the container of the Playwright version that is installed', () => {
    const { version } = JSON.parse(
      readFileSync(join(root, 'node_modules/@playwright/test/package.json'), 'utf8'),
    )
    const workflow = readFileSync(join(root, '.github/workflows/ci.yml'), 'utf8')
    expect(workflow).toContain(`container: mcr.microsoft.com/playwright:v${version}-noble`)
  })
})

describe('the stylesheets', () => {
  const tokens = readFileSync(join(root, 'dist/tokens.css'), 'utf8')
  const sources = [...walk('src'), ...walk('styleguide')].filter(
    (file) =>
      /\.(css|vue|md|html)$/.test(file) &&
      !/styleguide\/(public\/(ds|kit)|\.vitepress\/(cache|dist))\//.test(file),
  )
  const text = sources.map((file) => readFileSync(join(root, file), 'utf8')).join('\n')
  const defined = new Set(
    [...(tokens + text).matchAll(/(--ws-[a-z0-9-]+)\s*:/g)].map((match) => match[1]),
  )

  it('only use variables that exist', () => {
    // a variable read with a fallback, var(--ws-ghost-body, ...), is a hook that may stay unset
    const used = [...text.matchAll(/var\(\s*(--ws-[a-z0-9-]+)\s*\)/g)].map((match) => match[1]!)
    const unknown = [...new Set(used)].filter((name) => !defined.has(name))
    expect(unknown).toEqual([])
    expect(used.length).toBeGreaterThan(300)
  })

  it('name their variables in documentation the way the tokens are named', () => {
    const mentioned = [...text.matchAll(/`(--ws-[a-z0-9-]+)`/g)].map((match) => match[1]!)
    const usage = readFileSync(join(root, 'docs/usage.md'), 'utf8')
    const inUsage = [...usage.matchAll(/`(--ws-[a-z0-9-]+)`/g)].map((match) => match[1]!)
    // a name ending in a dash is a family, such as --ws-palette-*
    const unknown = [...new Set([...mentioned, ...inUsage])].filter(
      (name) => !name.endsWith('-') && !defined.has(name),
    )
    expect(unknown).toEqual([])
  })
})
