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

| Import                                       | What it has                                                                                                                                        |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@whatsaaaa/design-system/tokens.css`        | Every token as a CSS variable, for both themes                                                                                                     |
| `@whatsaaaa/design-system/fonts.css`         | JetBrains Mono and Inter, self-hosted, with Serbian Latin                                                                                          |
| `@whatsaaaa/design-system/css/base.css`      | Page defaults. It resets margins and list markers                                                                                                  |
| `@whatsaaaa/design-system/css/prose.css`     | Long-form text, in a `.ws-prose` container                                                                                                         |
| `@whatsaaaa/design-system/css/code.css`      | `.ws-code`, a code block with a caption                                                                                                            |
| `@whatsaaaa/design-system/css/callout.css`   | `.ws-callout`                                                                                                                                      |
| `@whatsaaaa/design-system/css/segmented.css` | `.ws-segmented`, buttons in a row with one pressed                                                                                                 |
| `@whatsaaaa/design-system/css/pairs.css`     | `.ws-pairs`, terms and their values, such as an order summary                                                                                      |
| `@whatsaaaa/design-system/css/terminal.css`  | Tab bar, prompts, status line, key caps, tags. It brings `theme.css` along                                                                         |
| `@whatsaaaa/design-system/css/theme.css`     | `ws-theme-dark` and `ws-theme-light`, for an element of one theme only                                                                             |
| `@whatsaaaa/design-system/css/ghost.css`     | Styles of `<ws-ghost>`                                                                                                                             |
| `@whatsaaaa/design-system/css/icons.css`     | The icons the callouts and prompts draw, and `--ws-icon-check`, the tick of a form. Needed with `callout.css` and `terminal.css`, and for the tick |

Everything is prefixed: classes with `ws-`, variables with `--ws-`.

### With Tailwind CSS

An app on Tailwind CSS v4, such as one on Nuxt UI, imports the Tailwind entry in place of both `tailwindcss` and `index.css`. It goes first in the app's stylesheet, before the app's other imports and its own rules:

```css
@import '@whatsaaaa/design-system/tailwind.css';
@import '@nuxt/ui'; /* a library on Tailwind, if the app has one */
```

Install `tailwindcss` 4 next to the package. Only this entry needs it.

It brings Tailwind and everything `index.css` brings, in cascade layers, so a utility wins over a class of the system and the app's rules outside any layer win over both:

| Layer        | What it has, the later winning                                    |
| ------------ | ----------------------------------------------------------------- |
| `theme`      | Tailwind's theme variables, then the tokens                       |
| `base`       | Tailwind's preflight, then the page defaults of `base.css`        |
| `components` | The system's classes: `ws-prose`, the terminal frame and the rest |
| `utilities`  | Tailwind's utilities                                              |

The tokens are Tailwind's theme, and a utility reads its token where it is used, so it follows the theme as the token does:

| Utilities                                                  | Tokens                                                           |
| ---------------------------------------------------------- | ---------------------------------------------------------------- |
| `bg-surface`, `text-text-secondary`, `border-field-border` | The color roles. Tailwind's palette is taken out                 |
| `font-mono`, `font-sans`                                   | The two families, and no others                                  |
| `text-h1`, `text-body-sm`                                  | The text styles, without their family: write `font-mono text-h1` |
| `leading-normal`, `font-semibold`                          | Line heights and weights                                         |
| `p-4`, `gap-2.5`                                           | Space, four pixels to a step: `p-4` is `--ws-space-16`           |
| `h-tab-bar`, `max-w-content`                               | The sizes, by name, for any width, height or space               |
| `rounded-md`                                               | The radii. `rounded-full` is Tailwind's own                      |
| `border-thin`                                              | The border widths. There are no shadow utilities                 |
| `ease-standard`, `transition`                              | The easings. A transition takes `--ws-motion-duration-fast`      |
| `max-lg:`                                                  | The one breakpoint: below 64rem                                  |

The entry takes out Tailwind's defaults that no token stands behind, as the system colors interface with its roles only and draws edges with borders, not shadows. As classes their utilities compile to nothing, with no error. In `@apply`, in the app's CSS or a component's `<style>` block, one fails the build with `Cannot apply unknown utility class`:

| Taken out                                    | Utilities that compile to nothing                                  | Use instead                                  |
| -------------------------------------------- | ------------------------------------------------------------------ | -------------------------------------------- |
| Tailwind's palette, white and black included | `bg-white`, `text-black`, `text-red-500`, `border-slate-200`       | A role: `bg-surface`, `text-text`            |
| Shadows                                      | `shadow-lg`, `inset-shadow-sm`, `drop-shadow-md`, `text-shadow-md` | A border: `border-thin border-border`        |
| The serif family                             | `font-serif`                                                       | `font-sans` or `font-mono`                   |
| The weights with no token                    | `font-thin`, `font-extralight`, `font-light`, `font-black`         | `font-normal` to `font-extrabold`            |
| The radii with no token                      | `rounded-2xl`, `rounded-3xl`, `rounded-4xl`                        | `rounded-xs` to `rounded-xl`, `rounded-full` |

A library imported after the entry loses them too, by design: the overlays of Nuxt UI, for example, have no shadow on the entry.

`dark:` and `light:` follow the theme as the tokens do: the nearest `data-theme` or `dark` or `light` class around the element, then the system, by the rules of [the theme](#_3-theme). The roles already switch, so use them only for what the roles do not cover. A library that defines its own `dark:` or `light:` after the entry, as Nuxt UI does, replaces the system's: import them again after it, with `@import '@whatsaaaa/design-system/tailwind/variants.css';`.

## 2. Colors

Use the role tokens. Never write a hex value, and never use a `--ws-palette-*` color for interface: a role changes with the theme and carries the contrast rules, the palette does not.

| For                                | Token                                                                                                            |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Page background                    | `--ws-color-bg`                                                                                                  |
| Panels and cards                   | `--ws-color-surface`                                                                                             |
| Inline code, hover, current item   | `--ws-color-raised`                                                                                              |
| Dividers                           | `--ws-color-border`                                                                                              |
| Outlines of inputs and buttons     | `--ws-color-field-border`                                                                                        |
| Text                               | `--ws-color-text`                                                                                                |
| Secondary text                     | `--ws-color-text-secondary`                                                                                      |
| Disabled text, idle marks          | `--ws-color-text-faint`                                                                                          |
| Brand accent                       | `--ws-color-brand`                                                                                               |
| Links, focus ring, primary button  | `--ws-color-interactive`, with `--ws-color-on-interactive` for text on it                                        |
| Primary button, hovered or pressed | `--ws-color-interactive-hover`, `--ws-color-interactive-active`                                                  |
| Tags                               | `--ws-color-tag-text` on `--ws-color-tag-bg`                                                                     |
| Status                             | `--ws-color-tip`, `-note`, `-warning`, `-danger`: each with `-text` for its label and `-tint` for its background |

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

Dark is the default. Light applies when the system asks for it. `data-theme="dark"` or `data-theme="light"` on `<html>` overrides the system, and so does a `dark` or `light` class, as Nuxt UI and VueUse's `useColorMode` set it. A library that marks light only by leaving `dark` off, such as the toggle script in Tailwind's docs or VueUse's `useDark`, needs a `light` class kept in step with it: on when light is chosen, off for dark or the system. For Tailwind's script that is `classList.toggle('light', localStorage.theme === 'light')` next to its toggle of `dark`. With no class the system decides. Do not write your own `prefers-color-scheme` rules: the tokens already switch, and an element that has to differ by theme takes a class.

```ts
import { getTheme, setTheme, toggleTheme, themeInitScript } from '@whatsaaaa/design-system/theme'

toggleTheme() // switches and remembers the choice
setTheme('system') // follows the system again
```

Run the head script before the stylesheet, so a remembered choice applies before the first paint. Inline `themeInitScript` in a `<script>`, or load it as a file: `<script src=".../theme/init.js"></script>`. It is a plain script, not a module.

The browser's own bars, such as a phone's address bar, take the background of the theme shown, `--ws-color-bg`. The head script keeps `<meta name="theme-color">` at it from the first paint on, when the theme is chosen by hand, with `setTheme`, `toggleTheme` or anything else that sets `data-theme` or the class of `<html>`, and when the system's theme changes. A page that has no theme-color tag gets one, so the head needs no tag of its own and no color in it:

```html
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <script src=".../theme/init.js"></script>
  <script src=".../shortcuts/init.js"></script>
  <link rel="stylesheet" href=".../index.css" />
</head>
```

A theme-color tag that is there, with or without `media`, takes the theme's color too. Do not set it from a script of your own. A docs site gets the same script from the base config of the docs theme.

An element for one theme only, such as a cut of a mark, takes `ws-theme-dark` or `ws-theme-light`. Put both in the page and the styles show the one of the theme in effect where it stands: the nearest `data-theme` or `dark` or `light` class, on `<html>` or on an element around it, or the system's theme. So the right one shows before any script runs. Do not swap them from a script.

```html
<img class="ws-theme-dark" src="mark-on-dark.svg" alt="whatsaaaa" width="32" height="32" />
<img class="ws-theme-light" src="mark-on-light.svg" alt="whatsaaaa" width="32" height="32" />
```

On a page with a status line, its theme button is the theme switch at every width: see [the status line](#status-line).

`data-theme` also works on any element, to keep a part of a page in one theme, and so does the class. Where they meet:

- On one element, `data-theme` wins over the class. An element with both the `dark` and the `light` class chooses nothing.
- The nearest choice around an element holds for it, made either way: a `light` part in a page with `data-theme="dark"` is light.
- Any choice, the attribute or the class, wins over the system's theme.

So a `dark` or `light` class you give an element for something else puts what is inside it in that theme. Use another name for it.

`setTheme` and `toggleTheme` write `data-theme`, and `getTheme` reads it, then the class of `<html>`. In an app whose color mode library owns the class, such as Nuxt UI or `useColorMode`, switch the theme with the library and leave `data-theme` alone: do not call `setTheme` or `toggleTheme`, because the attribute they write wins over the library's class from then on. Keep the head script for the browser's bars. With nothing remembered under `ws-theme` it sets no `data-theme`, and it follows the class. So do not give the library that storage key. An app that called `setTheme` or `toggleTheme` before, such as from a script that bridged the two, has visitors with a choice still remembered there. Remove it before the head script runs, with `localStorage.removeItem('ws-theme')`, or the `data-theme` the head script sets from it wins over the library's class on every load.

## 4. Type

Two families: `--ws-font-family-mono` (JetBrains Mono) for headings, labels, navigation and code, `--ws-font-family-sans` (Inter) for long-form text and field values.

Use a text style, not a size. A style is two lines:

```css
.title {
  font: var(--ws-text-h1);
  letter-spacing: var(--ws-text-h1-letter-spacing);
}
```

Styles: `display`, `h1`, `h2`, `h3`, `h4`, `tagline` (the line under the display name), `lead`, `body`, `body-sm`, `label`, `label-sm`, `caption`, `overline` (set it in uppercase) and `code`. Below 64rem use `display-compact`, `h1-compact`, `h2-compact` and `tagline-compact`.

Do not load other fonts, and do not load these from a CDN. Set `font-variant-ligatures: none` on anything that shows code.

## 5. Space, radius, motion

- Space: `--ws-space-2` to `--ws-space-64`, named by px, set in rem. Use them for padding, margin and gap.
- Sizes: `--ws-size-control` (40 px) is the height of a one-line field, a button and a segmented control. `--ws-size-check` (20 px) is a checkbox or a radio button and `--ws-size-step` (24 px) the circle of a step number. Use them for those, not a space token.
- Radius: `--ws-radius-xs` (key caps), `-sm` (inline code, tags), `-md` (inputs, buttons), `-lg` (blocks, cards), `-xl` (the window), `-full` (dots).
- Borders, not shadows: `--ws-border-width-thin`, `-medium`, `-thick`.
- Motion: `--ws-motion-duration-fast`, `-base`, `-slow` with `--ws-motion-easing-standard`. Wrap movement in `@media (prefers-reduced-motion: no-preference)`.
- One breakpoint: `@media (width < 64rem)`.

## 6. Classes

- Long-form text: put rendered Markdown in `<article class="ws-prose">`. Wrap a table in `<div class="ws-table">` so it scrolls inside itself, and give a cell of running text `class="ws-table__text"` so a narrow frame scrolls instead of squeezing it. A first cell stays on one line unless it has that class. The docs theme does both.
- Code block with a caption: `<figure class="ws-code"><figcaption><span>file.ts</span><span>ts</span></figcaption><pre><code>...</code></pre></figure>`. For highlighting, use Shiki with `codeTheme` from `@whatsaaaa/design-system/shiki`. See [code blocks](#code-blocks).
- Callout: `<aside class="ws-callout ws-callout--warning"><p class="ws-callout__title">Warning</p><p>...</p></aside>`. Modifiers: `--tip`, `--warning`, `--danger`. None is a note.
- Terminal frame: `ws-term` (the window), `ws-tab-bar` with `ws-tab-bar__brand`, `ws-tabs` and `ws-tab-bar__end`, `ws-prompt` for headings, `ws-output`, `ws-status-line`. Mark the current tab with `aria-current="page"`.
- Small pieces: `ws-kbd`, `ws-tag`, `ws-tag--outline`, `ws-state` with `--active` or `--experimental`, `ws-arrow`, `ws-cursor`, and `ws-visually-hidden` for text that only assistive technology reads.
- Forms: `ws-segmented` and `ws-pairs`. See [forms](#forms).

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

### Forms

The system draws no fields and no buttons: draw them from the roles, with these.

- **One height.** A one-line field, a button and a segmented control are `--ws-size-control` tall. A checkbox or a radio button is `--ws-size-check`, a step number's circle `--ws-size-step`.
- **The primary button** is filled with `--ws-color-interactive`, its label `--ws-color-on-interactive`. Under the pointer it takes `--ws-color-interactive-hover`, while pressed `--ws-color-interactive-active`. Do not mix a hover color of your own.
- **A tick** is `--ws-icon-check` from `css/icons.css`, a mask like the other icons: a ticked box, a done step, a sent form. Draw it at 1rem in `currentcolor`, or `--ws-color-on-interactive` on a checked box.
- **A number field has no spin buttons.** `base.css` hides the browser's own, and the arrow keys still step the value. Without `base.css`, hide them the same way: `appearance: textfield` on the field, and `appearance: none` on its `::-webkit-inner-spin-button` and `::-webkit-outer-spin-button`.

A **segmented control** is a few buttons with one pressed, such as a switch between the languages of a page:

```html
<div class="ws-segmented" role="group" aria-label="Language">
  <button type="button" aria-pressed="true" lang="en">English</button>
  <button type="button" aria-pressed="false" lang="sr">Srpski</button>
</div>
```

- Give the group a name with `aria-label`, and each button `aria-pressed`. Pressing a button presses it and releases the one that was pressed. Pressing the pressed one does nothing.
- Keys: each button is a stop of the Tab key, and Enter or Space presses it. No arrow keys: those belong to a radio group. A choice that is a value of a form, sent with it, is a group of radio buttons, not this.
- The pressed button is raised, in the text color, with an edge of the interactive color twice as thick, at least 3:1 on the page and on the raised fill. In forced colors it takes the system's selection colors. Do not fill it with the interactive color: next to a primary button it would be as loud.

**Terms and values**, a row each, are a `<dl class="ws-pairs">`: the answers of a form on its review step. The term is in the voice of a label, its value in the face of a field. The terms share a column as wide as the longest of them, at most two fifths of the row, so the values line up and have the rest of it. With `ws-pairs--amounts` the amounts take what the widest of them needs, and the terms the rest of the row. A long value wraps: give a long email or URL a `<wbr />` after its `@` or a `/`, so it breaks there. A value that still does not fit breaks anywhere, as a last resort.

```html
<dl class="ws-pairs ws-pairs--amounts">
  <div>
    <dt>2 × workshop ticket</dt>
    <dd>€96.00</dd>
  </div>
  <div>
    <dt>Lunch</dt>
    <dd>€12.50</dd>
  </div>
  <div>
    <dt>Booking fee</dt>
    <dd>€1.00</dd>
  </div>
  <div class="ws-pairs__total">
    <dt>Total</dt>
    <dd>€109.50</dd>
  </div>
</dl>
```

- `ws-pairs--amounts` is for money and other numbers: each value at the right edge, in figures of one width, so the digits of the rows line up. Write each amount whole, with its currency and the same number of decimals.
- `ws-pairs__total` is the last row: set off by a solid rule, and semibold.

### Code blocks

- **A block scrolls sideways.** One that shows what a person typed, which a phone would cut off, takes `ws-code--wrap` and wraps its lines instead.
- **Its lines hang.** When each line is a `<span class="line">` with `--ws-code-hang`, its indent in characters plus two, the rest of a wrapped line starts one level in from the line's own text. With Shiki, the `hangingIndent` transformer gives each line its own:

```ts
import { codeTheme, hangingIndent } from '@whatsaaaa/design-system/shiki'

const html = highlighter.codeToHtml(json, {
  lang: 'json',
  theme: codeTheme,
  transformers: [hangingIndent()],
})
```

- **Shiki is large.** With one language and the JavaScript engine it is about 40 KB gzipped, enough to push a small app past a bundler's chunk warning. When code blocks are not on the first screen, load it when a block needs it, with a dynamic `import()` of `shiki/core`, its JavaScript engine and the languages you use, so it is a chunk of its own: show the code as plain text in `--ws-code-text` first, and the colors when they arrive. For one small language, such as the JSON a form sends, a tokenizer of your own that colors with the `--ws-syntax-*` tokens needs no Shiki at all.

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
import { defineGhost, ghostElement, ghostMarkup, ghostSvg } from '@whatsaaaa/design-system/ghost'

defineGhost() // registers <ws-ghost>, in the browser
```

- `<ws-ghost px="6"></ws-ghost>` is the ghost with the easter egg. Render `ghostMarkup({ px: 6 })` inside it on the server. It fills itself in when it is empty, and draws its speech bubble, without setting `innerHTML`.
- `ghostSvg({ px: 2 })` is the ghost as a picture, for a link or a decoration. `ghostElement({ px: 2 })` is the same picture as an element, for a script that adds it with `append`.
- In a component, where markup would need `innerHTML`, `v-html` or `dangerouslySetInnerHTML`, take the files instead: `ghost-on-dark.svg` and `ghost-on-light.svg`, the ghost without the margin of its grid, 20 by 24. Put both in, with `ws-theme-dark` and `ws-theme-light`.
- `px` is the size of one sprite pixel. Use whole numbers. A large ghost, such as the one next to the display name, takes `compact-px="4"` too: its size below 64rem, from 1 to 5.

Do not recolor the ghost, do not draw on it, do not rotate or stretch it, and do not redraw it. Its tongue is always the brand color. On a project's site the ghost links to the handle's site, and the project's own sprite is the logo.

## 9. Assets

Generated files are in `assets/<name>/`, for `whatsaaaa` and for each project. `assets/manifest.json` lists every file with its size and use.

| Need                   | File                                                                                                   |
| ---------------------- | ------------------------------------------------------------------------------------------------------ |
| Favicon                | `favicon.ico`, `favicon.svg`, `apple-touch-icon.png`. `icon-192.png` and `icon-512.png` for a manifest |
| Logo on any background | `mark.svg`                                                                                             |
| Logo in a header       | `mark-on-dark.svg`, `mark-on-light.svg`, or `mark-mono.svg` to take the text color                     |
| The ghost in a link    | `ghost-on-dark.svg`, `ghost-on-light.svg`, the handle's only                                           |
| Name                   | `wordmark-dark.svg`, `wordmark-light.svg`                                                              |
| Logo with name         | `lockup-dark.svg`, `lockup-light.svg`                                                                  |
| Top of a README        | `readme-header.svg`                                                                                    |
| Link preview           | `social-card.png`                                                                                      |
| Gravatar header        | `profile-banner.png` (handle only). Profile colors: dark `bg`, `surface`, `interactive`                |

Copy the files you need into the project. Show a mark at 16, 32, 48 or 64 px, where its pixels are sharp.

A mark's box is its whole 16 by 16 grid, with the empty pixels around the sprite. A project's sprite leaves two columns empty on each side, an eighth of the width, so at 32 px its pixels start 4 px inside the box. To put them on an edge, such as the edge the content of a page starts at, pull the image out by that much: `margin-inline: calc(-1 * var(--ws-space-4))` at 32 px. The ghost's files have no margin.

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
