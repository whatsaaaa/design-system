# Using the docs theme

A theme for VitePress. It extends VitePress's default theme, so a site keeps its config as it is: nav, sidebar, search, edit links and the rest. What changes is how it looks and what it adds.

This guide runs on it. For pages with real documentation, see the samples from form-builder: [a guide page](/docs/sample/conditions) and [a home page](/docs/sample/home).

## Setting it up

The theme and its base config go together.

```ts [.vitepress/theme/index.ts]
export { default } from '@whatsaaaa/design-system/vitepress'
```

```ts [.vitepress/config.ts]
import { defineConfigWithTheme } from 'vitepress'
import { type ThemeConfig, whatsaaaaConfig } from '@whatsaaaa/design-system/vitepress/config'

export default defineConfigWithTheme<ThemeConfig>({
  extends: whatsaaaaConfig(),
  title: 'form-builder',
  themeConfig: {
    logo: '/mark-on-dark.svg',
    nav: [
      { text: 'guide', link: '/guide/', activeMatch: '^/guide/' },
      { text: 'api', link: '/api/', activeMatch: '^/api/' },
    ],
    search: { provider: 'local' },
    whatsaaaa: { branch: 'main' },
  },
})
```

The base config sets the code theme, lets the site's build compile the theme, shows file names on code blocks, frames tables, and applies what the browser remembers before the first paint: the theme, and keys that are switched off.

::: warning A site with its own markdown.config
VitePress keeps only one `markdown.config`. If the site has its own, call the theme's setup inside it:

```ts
import { whatsaaaaMarkdown } from '@whatsaaaa/design-system/vitepress/config'

markdown: {
  config(md) {
    whatsaaaaMarkdown(md)
    // the site's own plugins
  },
}
```
:::

## What the theme adds

| Part        | What it does                                                                                                                      |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Tab bar     | The nav bar, with numbered tabs. The number keys go to them                                                                       |
| Status line | The mode, the file of the page, the keys and their switch, the scroll position and the theme                                      |
| Keys        | <kbd>/</kbd> search, <kbd>j</kbd> and <kbd>k</kbd> scroll, <kbd>t</kbd> theme. The search key shows only when the site has search |
| Keys switch | `keys on` in the status line. A visitor turns all keys off with it, and the browser remembers                                     |
| Path        | The tab, the sidebar group and the page, above the title                                                                          |
| Code blocks | A caption with the language, and the file name from <code>```ts [file.ts]</code>                                                  |
| Tables      | A frame that scrolls sideways                                                                                                     |
| The ghost   | At the right end of the tab bar, as a link to the handle's site                                                                   |
| 404         | The ghost in its lost pose                                                                                                        |

## Options

Everything from the default theme works. The theme adds one group, `themeConfig.whatsaaaa`:

| Option   | What it does                                                                    | Default        |
| -------- | ------------------------------------------------------------------------------- | -------------- |
| `ghost`  | `link` for a link to the handle's site, `egg` for the ghost with the easter egg | `link`         |
| `branch` | The git branch shown in the status line                                         | not&nbsp;shown |

## Keys, and switching them off

The keys are single characters: <kbd>/</kbd>, <kbd>j</kbd>, <kbd>k</kbd>, <kbd>t</kbd> and the numbers of the tabs. They act while the focus is not in a field, and never with <kbd>Ctrl</kbd>, <kbd>Alt</kbd> or <kbd>Cmd</kbd> held. A key that is held down acts once.

A visitor can turn them off with the switch in the status line, which reads `keys on` or `keys off`. It is there at every width, a phone included, and the browser remembers the choice. With the keys off nothing names a key: the key caps of the status line, the numbers of the tabs and the <kbd>/</kbd> in the search field are gone, and <kbd>/</kbd> no longer opens the search. The search and theme buttons of the status line stay and work by hand. There is nothing to configure, and no option to remove the switch: a page with single-key shortcuts has to offer a way to turn them off.

## The brand and the first tab

From 60rem up, the brand has a box as wide as the sidebar, and the tabs start where it ends. The first tab therefore starts exactly on the border of the sidebar, whatever the brand and the tabs are called. A page without a sidebar keeps the tabs at the same place, so they do not move from page to page.

The box is 17rem wide, with the padding of the sidebar. With a logo it has room for about 23 characters in the site title, without a logo about 28. A longer title is cut with an ellipsis: shorten it with `themeConfig.siteTitle`. A short title leaves a gap before the first tab. The labels of the tabs have no limit from the brand: a long one moves the tabs after it.

Below 60rem there is no sidebar, and the tabs follow the brand. On a phone they take a row of their own under it.

## The logo

Use the free mark of the project, `mark-on-dark.svg`, as `themeConfig.logo`. It is drawn at 32 px, where a sprite pixel is 2 px. For a logo that follows the theme, give both:

```ts
logo: { dark: '/mark-on-dark.svg', light: '/mark-on-light.svg' }
```

## Slots

The theme's layout passes every slot of the default theme through. To add to a slot, wrap the layout:

```vue [.vitepress/theme/Layout.vue]
<script setup>
import Theme from '@whatsaaaa/design-system/vitepress'
</script>

<template>
  <Theme.Layout>
    <template #doc-after>...</template>
  </Theme.Layout>
</template>
```

## What it does not do

- It does not replace the default theme's home layout. A hero and features get the colors and type of the system, not a layout of their own.
- It follows VitePress 1. The class names it styles are the default theme's own, so a new major version of VitePress needs a pass over the theme's stylesheets.
