import type { DefaultTheme } from 'vitepress'

/** What this theme adds to the default theme's config, under `themeConfig.whatsaaaa`. */
export interface WhatsaaaaThemeConfig {
  /**
   * The ghost at the right end of the tab bar.
   * - `link` (default): a link to the handle's site, as on a project's docs
   * - `egg`: the ghost with the easter egg, for the handle's own sites
   * - `false`: no ghost
   */
  ghost?: 'link' | 'egg' | false
  /** Where the ghost links to. Defaults to https://whatsaaaa.github.io/ */
  home?: string
  /** The git branch the site is built from, shown in the status line. Left out when not set. */
  branch?: string
}

/** The default theme's config with this theme's additions. Pass it to `defineConfig<ThemeConfig>()`. */
export interface ThemeConfig extends DefaultTheme.Config {
  whatsaaaa?: WhatsaaaaThemeConfig
}
