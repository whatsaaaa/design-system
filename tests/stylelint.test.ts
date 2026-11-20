import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { importWithout, pkg, root } from './peers.ts'

const fixtures = join(root, 'tests/fixtures/stylelint')
const stylelint = pathToFileURL(createRequire(join(root, 'package.json')).resolve('stylelint')).href
const elsewhere = mkdtempSync(join(tmpdir(), 'ws-stylelint-'))
afterAll(() => rmSync(elsewhere, { recursive: true, force: true }))

/**
 * The config of a project on Tailwind CSS: the entry with Tailwind's at-rules and functions, and
 * nothing of the entry's own. It is the block docs/usage.md gives for it, written to a file as it
 * stands there and not copied here, so the lines a project takes from the documentation are the
 * lines tested.
 */
const tailwind = join(elsewhere, 'stylelint.config.mjs')
beforeAll(() => {
  const blocks = [
    ...readFileSync(join(root, 'docs/usage.md'), 'utf8').matchAll(/^```js\n(.+?)^```$/gms),
  ]
    .map(([, block]) => block!)
    .filter((block) => block.includes("'at-rule-no-unknown'"))
  expect(blocks, 'the js blocks of docs/usage.md that set at-rule-no-unknown').toHaveLength(1)
  writeFileSync(tailwind, blocks[0]!)
})

/**
 * Lints a fixture as a project does, with a config that only extends the entry or with the config
 * file given, in a Node process whose working directory is not this repository, so the tokens are
 * found wherever the linter runs.
 */
const lint = (fixture: string, configFile?: string): string[] => {
  const config = configFile
    ? `(await import(${JSON.stringify(pathToFileURL(configFile).href)})).default`
    : JSON.stringify({ extends: ['@whatsaaaa/design-system/stylelint'] })
  const script = `
    const { default: stylelint } = await import(${JSON.stringify(stylelint)})
    const { results: [result] } = await stylelint.lint({
      files: ${JSON.stringify(join(fixtures, fixture))},
      config: ${config},
      configBasedir: ${JSON.stringify(root)},
    })
    console.log(JSON.stringify(result.warnings.map(({ line, rule }) => line + ' ' + rule).sort()))
  `
  return JSON.parse(
    execFileSync(process.execPath, ['--input-type=module', '--eval', script], {
      cwd: elsewhere,
      encoding: 'utf8',
      stdio: 'pipe',
    }),
  )
}

describe('the stylelint entry', () => {
  it('rejects a hex value, a named color, a color function and a variable nothing defines', () => {
    expect(lint('invalid.css')).toEqual([
      '3 color-no-hex',
      '4 color-named',
      '5 function-disallowed-list',
      '6 csstools/value-no-unknown-custom-properties',
    ])
  }, 30_000)

  it('rejects a color() literal in any color space, and lets color-mix() through', () => {
    expect(lint('color-function.css')).toEqual([
      '3 function-disallowed-list',
      '4 function-disallowed-list',
    ])
  }, 30_000)

  it('lets the tokens through, the component tier among them, and a variable of the stylesheet', () => {
    expect(lint('valid.css')).toEqual([])
  }, 30_000)

  it('knows the icons, so a project names no file of the package, and a misspelled one fails', () => {
    expect(lint('icons.css')).toEqual(['8 csstools/value-no-unknown-custom-properties'])
  }, 30_000)

  it('leaves the at-rules and functions of Tailwind CSS to the project', () => {
    expect(new Set(lint('tailwind.css').map((warning) => warning.split(' ')[1]))).toEqual(
      new Set([
        'at-rule-no-unknown',
        'at-rule-prelude-no-invalid',
        'nesting-selector-no-missing-scoping-root',
        'no-invalid-position-declaration',
        'declaration-property-value-no-unknown',
        'media-query-no-invalid',
      ]),
    )
  }, 30_000)

  it('passes a Tailwind CSS stylesheet once the project adds them, and still holds it to the tokens', () => {
    expect(lint('tailwind.css', tailwind)).toEqual([])
    expect(lint('tailwind-invalid.css', tailwind)).toEqual([
      '3 function-disallowed-list',
      '4 color-no-hex',
      '8 csstools/value-no-unknown-custom-properties',
    ])
  }, 30_000)

  it('lets nothing but Tailwind CSS through with them: a query, a & and a declaration that are not valid CSS fail, once each', () => {
    expect(lint('tailwind-stray.css', tailwind)).toEqual([
      '12 media-query-no-invalid',
      '2 media-query-no-invalid',
      '3 nesting-selector-no-missing-scoping-root',
      '8 media-query-no-invalid',
      '9 no-invalid-position-declaration',
    ])
  }, 30_000)

  // As the lint above, a Node process of its own, here one that imports every entry.
  it('needs none of its optional peers to import, nor does any other entry', async () => {
    const peers = [
      'stylelint',
      'stylelint-config-standard',
      'stylelint-value-no-unknown-custom-properties',
    ]
    const { needing, loaded } = importWithout(peers)
    expect(needing).toEqual([])
    expect(loaded).toContain(`${pkg.name}/stylelint`)
    const { default: config } = await import('@whatsaaaa/design-system/stylelint')
    expect(config.extends).toEqual(['stylelint-config-standard'])
    for (const peer of peers) {
      expect(pkg.peerDependenciesMeta[peer]).toEqual({ optional: true })
      expect(pkg.dependencies).not.toHaveProperty(peer)
    }
  }, 30_000)

  it('reads the tokens and icons of the same build, wherever it is installed', async () => {
    const { default: config } = await import('@whatsaaaa/design-system/stylelint')
    const [, options] = config.rules!['csstools/value-no-unknown-custom-properties'] as [
      true,
      { importFrom: string[] },
    ]
    expect(options.importFrom).toEqual([
      join(root, 'dist/tokens.css'),
      join(root, 'dist/css/icons.css'),
    ])
  })
})
