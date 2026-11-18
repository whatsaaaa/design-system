import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'

// The browser job of CI runs in the Playwright image of the version ci.yml names, whose browsers
// only @playwright/test of the same version can drive
test('ci.yml names the version of @playwright/test in package.json', () => {
  const { devDependencies } = JSON.parse(readFileSync('package.json', 'utf8'))
  const ci = readFileSync('.github/workflows/ci.yml', 'utf8')
  expect(/playwright-version: (\S+)/.exec(ci)?.[1]).toBe(devDependencies['@playwright/test'])
})
