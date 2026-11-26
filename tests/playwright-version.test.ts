import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { expect, test } from 'vitest'
import { parse } from 'yaml'

interface Workflow {
  jobs?: { ci?: { with?: { 'playwright-version'?: unknown } | null } }
}

// The browser job of CI runs in the Playwright image of the version ci.yml names, whose browsers
// only @playwright/test of the same version can drive: the version installed, which a range in
// package.json does not name
test('ci.yml names the installed version of @playwright/test', () => {
  const ci = parse(readFileSync('.github/workflows/ci.yml', 'utf8')) as Workflow
  const { version } = createRequire(import.meta.url)('@playwright/test/package.json') as {
    version: string
  }
  expect(ci.jobs?.ci?.with?.['playwright-version']).toBe(version)
})
