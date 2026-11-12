/**
 * The stylesheets take every color from a token. A hex value, a named color or a color
 * function in src/ is an error, so the tokens stay the one place a color is defined.
 */
export default {
  extends: ['stylelint-config-standard'],
  ignoreFiles: [
    'dist/**',
    'styleguide/public/ds/**',
    'styleguide/.vitepress/dist/**',
    'styleguide/.vitepress/cache/**',
  ],
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
