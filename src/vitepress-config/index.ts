/**
 * The base VitePress config of the docs theme. Extend it in .vitepress/config.ts:
 *
 *   import { defineConfigWithTheme } from 'vitepress'
 *   import { whatsaaaaConfig, type ThemeConfig } from '@whatsaaaa/design-system/vitepress/config'
 *
 *   export default defineConfigWithTheme<ThemeConfig>({
 *     extends: whatsaaaaConfig(),
 *     title: 'form-builder',
 *   })
 */
import type { UserConfig } from 'vitepress'
import { codeTheme } from '../shiki/index.ts'
import { keysInitScript } from '../shortcuts/index.ts'
import type { ThemeConfig } from './types.ts'
import { whatsaaaaMarkdown } from './markdown.ts'

export type { ThemeConfig, WhatsaaaaThemeConfig } from './types.ts'
export { whatsaaaaMarkdown } from './markdown.ts'

/**
 * Sets data-theme before the first paint, from the choice VitePress remembers.
 * VitePress itself only sets its `dark` class, which the tokens do not read.
 * Where storage is blocked nothing is remembered, and the page follows the system.
 */
const themeScript = `;(() => {
  let preference = 'auto'
  try {
    preference = localStorage.getItem('vitepress-theme-appearance') || 'auto'
  } catch {}
  const dark = preference === 'dark' || (preference === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.dataset.theme = dark ? 'dark' : 'light'
})()`

export function whatsaaaaConfig(): UserConfig<ThemeConfig> {
  return {
    head: [
      ['script', { id: 'ws-theme' }, themeScript],
      // keys that are remembered as off are off from the first paint: no tab shows its number
      ['script', { id: 'ws-keys' }, keysInitScript],
    ],
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
