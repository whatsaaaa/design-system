import { globalIgnores } from 'eslint/config'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import pluginVue from 'eslint-plugin-vue'
import pluginOxlint from 'eslint-plugin-oxlint'
import skipFormatting from 'eslint-config-prettier/flat'

export default defineConfigWithVueTs(
  {
    name: 'app/files-to-lint',
    files: ['**/*.{vue,ts,mts}'],
  },

  globalIgnores([
    '**/dist/**',
    'assets/**',
    'styleguide/public/**',
    '**/.vitepress/cache/**',
    'playwright-report/**',
    'test-results/**',
  ]),

  ...pluginVue.configs['flat/recommended'],
  vueTsConfigs.recommended,

  {
    name: 'app/vitepress',
    files: ['src/vitepress/**/*.vue', 'styleguide/**/*.vue'],
    rules: {
      // VitePress names its own components with one word, and so do the components it registers
      'vue/multi-word-component-names': 'off',
    },
  },

  // oxlint runs first and is faster: leave the rules it covers to it
  ...pluginOxlint.buildFromOxlintConfigFile('.oxlintrc.json'),
  skipFormatting,
)
