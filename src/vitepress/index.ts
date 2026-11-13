/**
 * The docs theme for VitePress. It extends VitePress's default theme, so a site keeps its
 * nav, sidebar, search and every other default theme option, and gets the terminal frame:
 * the tab bar, the status line with working keys, and the prose and code styles.
 *
 * In .vitepress/theme/index.ts:
 *
 *   export { default } from '@whatsaaaa/design-system/vitepress'
 *
 * In .vitepress/config.ts, extend the base config from '@whatsaaaa/design-system/vitepress/config'.
 */
import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme-without-fonts'
import '../../dist/fonts.css'
import '../../dist/tokens.css'
import '../../dist/css/icons.css'
import '../../dist/css/prose.css'
import '../../dist/css/terminal.css'
import '../../dist/css/ghost.css'
import './styles/vars.css'
import './styles/layout.css'
import './styles/nav.css'
import './styles/sidebar.css'
import './styles/doc.css'
import './styles/home.css'
import './styles/search.css'
import Layout from './Layout.vue'

export type { ThemeConfig, WhatsaaaaThemeConfig } from '../../dist/vitepress-config/types.js'

export default {
  extends: DefaultTheme,
  Layout,
} satisfies Theme
