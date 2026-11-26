import { defineConfig } from 'oxfmt'
import whatsaaaa from '@whatsaaaa/format-config/oxfmt'

export default defineConfig({
  ...whatsaaaa,
<<<<<<< before updating
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
=======
  // Copier writes .copier-answers.yml, wrapping a long answer at 80 columns, and rewrites it on
  // every update
  ignorePatterns: ['pnpm-lock.yaml', '.github/assets', '.copier-answers.yml'],
>>>>>>> after updating
})
