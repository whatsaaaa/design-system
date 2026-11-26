import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { expect, test } from 'vitest'
import { parse } from 'yaml'
<<<<<<< before updating

// The browser job of CI runs in the Playwright image of the version ci.yml names, whose browsers
// only @playwright/test of the same version can drive. package.json names a range, so the test
// reads the version that is installed.
test('ci.yml names the version of @playwright/test that is installed', () => {
  const { version } = JSON.parse(readFileSync('node_modules/@playwright/test/package.json', 'utf8'))
  const workflow = parse(readFileSync('.github/workflows/ci.yml', 'utf8'))
  // the shared node-ci workflow runs the browser job in mcr.microsoft.com/playwright:v<this>-noble
  expect(workflow.jobs.ci.with['playwright-version']).toBe(version)
=======

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
>>>>>>> after updating
})
