/**
 * The token lint rules, for stylelint: a hex value, a named color or a color written with one of
 * the functions rgb, rgba, hsl, hsla, oklch, oklab, lab, lch, hwb and color is an error, and so is
 * a variable that nothing defines, so a token cannot be misspelled. color-mix() is no literal: it
 * mixes tokens, and passes.
 *
 * The variables it knows are those of the tokens.css of this same version, the component tier's
 * among them, and the icons of its css/icons.css, wherever the package is installed. stylelint,
 * stylelint-config-standard and stylelint-value-no-unknown-custom-properties are optional peers:
 * only this entry names them, and stylelint loads them.
 */
import { fileURLToPath } from 'node:url'
import type { Config } from 'stylelint'

/** The built tokens and icons, next to this module in dist/. */
const tokens = fileURLToPath(new URL('../tokens.css', import.meta.url))
const icons = fileURLToPath(new URL('../css/icons.css', import.meta.url))

const config: Config = {
  extends: ['stylelint-config-standard'],
  plugins: ['stylelint-value-no-unknown-custom-properties'],
  rules: {
    'color-no-hex': true,
    'color-named': 'never',
    'function-disallowed-list': [
      'rgb',
      'rgba',
      'hsl',
      'hsla',
      'oklch',
      'oklab',
      'lab',
      'lch',
      'hwb',
      'color',
    ],
    'csstools/value-no-unknown-custom-properties': [true, { importFrom: [tokens, icons] }],
    'import-notation': 'string',
  },
}

export default config
