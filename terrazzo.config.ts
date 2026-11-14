import { defineConfig } from '@terrazzo/cli'
import css from '@terrazzo/plugin-css'
import js from '@terrazzo/plugin-js'
import { chosen, rootUnchosen, themeRules } from './scripts/lib/theme-selectors.ts'

/** Re-indents the declarations Terrazzo hands to `prepare`. */
const indent = (declarations: string, spaces: number) =>
  declarations.replace(/\n\s*/g, '\n' + ' '.repeat(spaces))

/** The selectors of a theme block, one to a line. */
const selectors = (theme: 'dark' | 'light') => chosen(theme).replace(', ', ',\n')

const notice = `/*
 * Whatsaaaa design tokens.
 *
 * The --ws-palette-* colors are the Rosé Pine palette (https://rosepinetheme.com),
 * main and dawn variants, from @rose-pine/palette.
 * Copyright (c) mvllow, MIT License. The full text is in licenses/rose-pine-palette.LICENSE.
 *
 * Dark is the default. Light applies when the system asks for it, and data-theme="dark" or
 * data-theme="light" on any element overrides both for that element and everything inside it.
 * So does a dark or light class, where the element has no data-theme.
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
            `:root,\n${selectors('dark')} {\n  color-scheme: dark;\n  ${indent(declarations, 2)}\n}`,
        },
        {
          input: { theme: 'light' },
          include: ['color.**'],
          prepare: (declarations) =>
            `${selectors('light')} {\n  color-scheme: light;\n  ${indent(declarations, 2)}\n}\n\n` +
            `@media (prefers-color-scheme: light) {\n  ${rootUnchosen} {\n    color-scheme: light;\n    ${indent(declarations, 4)}\n  }\n}`,
        },
      ],
    }),
    js({ filename: 'tokens.js' }),
    {
      // the rules of an element for one theme only, which src/css/theme.css ships
      name: 'theme-rules',
      build: ({ outputFile }) => outputFile('theme-rules.css', `${themeRules()}\n`),
    },
  ],
  lint: {
    rules: {
      'core/consistent-naming': ['error', { format: 'kebab-case' }],
      'core/colorspace': ['error', { colorSpace: 'srgb' }],
      'core/descriptions': 'off',
    },
  },
})
