import type { Theme } from 'vitepress'
import DocsTheme from '../../../../../src/vitepress/index.ts'
import SiteLayout from './SiteLayout.vue'

export default {
  extends: DocsTheme,
  Layout: SiteLayout,
} satisfies Theme
