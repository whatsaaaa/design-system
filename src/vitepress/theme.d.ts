// The types of index.ts, for a site's type checker. index.ts imports stylesheets and .vue
// files, which only the site's bundler reads, so the export points the checker here instead.
import type { Theme } from 'vitepress'

export type { ThemeConfig, WhatsaaaaThemeConfig } from '../../dist/vitepress-config/types.js'

declare const theme: Theme
export default theme
