# Usage for coding agents

How to use the Whatsaaaa design system in another project. Written for a coding agent: short, in the order you need it, with the rules that are easy to get wrong.

The package is `@whatsaaaa/design-system`, on npm:

```sh
pnpm add @whatsaaaa/design-system
```

## 1. Load the styles

One import has everything: fonts, tokens, page defaults and every class.

```css
@import '@whatsaaaa/design-system/index.css';
```

Or take pieces. `tokens.css` and `fonts.css` first, then what you use:

| Import                                      | What it has                                                                           |
| ------------------------------------------- | ------------------------------------------------------------------------------------- |
| `@whatsaaaa/design-system/tokens.css`       | Every token as a CSS variable, for both themes                                        |
| `@whatsaaaa/design-system/fonts.css`        | JetBrains Mono and Inter, self-hosted, with Serbian Latin                             |
| `@whatsaaaa/design-system/css/base.css`     | Page defaults. It resets margins and list markers                                     |
| `@whatsaaaa/design-system/css/prose.css`    | Long-form text, in a `.ws-prose` container                                            |
| `@whatsaaaa/design-system/css/code.css`     | `.ws-code`, a code block with a caption                                               |
| `@whatsaaaa/design-system/css/callout.css`  | `.ws-callout`                                                                         |
| `@whatsaaaa/design-system/css/terminal.css` | Tab bar, prompts, status line, key caps, tags. It brings `theme.css` along            |
| `@whatsaaaa/design-system/css/theme.css`    | `ws-theme-dark` and `ws-theme-light`, for an element of one theme only                |
| `@whatsaaaa/design-system/css/ghost.css`    | Styles of `<ws-ghost>`                                                                |
| `@whatsaaaa/design-system/css/icons.css`    | The icons the callouts and prompts draw. Needed with `callout.css` and `terminal.css` |

Everything is prefixed: classes with `ws-`, variables with `--ws-`.

## 2. Colors

Use the role tokens. Never write a hex value, and never use a `--ws-palette-*` color for interface: a role changes with the theme and carries the contrast rules, the palette does not.

| For                               | Token                                                                                                            |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Page background                   | `--ws-color-bg`                                                                                                  |
| Panels and cards                  | `--ws-color-surface`                                                                                             |
| Inline code, hover, current item  | `--ws-color-raised`                                                                                              |
| Dividers                          | `--ws-color-border`                                                                                              |
| Outlines of inputs and buttons    | `--ws-color-field-border`                                                                                        |
| Text                              | `--ws-color-text`                                                                                                |
| Secondary text                    | `--ws-color-text-secondary`                                                                                      |
| Disabled text, idle marks         | `--ws-color-text-faint`                                                                                          |
| Brand accent                      | `--ws-color-brand`                                                                                               |
| Links, focus ring, primary button | `--ws-color-interactive`, with `--ws-color-on-interactive` for text on it                                        |
| Tags                              | `--ws-color-tag-text` on `--ws-color-tag-bg`                                                                     |
| Status                            | `--ws-color-tip`, `-note`, `-warning`, `-danger`: each with `-text` for its label and `-tint` for its background |

Rules:

- **Brand is not for controls.** `--ws-color-brand` is the accent and the color of an error. Buttons, links, focus and checked controls use `--ws-color-interactive`.
- **Brand is for graphics and large type.** For small text on the brand color use `--ws-color-on-brand` on `--ws-color-brand-fill`.
- **Faint is never body text.** `--ws-color-text-faint` is 3:1.
- **Status text uses the `-text` token**, not the status color. On the light theme the two differ.
- **A status is never color alone.** Give it a label, an icon or a word.
- **Code blocks are dark in both themes.** Use `--ws-code-*` and `--ws-syntax-*` for them, not the roles.
- **No placeholders in fields.** Put the hint under the field.

The pairs that are checked for contrast are in `tokens/contrast.json`. If you need a new pair, add it there.

## 3. Theme

Dark is the default. Light applies when the system asks for it. `data-theme="dark"` or `data-theme="light"` on `<html>` overrides the system. Do not write your own `prefers-color-scheme` rules: the tokens already switch, and an element that has to differ by theme takes a class.

```ts
import { getTheme, setTheme, toggleTheme, themeInitScript } from '@whatsaaaa/design-system/theme'

toggleTheme() // switches and remembers the choice
setTheme('system') // follows the system again
```

Run the head script before the stylesheet, so a remembered choice applies before the first paint. Inline `themeInitScript` in a `<script>`, or load it as a file: `<script src=".../theme/init.js"></script>`. It is a plain script, not a module.

The browser's own bars, such as a phone's address bar, take the background of the theme shown, `--ws-color-bg`. The head script keeps `<meta name="theme-color">` at it from the first paint on, when the theme is chosen by hand, with `setTheme`, `toggleTheme` or anything else that sets `data-theme`, and when the system's theme changes. A page that has no theme-color tag gets one, so the head needs no tag of its own and no color in it:

```html
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <script src=".../theme/init.js"></script>
  <script src=".../shortcuts/init.js"></script>
  <link rel="stylesheet" href=".../index.css" />
</head>
```

A theme-color tag that is there, with or without `media`, takes the theme's color too. Do not set it from a script of your own.

An element for one theme only, such as a cut of a mark, takes `ws-theme-dark` or `ws-theme-light`. Put both in the page and the styles show the one of the theme in effect where it stands: the nearest `data-theme`, on `<html>` or on an element around it, or the system's theme. So the right one shows before any script runs. Do not swap them from a script.

```html
<img class="ws-theme-dark" src="mark-on-dark.svg" alt="whatsaaaa" width="32" height="32" />
<img class="ws-theme-light" src="mark-on-light.svg" alt="whatsaaaa" width="32" height="32" />
```

On a page with a status line, its theme button is the theme switch at every width: see [the status line](#status-line).

`data-theme` also works on any element, to keep a part of a page in one theme.

## 4. Type

Two families: `--ws-font-family-mono` (JetBrains Mono) for headings, labels, navigation and code, `--ws-font-family-sans` (Inter) for long-form text and field values.

Use a text style, not a size. A style is two lines:

```css
.title {
  font: var(--ws-text-h1);
  letter-spacing: var(--ws-text-h1-letter-spacing);
}
```

Styles: `display`, `h1`, `h2`, `h3`, `h4`, `lead`, `body`, `body-sm`, `label`, `label-sm`, `caption`, `overline` (set it in uppercase) and `code`. Below 64rem use `display-compact`, `h1-compact` and `h2-compact`.

Do not load other fonts, and do not load these from a CDN. Set `font-variant-ligatures: none` on anything that shows code.

## 5. Space, radius, motion

- Space: `--ws-space-2` to `--ws-space-64`, named by px, set in rem. Use them for padding, margin and gap.
- Radius: `--ws-radius-xs` (key caps), `-sm` (inline code, tags), `-md` (inputs, buttons), `-lg` (blocks, cards), `-xl` (the window), `-full` (dots).
- Borders, not shadows: `--ws-border-width-thin`, `-medium`, `-thick`.
- Motion: `--ws-motion-duration-fast`, `-base`, `-slow` with `--ws-motion-easing-standard`. Wrap movement in `@media (prefers-reduced-motion: no-preference)`.
- One breakpoint: `@media (width < 64rem)`.

## 6. Classes

- Long-form text: put rendered Markdown in `<article class="ws-prose">`. Wrap a table in `<div class="ws-table">` so it scrolls inside itself, and give a cell of running text `class="ws-table__text"` so a narrow frame scrolls instead of squeezing it. A first cell stays on one line unless it has that class. The docs theme does both.
- Code block with a caption: `<figure class="ws-code"><figcaption><span>file.ts</span><span>ts</span></figcaption><pre><code>...</code></pre></figure>`. For highlighting, use Shiki with `codeTheme` from `@whatsaaaa/design-system/shiki`.
- Callout: `<aside class="ws-callout ws-callout--warning"><p class="ws-callout__title">Warning</p><p>...</p></aside>`. Modifiers: `--tip`, `--warning`, `--danger`. None is a note.
- Terminal frame: `ws-term` (the window), `ws-tab-bar` with `ws-tab-bar__brand`, `ws-tabs` and `ws-tab-bar__end`, `ws-prompt` for headings, `ws-output`, `ws-status-line`. Mark the current tab with `aria-current="page"`.
- Small pieces: `ws-kbd`, `ws-tag`, `ws-tag--outline`, `ws-state` with `--active` or `--experimental`, `ws-arrow`, `ws-cursor`, and `ws-visually-hidden` for text that only assistive technology reads.

The markup of each piece is in the comment at the top of its stylesheet, and in the style guide.

### Status line

```html
<footer class="ws-status-line">
  <span class="ws-status-line__mode">NORMAL</span>
  <span class="ws-status-line__path">
    <span class="ws-status-line__file"><span>~/guide/conditions.md</span></span>
  </span>
  <!-- the key hints and the keys switch, see section 7 -->
  <button type="button" class="ws-status-line__theme">
    <span class="ws-visually-hidden">Switch theme, now</span>
    <span class="ws-theme-dark">rose-pine</span>
    <span class="ws-theme-light">rose-pine-dawn</span>
  </button>
</footer>
```

- **The mode** says whether the key hints work. It reads `NORMAL`, and `INSERT` while the focus is in a field, where a key is typed and not a shortcut. Use those two words and no others. `isTyping` from `@whatsaaaa/design-system/shortcuts` tells which: check `isTyping(document.activeElement)` on `focusin` and `focusout`. A page without fields stays `NORMAL`.
- **The path** goes in `ws-status-line__path`, which takes the room the other items leave and puts the items after it at the right edge. The path gives way to them on its own: it is cut with an ellipsis, and when not even its first character fits, it goes as a whole. Write no breakpoint or width for it. A status line without a path puts `<span class="ws-status-line__spacer"></span>` where the path would be.
- **The theme button** names the theme shown and switches it, at every width: below 64rem, where the key hints are hidden, it is the only theme switch. Call `toggleTheme` when it is clicked. It holds both names, and the styles show the one of the theme, so the name is right before any script runs and the button keeps the focus when the theme changes. Its name for assistive technology is "Switch theme, now rose-pine". Where the key hints show, keep the theme's `t` hint as well.
- An item for wide screens only takes `ws-status-line__item--wide`, and one with a border on its left `ws-status-line__item--edge`.
- A focus ring in the window's bars is drawn inside its control, so neither the bars nor the window's corners cut it off. A control of your own in a bar does the same: `outline-offset: calc(-1 * var(--ws-border-width-medium))`.

## 7. Keys

A key hint in a status line has to work. Put `data-ws-key` on the control the key presses, give the status line the keys switch, and turn the shortcuts on:

```html
<span class="ws-status-line__keys">
  <button type="button" data-ws-key="t"><kbd class="ws-kbd">t</kbd>theme</button>
</span>
<button
  type="button"
  class="ws-status-line__switch"
  role="switch"
  aria-label="Shortcut keys"
  data-ws-keys-switch
>
  keys
  <span class="ws-status-line__on" aria-hidden="true">on</span>
  <span class="ws-status-line__off" aria-hidden="true">off</span>
</button>
```

```ts
import { enableShortcuts } from '@whatsaaaa/design-system/shortcuts'

enableShortcuts()
```

Hints are hidden until `enableShortcuts()` runs, and below 64rem. A key works only while its hint shows. Do not show a hint any other way. Number keys go to the tabs of a `ws-tabs` bar. Keys typed into a field, and keys pressed with Ctrl, Alt or Cmd, are left alone. A held key acts once: the repeats a keyboard sends while the key is down do nothing.

The switch is not optional. The keys are single characters that act on the whole page, so a visitor has to be able to turn them off (WCAG 2.1.4): it matters most with speech input, where a dictated word presses them, and for someone who presses keys without meaning to.

- It reads "keys on" or "keys off". Pressing it turns every key off or on again, and the browser remembers the choice.
- Put it in the status line, outside `ws-status-line__keys`: unlike the hints it shows at every width, because the number of a tab is a key at every width.
- Do not write `aria-checked` on the switch or `aria-keyshortcuts` on a control. The module sets both while they are true, and the switch stays hidden until it has its state.
- With the keys off the controls stay and work by hand. What names a key goes: the key caps and the numbers of the tabs. Hide a control that is nothing but a key cap with `[data-ws-keys='off']`.
- A key acts only on a page that has the switch. A page without the switch has no shortcuts.
- Load `shortcuts/init.js` in the head, next to `theme/init.js`, or inline `keysInitScript`. It marks the page before the first paint when the keys are remembered as off, so the tab numbers are not drawn first and then taken away.

## 8. The ghost

```ts
import { defineGhost, ghostMarkup, ghostSvg } from '@whatsaaaa/design-system/ghost'

defineGhost() // registers <ws-ghost>, in the browser
```

- `<ws-ghost px="6"></ws-ghost>` is the ghost with the easter egg. Render `ghostMarkup({ px: 6 })` inside it on the server.
- `ghostSvg({ px: 2 })` is the ghost as a picture, for a link or a decoration.
- `px` is the size of one sprite pixel. Use whole numbers.

Do not recolor the ghost, do not draw on it, do not rotate or stretch it, and do not redraw it. Its tongue is always the brand color. On a project's site the ghost links to the handle's site, and the project's own sprite is the logo.

## 9. Assets

Generated files are in `assets/<name>/`, for `whatsaaaa` and for each project. `assets/manifest.json` lists every file with its size and use.

| Need                   | File                                                                                                   |
| ---------------------- | ------------------------------------------------------------------------------------------------------ |
| Favicon                | `favicon.ico`, `favicon.svg`, `apple-touch-icon.png`. `icon-192.png` and `icon-512.png` for a manifest |
| Logo on any background | `mark.svg`                                                                                             |
| Logo in a header       | `mark-on-dark.svg`, `mark-on-light.svg`, or `mark-mono.svg` to take the text color                     |
| Name                   | `wordmark-dark.svg`, `wordmark-light.svg`                                                              |
| Logo with name         | `lockup-dark.svg`, `lockup-light.svg`                                                                  |
| Top of a README        | `readme-header.svg`                                                                                    |
| Link preview           | `social-card.png`                                                                                      |

Copy the files you need into the project. Show a mark at 16, 32, 48 or 64 px, where its pixels are sharp.

Never edit a file in `assets/`. To change artwork, change its source and run `pnpm assets` in this repository. For a project that has no kit yet, add a file like `identity/projects/form-builder.json` first.

## 10. Docs sites

A VitePress site uses the theme and its base config together:

```ts
// .vitepress/theme/index.ts
export { default } from '@whatsaaaa/design-system/vitepress'

// .vitepress/config.ts
import { defineConfigWithTheme } from 'vitepress'
import { type ThemeConfig, whatsaaaaConfig } from '@whatsaaaa/design-system/vitepress/config'
export default defineConfigWithTheme<ThemeConfig>({
  extends: whatsaaaaConfig() /* the site's own config */,
})
```

Keep the site's nav, sidebar and search config as they are. Do not restyle the theme with `--vp-*` variables: change a token here instead.

From 60rem up the brand has a box as wide as the sidebar, 17rem with the sidebar's padding, and the first tab starts on the sidebar's border, on pages without a sidebar too. With a logo there is room for about 23 characters in the site title, without one about 28. A longer title is cut with an ellipsis: shorten it with `themeConfig.siteTitle`. A short one leaves a gap before the tabs. The labels of the tabs have no such limit: a long one moves the tabs after it. Below 60rem there is no sidebar and the tabs follow the brand, and on a phone they take a row of their own under it.

## 11. Data

The tokens as data, for code that cannot read CSS:

```ts
import { resolver } from '@whatsaaaa/design-system/tokens'

const dark = resolver.apply({ theme: 'dark' })
dark['color.bg'].$value.hex // '#191724'
```

The sources are in `tokens/`, in the Design Tokens Community Group format.

## Before you finish

- No hex values, no `--ws-palette-*` in interface code, no fonts from elsewhere.
- It reads in both themes. Check with `data-theme="light"` on `<html>`.
- Nothing overflows sideways at 390 px.
- Every key hint works, every status has a word, every control can be reached and seen with the keyboard.
