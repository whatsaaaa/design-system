import { defineConfig } from '@terrazzo/cli'
import css from '@terrazzo/plugin-css'
import js from '@terrazzo/plugin-js'

/** Re-indents the declarations Terrazzo hands to `prepare`. */
const indent = (declarations: string, spaces: number) =>
  declarations.replace(/\n\s*/g, '\n' + ' '.repeat(spaces))

const notice = `/*
 * Whatsaaaa design tokens.
 *
 * The --ws-palette-* colors are the Rosé Pine palette (https://rosepinetheme.com),
 * main and dawn variants, from @rose-pine/palette.
 * Copyright (c) mvllow, MIT License. The full text is in licenses/rose-pine-palette.LICENSE.
 *
 * Dark is the default. Light applies when the system asks for it, and data-theme="dark" or
 * data-theme="light" on any element overrides both for that element and everything inside it.
 */`

export default defineConfig({
  tokens: ['./tokens/whatsaaaa.resolver.json'],
  outDir: './dist',
  plugins: [
    css({
      filename: 'tokens.css',
      // Rosé Pine is defined in sRGB hex, and the contrast checks read these exact values.
      legacyHex: true,
      variableName: (token) => `--ws-${token.id.replaceAll('.', '-')}`,
      permutations: [
        {
          // everything that is the same in both themes
          input: { theme: 'dark' },
          exclude: ['color.**'],
          prepare: (declarations) => `${notice}\n\n:root {\n  ${indent(declarations, 2)}\n}`,
        },
        {
          input: { theme: 'dark' },
          include: ['color.**'],
          prepare: (declarations) =>
            `:root,\n[data-theme='dark'] {\n  color-scheme: dark;\n  ${indent(declarations, 2)}\n}`,
        },
        {
          input: { theme: 'light' },
          include: ['color.**'],
          prepare: (declarations) =>
            `[data-theme='light'] {\n  color-scheme: light;\n  ${indent(declarations, 2)}\n}\n\n` +
            `@media (prefers-color-scheme: light) {\n  :root:not([data-theme]) {\n    color-scheme: light;\n    ${indent(declarations, 4)}\n  }\n}`,
        },
      ],
    }),
    js({ filename: 'tokens.js' }),
  ],
  lint: {
    rules: {
      'core/consistent-naming': ['error', { format: 'kebab-case' }],
      'core/colorspace': ['error', { colorSpace: 'srgb' }],
      'core/descriptions': 'off',
    },
  },
})
