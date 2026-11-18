import { defineConfig } from 'oxfmt'
import whatsaaaa from '@whatsaaaa/format-config/oxfmt'

export default defineConfig({
  ...whatsaaaa,
  ignorePatterns: [
    'pnpm-lock.yaml',
    '.github/assets',
    // Copier writes it, and rewrites it on every update
    '.copier-answers.yml',
    'assets',
    'dist',
    'licenses',
    'styleguide/public/ds',
    'styleguide/public/kit',
    'tests/browser/__screenshots__',
  ],
})
