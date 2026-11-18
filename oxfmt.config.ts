import { defineConfig } from 'oxfmt'
import whatsaaaa from '@whatsaaaa/format-config/oxfmt'

export default defineConfig({
  ...whatsaaaa,
  ignorePatterns: [
    'assets',
    'dist',
    'licenses',
    'pnpm-lock.yaml',
    'styleguide/public/ds',
    'styleguide/public/kit',
    'tests/browser/__screenshots__',
  ],
})
