/**
 * The stylesheets take every color from a token. A hex value, a named color or a color
 * function in src/ is an error, so the tokens stay the one place a color is defined.
 * A variable that nothing defines is an error too, so a token cannot be misspelled.
 */
export default {
  extends: ['stylelint-config-standard'],
  plugins: ['stylelint-value-no-unknown-custom-properties'],
  ignoreFiles: [
    'dist/**',
    'styleguide/public/ds/**',
    'styleguide/.vitepress/dist/**',
    'styleguide/.vitepress/cache/**',
  ],
  rules: {
    'color-no-hex': true,
    'csstools/value-no-unknown-custom-properties': [
      true,
      {
        // what a stylesheet may read besides its own variables: the built tokens, the icons,
        // and in the docs theme the variables of VitePress's default theme
        importFrom: [
          'dist/tokens.css',
          'src/css/icons.css',
          'node_modules/vitepress/dist/client/theme-default/styles/vars.css',
        ],
      },
    ],
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
    // BEM names (.ws-tab-bar__brand, .ws-tag--outline) and the default theme's own class names
    'selector-class-pattern': null,
    'custom-property-pattern': null,
    'keyframes-name-pattern': null,
    // the alt text of generated content repeats the property on purpose: content: '#'; content: '#' / '';
    'declaration-block-no-duplicate-properties': [
      true,
      { ignore: ['consecutive-duplicates-with-different-syntaxes'] },
    ],
    'no-descending-specificity': null,
    'custom-media-pattern': null,
    'import-notation': 'string',
  },
  overrides: [
    {
      files: ['**/*.vue'],
      customSyntax: 'postcss-html',
    },
  ],
}
