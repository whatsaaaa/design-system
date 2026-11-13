import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { parse } from 'yaml'

const root = fileURLToPath(new URL('..', import.meta.url))
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))

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
    const workflow = parse(readFileSync(join(root, '.github/workflows/ci.yml'), 'utf8'))
    expect(workflow.jobs.browser.container).toBe(`mcr.microsoft.com/playwright:v${version}-noble`)
  })
})
