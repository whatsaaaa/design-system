import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'
import { parse } from 'yaml'

// The browser job of CI runs in the Playwright image of the version ci.yml names, whose browsers
// only @playwright/test of the same version can drive. package.json names a range, so the test
// reads the version that is installed.
test('ci.yml names the version of @playwright/test that is installed', () => {
  const { version } = JSON.parse(readFileSync('node_modules/@playwright/test/package.json', 'utf8'))
  const workflow = parse(readFileSync('.github/workflows/ci.yml', 'utf8'))
  // the shared node-ci workflow runs the browser job in mcr.microsoft.com/playwright:v<this>-noble
  expect(workflow.jobs.ci.with['playwright-version']).toBe(version)
})
