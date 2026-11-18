import whatsaaaa from '@whatsaaaa/eslint-config'

export default whatsaaaa(
  {
    vue: true,
    ignores: ['assets/**', 'styleguide/public/**', '**/.vitepress/cache/**'],
  },

  {
    name: 'app/vitepress',
    files: ['src/vitepress/**/*.vue', 'styleguide/**/*.vue'],
    rules: {
      // VitePress names its own components with one word, and so do the components it registers
      'vue/multi-word-component-names': 'off',
    },
  },
)
