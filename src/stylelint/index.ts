/**
 * The token lint rules, for stylelint: a stylesheet takes every color from a token. A hex
 * value, a named color or a color function is an error, so the tokens stay the one place a
 * color is defined, and so is a variable that nothing defines, so a token cannot be misspelled.
 *
 * The variables it knows are those of the tokens.css of this same version, the component tier's
 * among them, wherever the package is installed. stylelint, stylelint-config-standard and
 * stylelint-value-no-unknown-custom-properties are optional peers: only this entry names them,
 * and stylelint loads them.
 */
import { fileURLToPath } from 'node:url'
import type { Config } from 'stylelint'

/** The built tokens, next to this module in dist/. */
const tokens = fileURLToPath(new URL('../tokens.css', import.meta.url))

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
    ],
    'csstools/value-no-unknown-custom-properties': [true, { importFrom: [tokens] }],
    'import-notation': 'string',
  },
}

export default config
