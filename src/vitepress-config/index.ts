/**
 * The base VitePress config of the docs theme. Extend it in .vitepress/config.ts:
 *
 *   import { defineConfig } from 'vitepress'
 *   import { whatsaaaaConfig, type ThemeConfig } from '@whatsaaaa/design-system/vitepress/config'
 *
 *   export default defineConfig<ThemeConfig>({
 *     extends: whatsaaaaConfig(),
 *     title: 'form-builder',
 *   })
 */
import type { UserConfig } from 'vitepress'
import { codeTheme } from '../shiki/index.ts'
import type { ThemeConfig } from './types.ts'
import { whatsaaaaMarkdown } from './markdown.ts'

export type { ThemeConfig, WhatsaaaaThemeConfig } from './types.ts'
export { whatsaaaaMarkdown } from './markdown.ts'
export { codeTheme } from '../shiki/index.ts'

/**
 * Sets data-theme before the first paint, from the choice VitePress remembers.
 * VitePress itself only sets its `dark` class, which the tokens do not read.
 */
const themeScript = `;(() => {
  const preference = localStorage.getItem('vitepress-theme-appearance') || 'auto'
  const dark = preference === 'dark' || (preference === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.dataset.theme = dark ? 'dark' : 'light'
})()`

export function whatsaaaaConfig(): UserConfig<ThemeConfig> {
  return {
    head: [['script', { id: 'ws-theme' }, themeScript]],
    markdown: {
      // one code theme for both page themes: code blocks stay dark
      theme: codeTheme,
      config: whatsaaaaMarkdown,
    },
    vite: {
      // the theme ships as source, so the site's own build compiles it
      ssr: { noExternal: ['@whatsaaaa/design-system'] },
      optimizeDeps: { exclude: ['@whatsaaaa/design-system'] },
    },
  }
}
