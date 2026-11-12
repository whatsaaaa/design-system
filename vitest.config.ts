import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // The tests read what the build writes to dist/. Run "pnpm build" first.
    include: ['tests/*.test.ts'],
  },
})
