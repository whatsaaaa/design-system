/**
 * The stylesheets take every color from a design system token: a hex value, a named color or a
 * color function is an error, and so is a variable that nothing defines.
 */
export default {
  extends: ['stylelint-config-standard'],
  plugins: ['stylelint-value-no-unknown-custom-properties'],
  ignoreFiles: ['**/dist/**', '**/coverage/**'],
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
    'csstools/value-no-unknown-custom-properties': [
      true,
      { importFrom: ['node_modules/@whatsaaaa/design-system/dist/tokens.css'] },
    ],
    'import-notation': 'string',
  },
  overrides: [
    {
      files: ['**/*.vue'],
      customSyntax: 'postcss-html',
    },
  ],
}
