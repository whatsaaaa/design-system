/**
 * The stylesheets follow the token lint rules the package publishes, from the build in dist/.
 * src/stylelint/index.ts says what they reject.
 */
export default {
  extends: ['@whatsaaaa/design-system/stylelint'],
  ignoreFiles: [
    'dist/**',
    'styleguide/public/ds/**',
    'styleguide/.vitepress/dist/**',
    'styleguide/.vitepress/cache/**',
  ],
  rules: {
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
  },
  overrides: [
    {
      files: ['**/*.vue'],
      customSyntax: 'postcss-html',
    },
  ],
}
