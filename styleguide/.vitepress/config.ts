import { defineConfig } from 'vitepress'
import { type ThemeConfig, whatsaaaaConfig } from '../../src/vitepress-config/index.ts'

export default defineConfig<ThemeConfig>({
  extends: whatsaaaaConfig(),
  title: 'design-system',
  description:
    "Whatsaaaa's design system: brand identity, design tokens, typography, docs theme and asset kit.",
  lang: 'en',
  cleanUrls: true,
  head: [
    ['link', { rel: 'icon', href: '/kit/whatsaaaa/favicon.ico', sizes: '48x48' }],
    ['link', { rel: 'icon', href: '/kit/whatsaaaa/favicon.svg', type: 'image/svg+xml' }],
    ['link', { rel: 'apple-touch-icon', href: '/kit/whatsaaaa/apple-touch-icon.png' }],
  ],
  themeConfig: {
    nav: [
      { text: 'identity', link: '/identity/', activeMatch: '^/identity/' },
      { text: 'tokens', link: '/tokens/color', activeMatch: '^/tokens/' },
      { text: 'styles', link: '/styles/prose', activeMatch: '^/styles/' },
      { text: 'docs', link: '/docs/', activeMatch: '^/docs/' },
    ],
    sidebar: {
      '/identity/': [
        {
          text: 'Identity',
          items: [
            { text: 'The ghost', link: '/identity/' },
            { text: 'Project sprites', link: '/identity/projects' },
            { text: 'Banners and icons', link: '/identity/banners' },
          ],
        },
      ],
      '/tokens/': [
        {
          text: 'Tokens',
          items: [
            { text: 'Color', link: '/tokens/color' },
            { text: 'Typography', link: '/tokens/typography' },
            { text: 'Space, radius and motion', link: '/tokens/space' },
          ],
        },
      ],
      '/styles/': [
        {
          text: 'Styles',
          items: [
            { text: 'Prose', link: '/styles/prose' },
            { text: 'Terminal frame', link: '/styles/terminal' },
          ],
        },
      ],
      '/docs/': [
        {
          text: 'Docs theme',
          items: [
            { text: 'Using the theme', link: '/docs/' },
            { text: 'Usage for coding agents', link: '/docs/usage' },
          ],
        },
        {
          text: 'Sample: form-builder',
          items: [{ text: 'Conditions', link: '/docs/sample/conditions' }],
        },
      ],
    },
    search: { provider: 'local' },
    socialLinks: [{ icon: 'github', link: 'https://github.com/whatsaaaa/design-system' }],
    whatsaaaa: { ghost: 'egg', branch: 'main' },
  },
})
