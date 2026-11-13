import { defineConfigWithTheme } from 'vitepress'
import { type ThemeConfig, whatsaaaaConfig } from '../../../../src/vitepress-config/index.ts'

// A docs site set up as the guide says, small enough to build in a test.
export default defineConfigWithTheme<ThemeConfig>({
  extends: whatsaaaaConfig(),
  title: 'kafana',
  themeConfig: {
    nav: [{ text: 'vodič', link: '/guide/', activeMatch: '^/guide/' }],
    sidebar: [{ text: 'Uvod', items: [{ text: 'Rezervacije', link: '/guide/' }] }],
  },
})
