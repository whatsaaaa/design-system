import { defineConfigWithTheme } from 'vitepress'
import { specs } from '../../scripts/lib/specs.ts'
import { type ThemeConfig, whatsaaaaConfig } from '../../src/vitepress-config/index.ts'

/** The styles and the specs of the components drawn with them, one sidebar for both. */
const styles = [
  {
    text: 'Styles',
    items: [
      { text: 'Prose', link: '/styles/prose' },
      { text: 'Terminal frame', link: '/styles/terminal' },
      { text: 'Forms', link: '/styles/forms' },
    ],
  },
  {
    text: 'Components',
    items: [
      { text: 'Specs', link: '/components/' },
      // a page for each spec, in the order of the spec index on the first
      ...specs().map(({ component, title }) => ({ text: title, link: `/components/${component}` })),
    ],
  },
]

export default defineConfigWithTheme<ThemeConfig>({
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
      // the component specs are under styles: a fifth tab does not fit a tablet's bar
      { text: 'styles', link: '/styles/prose', activeMatch: '^/(styles|components)/' },
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
      '/styles/': styles,
      '/components/': styles,
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
          items: [
            { text: 'A guide page', link: '/docs/sample/conditions' },
            { text: 'A home page', link: '/docs/sample/home' },
          ],
        },
      ],
    },
    search: { provider: 'local' },
    socialLinks: [{ icon: 'github', link: 'https://github.com/whatsaaaa/design-system' }],
    whatsaaaa: { ghost: 'egg', branch: 'main' },
  },
})
