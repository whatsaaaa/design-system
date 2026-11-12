# Usage for coding agents

How to use the Whatsaaaa design system in another project. Written for a coding agent: short, in the order you need it, with the rules that are easy to get wrong.

The package is `@whatsaaaa/design-system`. It is not on npm yet. Until the first release, build this repository (`pnpm install && pnpm build`) and depend on the checkout, for example `pnpm add link:../design-system`.

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
| `@whatsaaaa/design-system/css/terminal.css` | Tab bar, prompts, status line, key caps, tags                                         |
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

Dark is the default. Light applies when the system asks for it. `data-theme="dark"` or `data-theme="light"` on `<html>` overrides the system. Do not write your own `prefers-color-scheme` rules: the tokens already switch.

```ts
import { getTheme, setTheme, toggleTheme, themeInitScript } from '@whatsaaaa/design-system/theme'

toggleTheme() // switches and remembers the choice
setTheme('system') // follows the system again
```

Run the head script before the stylesheet, so a remembered choice applies before the first paint. Inline `themeInitScript` in a `<script>`, or load it as a file: `<script src=".../theme/init.js"></script>`. It is a plain script, not a module.

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

- Long-form text: put rendered Markdown in `<article class="ws-prose">`. Wrap a table in `<div class="ws-table">` so it scrolls inside itself, and give a cell of running text `class="ws-table__text"` so a narrow frame scrolls instead of squeezing it. The docs theme does both.
- Code block with a caption: `<figure class="ws-code"><figcaption><span>file.ts</span><span>ts</span></figcaption><pre><code>...</code></pre></figure>`. For highlighting, use Shiki with `codeTheme` from `@whatsaaaa/design-system/shiki`.
- Callout: `<aside class="ws-callout ws-callout--warning"><p class="ws-callout__title">Warning</p><p>...</p></aside>`. Modifiers: `--tip`, `--warning`, `--danger`. None is a note.
- Terminal frame: `ws-term` (the window), `ws-tab-bar` with `ws-tab-bar__brand`, `ws-tabs` and `ws-tab-bar__end`, `ws-prompt` for headings, `ws-output`, `ws-status-line`. Mark the current tab with `aria-current="page"`.
- Small pieces: `ws-kbd`, `ws-tag`, `ws-tag--outline`, `ws-state` with `--active` or `--experimental`, `ws-arrow`, `ws-cursor`.

The markup of each piece is in the comment at the top of its stylesheet, and in the style guide.

## 7. Keys

A key hint in a status line has to work. Put `data-ws-key` on the control the key presses, and turn the shortcuts on:

```html
<button type="button" data-ws-key="t" aria-keyshortcuts="t">
  <kbd class="ws-kbd">t</kbd>theme
</button>
```

```ts
import { enableShortcuts } from '@whatsaaaa/design-system/shortcuts'

enableShortcuts()
```

Hints are hidden until `enableShortcuts()` runs, and below 64rem. A key works only while its hint shows. Do not show a hint any other way. Number keys go to the tabs of a `ws-tabs` bar.

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
import { type ThemeConfig, whatsaaaaConfig } from '@whatsaaaa/design-system/vitepress/config'
export default defineConfig<ThemeConfig>({ extends: whatsaaaaConfig() /* the site's own config */ })
```

Keep the site's nav, sidebar and search config as they are. Do not restyle the theme with `--vp-*` variables: change a token here instead.

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
