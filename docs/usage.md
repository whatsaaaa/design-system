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

| Import                                       | What it has                                                                                                                                                                          |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `@whatsaaaa/design-system/tokens.css`        | Every token as a CSS variable, for both themes                                                                                                                                       |
| `@whatsaaaa/design-system/fonts.css`         | JetBrains Mono and Inter, self-hosted, with Serbian Latin                                                                                                                            |
| `@whatsaaaa/design-system/css/base.css`      | Page defaults. It resets margins and list markers                                                                                                                                    |
| `@whatsaaaa/design-system/css/prose.css`     | Long-form text, in a `.ws-prose` container                                                                                                                                           |
| `@whatsaaaa/design-system/css/code.css`      | `.ws-code`, a code block with a caption                                                                                                                                              |
| `@whatsaaaa/design-system/css/callout.css`   | `.ws-callout`                                                                                                                                                                        |
| `@whatsaaaa/design-system/css/segmented.css` | `.ws-segmented`, buttons in a row with one pressed                                                                                                                                   |
| `@whatsaaaa/design-system/css/pairs.css`     | `.ws-pairs`, terms and their values, such as an order summary, and `.ws-pairs-group`                                                                                                 |
| `@whatsaaaa/design-system/css/terminal.css`  | Tab bar, prompts, status line, key caps, tags. It brings `theme.css` along                                                                                                           |
| `@whatsaaaa/design-system/css/theme.css`     | `ws-theme-dark` and `ws-theme-light`, for an element of one theme only                                                                                                               |
| `@whatsaaaa/design-system/css/ghost.css`     | Styles of `<ws-ghost>`                                                                                                                                                               |
| `@whatsaaaa/design-system/css/icons.css`     | The icons the callouts and prompts draw, and the icons of a form: `--ws-icon-check`, the tick, and `--ws-icon-calendar`. Needed with `callout.css` and `terminal.css`, and for those |

Everything is prefixed: classes with `ws-`, variables with `--ws-`.

### With Tailwind CSS

An app on Tailwind CSS v4 imports the Tailwind entry in place of both `tailwindcss` and `index.css`. It goes first in the app's stylesheet, before the app's other imports and its own rules:

```css
@import '@whatsaaaa/design-system/tailwind.css';
@import '@nuxt/ui'; /* a library on Tailwind, if the app has one */
@import '@whatsaaaa/design-system/tailwind/variants.css'; /* after a library with its own dark: and light: */
```

Install `tailwindcss` 4.3.5 or a later 4.x next to the package. Only this entry needs it.

An app on Nuxt UI imports `@whatsaaaa/ui-vue/index.css` alone, in place of the three lines above: it brings them, and Nuxt UI's colors on the roles.

The entry brings Tailwind and everything `index.css` brings, in cascade layers, so a utility wins over a class of the system and the app's rules outside any layer win over both:

| Layer        | What it has, the later winning                                    |
| ------------ | ----------------------------------------------------------------- |
| `theme`      | Tailwind's theme variables, then the tokens                       |
| `base`       | Tailwind's preflight, then the page defaults of `base.css`        |
| `components` | The system's classes: `ws-prose`, the terminal frame and the rest |
| `utilities`  | Tailwind's utilities                                              |

The tokens are Tailwind's theme, and a utility reads its token where it is used, so it follows the theme as the token does:

| Utilities                                                  | Tokens                                                                          |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `bg-surface`, `text-text-secondary`, `border-field-border` | The color roles. Tailwind's palette is taken out                                |
| `font-mono`, `font-sans`                                   | The two families, and no others                                                 |
| `text-h1`, `text-body-sm`                                  | The text styles, without their family: write `font-mono text-h1`                |
| `leading-normal`, `font-semibold`                          | Line heights and weights                                                        |
| `p-4`, `gap-2.5`                                           | Space, four pixels to a step: `p-4` is `--ws-space-16`                          |
| `h-tab-bar`, `max-w-content`                               | The sizes, by name, for any width, height or space                              |
| `rounded-md`                                               | The radii, by name only, so no bare `rounded`. `rounded-full` is Tailwind's own |
| `border-thin`                                              | The border widths. There are no shadow utilities                                |
| `ease-standard`, `transition`                              | The easings. A transition takes `--ws-motion-duration-fast`                     |
| `max-lg:`, `max-sm:`                                       | The two breakpoints: below 64rem and below 40rem                                |

The entry takes out Tailwind's defaults that no token stands behind, as the system colors interface with its roles only and draws edges with borders, not shadows. As classes their utilities compile to nothing, with no error. In `@apply`, in the app's CSS or a component's `<style>` block, one fails the build with `Cannot apply unknown utility class`:

| Taken out                                    | Utilities that compile to nothing                                                                             | Use instead                                                                             |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Tailwind's palette, white and black included | `bg-white`, `text-black`, `text-red-500`, `border-slate-200`                                                  | A role: `bg-surface`, `text-text`                                                       |
| Shadows                                      | `shadow`, `shadow-lg`, `inset-shadow-sm`, `drop-shadow`, `text-shadow-md`                                     | A border: `border-thin border-border`                                                   |
| The serif family                             | `font-serif`                                                                                                  | `font-sans` or `font-mono`                                                              |
| The weights with no token                    | `font-thin`, `font-extralight`, `font-light`, `font-black`                                                    | `font-normal` to `font-extrabold`                                                       |
| The radii with no token                      | `rounded` and its sides and corners, such as `rounded-t` and `rounded-tl`, and `rounded-2xl` to `rounded-4xl` | `rounded-sm`, the same 4px, for `rounded`. `rounded-xs` to `rounded-xl`, `rounded-full` |

A library imported after the entry loses them too, by design: the overlays of Nuxt UI, for example, have no shadow on the entry.

`dark:` and `light:` follow the theme as the tokens do: the nearest `data-theme` or `dark` or `light` class around the element, then the system, by the rules of section 3, Theme. The roles already switch, so use them only for what the roles do not cover. A library that defines its own `dark:` or `light:` after the entry, as Nuxt UI does, replaces the system's: import them again after it, with `@import '@whatsaaaa/design-system/tailwind/variants.css';`.

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
| Brand accent, where you are        | `--ws-color-brand`, with `--ws-color-on-brand` on `--ws-color-brand-fill` for small text                         |
| Links, focus ring, primary button  | `--ws-color-interactive`, with `--ws-color-on-interactive` for text on it                                        |
| Primary button, hovered or pressed | `--ws-color-interactive-hover`, `--ws-color-interactive-active`                                                  |
| Tags                               | `--ws-color-tag-text` on `--ws-color-tag-bg`                                                                     |
| Status                             | `--ws-color-tip`, `-note`, `-warning`, `-danger`: each with `-text` for its label and `-tint` for its background |
| An error                           | `--ws-color-danger` for the border and icon, `--ws-color-danger-text` for the message                            |

Rules:

- **Brand is not for controls.** What you press, and its hover, focus and checked states, uses `--ws-color-interactive`: buttons, links, the focus ring, checked boxes. `--ws-color-brand` is the accent: the mark, the cursor, a prompt's chevron, and the marks of where you are, such as the bar and number of the current tab and the mode of the status line. A mark of where you are may sit on a control, as on the current tab, because it says where you are, not what to press. So the current step of a form takes brand too: its number in `--ws-color-on-brand` on `--ws-color-brand-fill`.
- **An error uses the danger tokens, not brand.** A field in error takes `--ws-color-danger` for its border and its icon, and its message `--ws-color-danger-text`. On the dark theme they have the value of brand, but they are other roles: on the light theme brand is too light for small text, and the message takes the text color.
- **Brand is for graphics and large type.** For small text on the brand color use `--ws-color-on-brand` on `--ws-color-brand-fill`. For small text in the brand red, such as the required mark of a field, use `--ws-color-brand-text`, which reads at 4.5:1 in both themes.
- **Faint is never body text.** `--ws-color-text-faint` is 3:1.
- **Status text uses the `-text` token**, not the status color. On the light theme the two differ.
- **A status is never color alone.** Give it a label, an icon or a word.
- **Code blocks are dark in both themes.** Use `--ws-code-*` and `--ws-syntax-*` for them, not the roles.
- **No placeholders in fields.** Put the hint under the field.

The pairs that are checked for contrast are in `tokens/contrast.json`, and those of the component tokens of section 12 follow from their names. If you need a new pair, add it there.

### Lint

`@whatsaaaa/design-system/stylelint` is a stylelint config that holds a project's stylesheets to these rules: a hex value, a named color or a color written with one of the functions `rgb`, `rgba`, `hsl`, `hsla`, `oklch`, `oklab`, `lab`, `lch` and `hwb` is an error, and so is a variable that nothing defines, so a token cannot be misspelled. It knows every token of the version installed, the component tier's too, wherever the project and the linter run. It extends `stylelint-config-standard`. Install `stylelint` 18, `stylelint-config-standard` 41 and `stylelint-value-no-unknown-custom-properties` 6.1.1 or later in their major next to the package. Only this entry needs them.

```js
// stylelint.config.js
export default {
  extends: ['@whatsaaaa/design-system/stylelint'],
}
```

Add the project's own lines after it: `ignoreFiles`, `customSyntax: 'postcss-html'` for `.vue` files in an override, or a rule it turns off. Options of a rule replace the config's, so a project whose stylesheets also read variables from elsewhere lists the tokens again with them:

```js
import { fileURLToPath } from 'node:url'

export default {
  extends: ['@whatsaaaa/design-system/stylelint'],
  rules: {
    'csstools/value-no-unknown-custom-properties': [
      true,
      {
        importFrom: [
          fileURLToPath(import.meta.resolve('@whatsaaaa/design-system/tokens.css')),
          'src/styles/app-vars.css',
        ],
      },
    ],
  },
}
```

## 3. Theme

Dark is the default. Light applies when the system asks for it. `data-theme="dark"` or `data-theme="light"` on `<html>` overrides the system, and so does a `dark` or `light` class, as Nuxt UI and VueUse's `useColorMode` set it. A library that marks light only by leaving `dark` off, such as the toggle script in Tailwind's docs or VueUse's `useDark`, needs a `light` class kept in step with it: on when light is chosen, off for dark or the system. For Tailwind's script that is `classList.toggle('light', localStorage.theme === 'light')` next to its toggle of `dark`. With no class the system decides. Do not write your own `prefers-color-scheme` rules: the tokens already switch, and an element that has to differ by theme takes a class.

```ts
import { getTheme, setTheme, toggleTheme, themeInitScript } from '@whatsaaaa/design-system/theme'

toggleTheme() // switches and remembers the choice
setTheme('system') // follows the system again
```

Run the head script before the stylesheet, so a remembered choice applies before the first paint. Inline `themeInitScript` in a `<script>`, or load it as a file: `<script src=".../theme/init.js"></script>`. It is a plain script, not a module.

A bundler does not copy a plain script out of `node_modules`, so in an app built with Vite inline both head scripts, this one and the one of the keys in section 7, with a plugin, and the theme-color tags below with them. They come from the installed package, so they stay in step with it:

```ts
// vite.config.ts
import { defineConfig, type Plugin } from 'vite'
import { keysInitScript } from '@whatsaaaa/design-system/shortcuts'
import { themeInitScript } from '@whatsaaaa/design-system/theme'
import { themeColorMeta } from '@whatsaaaa/design-system/theme/meta'

function designSystemHead(): Plugin {
  return {
    name: 'design-system-head',
    transformIndexHtml: {
      // before Vite adds the stylesheet and the app's script to the <head>
      order: 'pre',
      handler: () => [
        ...themeColorMeta.map((attrs) => ({
          tag: 'meta',
          attrs: { ...attrs },
          injectTo: 'head' as const,
        })),
        { tag: 'script', children: themeInitScript, injectTo: 'head' },
        { tag: 'script', children: keysInitScript, injectTo: 'head' },
      ],
    },
  }
}

export default defineConfig({
  plugins: [designSystemHead()],
})
```

The browser's own bars, such as a phone's address bar, take the background of the theme shown, `--ws-color-bg`. Put the two theme-color tags in the `<head>` the server sends: the background of the dark theme, and of the light one where the system asks for light, as the stylesheet chooses. So a visitor without JavaScript, and a link preview such as a chat app's, which reads the page as it is sent, get the color too. The dark tag comes first, for a reader that takes the first tag and ignores `media`. The head script then keeps every theme-color tag at the theme shown, from the first paint on, when the theme is chosen by hand, with `setTheme`, `toggleTheme` or anything else that sets `data-theme` or the class of `<html>`, and when the system's theme changes:

```html
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="theme-color" content="#191724" media="not all and (prefers-color-scheme: light)" />
  <meta name="theme-color" content="#faf4ed" media="(prefers-color-scheme: light)" />
  <script src=".../theme/init.js"></script>
  <script src=".../shortcuts/init.js"></script>
  <link rel="stylesheet" href=".../index.css" />
</head>
```

These are the only colors to write out by hand, as a `<meta>` cannot read a variable. Take them from the package where a build writes the `<head>`: `themeColorMeta` from `@whatsaaaa/design-system/theme/meta` is the attributes of the two tags, as in the Vite plugin above. It reads the tokens, so import it in the build or on the server, not in the page's own script. Without the tags the head script adds one, so a page still gets the color once its script runs. Do not set it from a script of your own. A docs site gets the tags and the script from the base config of the docs theme.

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
- The gutter of a phone is `--ws-space-16`. Below 64rem the tab bar starts its brand that far in from the window's edge, and ends its end that far from the other. Pad what is under it by the same, a pane, a page or a form, and its content starts at the pixel the brand starts at. From 64rem a pane takes the padding of its own design.
- Sizes: `--ws-size-control` (40 px) is the height of a one-line field, a button and a segmented control. `--ws-size-check` (20 px) is a checkbox or a radio button, `--ws-size-step` (24 px) the circle of a step number and `--ws-size-icon` (16 px) an icon next to text. Use them for those, not a space token. A control of another size takes its height and its icon size, and a checkbox or a radio button of another size its side, from the component tokens of section 12.
- Radius: `--ws-radius-xs` (key caps), `-sm` (inline code, tags), `-md` (inputs, buttons), `-lg` (blocks, cards), `-xl` (the window), `-full` (dots).
- Borders, not shadows: `--ws-border-width-thin`, `-medium`, `-thick`.
- Motion: `--ws-motion-duration-fast`, `-base`, `-slow` with `--ws-motion-easing-standard`. Wrap movement in `@media (prefers-reduced-motion: no-preference)`.
- Two breakpoints. Below `64rem`, `@media (width < 64rem)`, a page has one column, the tab bar wraps and headings take their compact sizes. Below `40rem`, `@media (width < 40rem)`, a row of fields stacks, one field to a line: from 40rem up two fields fit side by side.

## 6. Classes

- Long-form text: put rendered Markdown in `<article class="ws-prose">`. Wrap a table in `<div class="ws-table">` so it scrolls inside itself, and give a cell of running text `class="ws-table__text"` so a narrow frame scrolls instead of squeezing it. A first cell stays on one line unless it has that class. A browser breaks inline code after any hyphen: hold a run of hyphens and the characters on both sides of it in `<span class="ws-code-joined">`, as in `<code>dat<span class="ws-code-joined">a-s</span>pec</code>`, and give a path a `<wbr>` after its slashes. The docs theme does all three.
- Code block with a caption: `<figure class="ws-code"><figcaption><span>file.ts</span><span>ts</span></figcaption><pre><code>...</code></pre></figure>`. For highlighting, use Shiki with `codeTheme` from `@whatsaaaa/design-system/shiki`. See [code blocks](#code-blocks).
- Callout: `<aside class="ws-callout ws-callout--warning"><p class="ws-callout__title">Warning</p><p>...</p></aside>`. Modifiers: `--tip`, `--warning`, `--danger`. None is a note.
- Terminal frame: `ws-term` (the window), `ws-tab-bar` with `ws-tab-bar__brand`, `ws-tabs` and `ws-tab-bar__end`, `ws-prompt` for headings, `ws-output`, `ws-status-line`. Mark the current tab with `aria-current="page"`. The tabs are optional: a site of one page has nothing to tab to, and a tab that only reloads the page would lose what was typed in it. Its bar is the brand and the end.
- The path above a page title: `<p class="ws-crumb"><span>writing</span><span>form-builder</span><span>conditions</span></p>`, right before the `<h1>`. The slashes between the parts are drawn, and assistive technology reads a comma in their place, so the parts come out as words of their own. It comes with `prose.css`.
- Small pieces: `ws-kbd`, `ws-tag`, `ws-tag--outline`, `ws-state` with `--active` or `--experimental`, `ws-arrow`, `ws-cursor`, and `ws-visually-hidden` for text that only assistive technology reads.
- Forms: `ws-segmented`, `ws-pairs` and `ws-pairs-group`. See [forms](#forms).

The markup of each piece is in the comment above its rules, in its stylesheet in `dist/css/` and in `dist/index.css`, and in the style guide.

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
- **The path** goes in `ws-status-line__path`, which takes the room the other items leave and puts the items after it at the right edge. The path gives way to them on its own: it is cut with an ellipsis, down to five characters, and with less room than that it goes as a whole. Write no breakpoint or width for it. The status line pads its items `--ws-space-14` on each side, and `--ws-space-10` below 64rem, so on a phone the path has more room. A status line without a path puts `<span class="ws-status-line__spacer"></span>` where the path would be.
- **The theme button** names the theme shown and switches it, at every width: below 64rem, where the key hints are hidden, it is the only theme switch. Call `toggleTheme` when it is clicked. It holds both names, and the styles show the one of the theme, so the name is right before any script runs and the button keeps the focus when the theme changes. Its name for assistive technology is "Switch theme, now rose-pine". Where the key hints show, keep the theme's `t` hint as well.
- An item for wide screens only takes `ws-status-line__item--wide`, and one with a border on its left `ws-status-line__item--edge`.
- A focus ring in the window's bars is drawn inside its control, so neither the bars nor the window's corners cut it off. A control of your own in a bar does the same: `outline-offset: calc(-1 * var(--ws-border-width-medium))`.

### Forms

The system draws no fields and no buttons: draw them as the specs of section 12 say, from the roles and the component tokens, with these.

- **One height.** A one-line field, a button and a segmented control are `--ws-size-control` tall. A checkbox or a radio button is `--ws-size-check`, a step number's circle `--ws-size-step`.
- **Rows of fields.** Fields that belong together, such as a date and a time, may share a row from 40rem up. Below it, `@media (width < 40rem)`, each takes a line of its own.
- **The primary button** is filled with `--ws-color-interactive`, its label `--ws-color-on-interactive`. Under the pointer it takes `--ws-color-interactive-hover`, while pressed `--ws-color-interactive-active`. Do not mix a hover color of your own.
- **A tick** is `--ws-icon-check` from `css/icons.css`, a mask like the other icons: a ticked box, a done step, a sent form. Draw it at `--ws-size-icon` in `currentcolor`, or `--ws-color-on-interactive` on a checked box.
- **A date** has `--ws-icon-calendar`, such as on the button that opens a date picker, at `--ws-size-icon` in `currentcolor`. Do not draw your own.
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
- **Sections that line up.** A review step of several sections, each a list under its own heading, puts them in one `ws-pairs-group`: the lists share a term column, as wide as the longest term of them all, so the values of every section start at one edge. Each heading, or anything else in the group, takes a row of its own. A list of amounts in the group keeps its own columns.

```html
<div class="ws-pairs-group">
  <h3>About you</h3>
  <dl class="ws-pairs">
    <div>
      <dt>Name</dt>
      <dd>Milica Đorđević</dd>
    </div>
  </dl>
  <h3>Your visit</h3>
  <dl class="ws-pairs">
    <div>
      <dt>Workshop</dt>
      <dd>Forms that check themselves</dd>
    </div>
  </dl>
</div>
```

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

Hints are hidden until `enableShortcuts()` runs, and below 64rem. A key works only while its hint shows. Do not show a hint any other way. Number keys go to the tabs of a `ws-tabs` bar, and the number of a tab is drawn only while the keys are on, so a page without the module, or without JavaScript, shows none. Keys typed into a field, and keys pressed with Ctrl, Alt or Cmd, are left alone. A held key acts once: the repeats a keyboard sends while the key is down do nothing.

The switch is not optional. The keys are single characters that act on the whole page, so a visitor has to be able to turn them off (WCAG 2.1.4): it matters most with speech input, where a dictated word presses them, and for someone who presses keys without meaning to.

- It reads "keys on" or "keys off". Pressing it turns every key off or on again, and the browser remembers the choice.
- Put it in the status line, outside `ws-status-line__keys`: unlike the hints it shows at every width, because the number of a tab is a key at every width.
- Do not write `aria-checked` on the switch or `aria-keyshortcuts` on a control. The module sets both while they are true, and the switch stays hidden until it has its state.
- With the keys off the controls stay and work by hand. What names a key goes: the key caps and the numbers of the tabs. Hide a control that is nothing but a key cap with `[data-ws-keys='off']`.
- A key acts only on a page that has the switch. A page without the switch has no shortcuts.
- Load `shortcuts/init.js` in the head, next to `theme/init.js`, or inline `keysInitScript` (with Vite, see section 3). It marks the page before the first paint: `data-ws-keys="off"` when the keys are remembered as off, and `pending` until the module says `on`. So the numbers of the tabs keep their place unseen while the module loads, and the labels do not move when they show. Do not write `data-ws-keys` yourself: the head script and the module own it.

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

From 60rem up the brand has a box as wide as the sidebar, 17rem with the sidebar's padding, and the first tab starts on the sidebar's border, on pages without a sidebar too. With a logo there is room for about 24 characters in the site title, without one about 28. A longer title is cut with an ellipsis: shorten it with `themeConfig.siteTitle`. A short one leaves a gap before the tabs. The labels of the tabs have no such limit: a long one moves the tabs after it. Below 60rem there is no sidebar and the tabs follow the brand, and on a phone they take a row of their own under it. On a phone, below 48rem, the page, the row of its menu and the home page's hero, features and content take the gutter of a phone, as the brand does. The theme pulls a project's mark as the logo out by its empty columns, as in section 9, so its pixels start on that gutter too, and over the sidebar's headings from 60rem up.

## 11. Data

The tokens as data, for code that cannot read CSS:

```ts
import { resolver } from '@whatsaaaa/design-system/tokens'

const dark = resolver.apply({ theme: 'dark' })
dark['color.bg'].$value.hex // '#191724'
```

The sources are in `tokens/`, in the Design Tokens Community Group format.

## 12. Components: specs and the tier

The system draws no components: it specifies them, and an implementation draws them, such as ui-vue on Nuxt UI, ui-react on shadcn/ui with Radix, or an app that draws its own fields. Two things hold them alike.

**Specs.** Each component has a spec, `specs/<component>.spec.json`, in the package as `@whatsaaaa/design-system/specs/button.spec.json`, checked against `specs/spec.schema.json`. Its state table is the whole mapping: for each kind, state and part, the token each CSS property takes, or a value the system writes without a token. A state lists what it changes from rest:

```json
{
  "variant": "primary",
  "state": "hover",
  "part": "root",
  "property": "background-color",
  "token": "button.primary.bg.hover"
}
```

A token id reads as its variable, `--ws-button-primary-bg-hover`, and a text style on a font property as that part of it: `text.label` on `font-size` is `--ws-text-label-font-size`. A value can read tokens by their variables, such as the padding past an icon, `calc(var(--ws-space-12) + var(--ws-control-icon-size-md) + var(--ws-control-gap-md))`. A row with `"with": "leading-icon"` holds only in an example that draws that part, and one with `"without": "leading-icon"` only in one that does not; such a row always comes with its other half, so the input's `padding-inline-start` is the padding without a leading icon and the padding, the icon and the gap with one. The states are one closed list, the one the component tokens end in: `rest`, `hover`, `active`, `focus`, `disabled`, `checked`, `indeterminate`, `invalid`, `open`, `selected`, `current`, `loading`. A spec also names its parts, which are the `data-slot` of each part or what an implementation maps them to, its kinds and sizes, its keys and accessibility rules, the Lucide names of the icons it draws, and its gallery contract: the examples a gallery shows, each marked with its id in `data-spec`, `button.primary.hover`, and `.<size>` at the end for a size other than the default. The specs so far, all drafts: `button` (primary, secondary, ghost, quiet and danger, in the five sizes), `input` (the field with its label, help and error), `checkbox` (checked, indeterminate, with its label, description and error), `radio-group` (a legend over its options), `select` and `select-menu` (a field whose list opens on a panel of the overlay, the select menu's with a search, in the five sizes), `modal` (a window over the dimmed page), `badge` (the tag: on a tint in each of six colors, or outlined, in the five sizes) and `card` (a panel with a header, a body and a footer). Each has a page in the style guide, drawn from its file.

Draw a component the system specifies as its spec says, and read the spec in a test where you can, rather than copying values from it.

**Parity tests.** `@whatsaaaa/design-system/testing` is a helper for Playwright that holds an implementation's gallery to the specs. Install `@playwright/test` 1.50 or a later 1.x next to the package. Only this entry needs it. The gallery shows the examples of each spec's gallery contract, marked as the contract says:

- Each example has its id in `data-spec`, on the component or on an element around it, and shows one component.
- Each part has its name in `data-slot`, or the slot the spec's `implementations` maps it to: ui-vue's `root` is `base`. Where an example has several elements of one slot, such as the options of a radio group, the first that draws the part is measured, such as the fill of the option that is checked.
- A hover, a pressed state and the focus are drawn when `data-demo` on the example or around it names them, `hover`, `active` or `focus`, as the pointer and the keyboard draw them. With Tailwind, a custom variant adds `[data-demo~='hover'], [data-demo~='hover'] *` to `hover`. The helper adds the attribute while it measures, and never moves the pointer. Every other state is the example's own markup: `disabled`, `aria-invalid="true"`, `aria-busy="true"`. An `open` example draws its list or its window in place, inside the example and not in a layer at the end of the page, so the helper finds its parts by the example's id: with Nuxt UI, `:portal="false"` and the list or the modal open. The element with a select's id wraps the select itself, its trigger and its list, never its form field, whose slots may share names with the list's: Nuxt UI's form field label and a list's group name are both `label`.
- A checked, indeterminate, current or selected example shows the same content as the example of its kind at rest, so only the state differs.

```ts
// tests/browser/spec.spec.ts
import { test } from '@playwright/test'
import { expectSpec, specNames } from '@whatsaaaa/design-system/testing'

for (const name of specNames())
  test(`the gallery meets the ${name} spec`, async ({ page }) => {
    await page.goto('/')
    await expectSpec(page, name, { implementation: 'ui-vue' })
  })
```

`expectSpec(page, spec, options)` takes a spec's name or its data, checks the gallery in both themes and fails the test with every failure listed:

- **coverage**: every id of the gallery has an example, and every row of the state table is drawn by an example it holds for. A row of a part that no example shows, such as an icon at xs, fails, so show the part in one. A row with `with` or `without` holds only for an example that draws that part, or does not, so the gallery shows each size of the input, at rest and in an error, both with an icon and without one. An id can mark more than one example, and each is checked.
- **tokens**: each property of each part of each example is what its row says. An example takes the rows of its kind and size at rest, and over them the rows of its state. A token is resolved on a probe in the part, so a part of the page held in the other theme is measured in that theme. Colors are compared as colors, lengths to a 64th of a pixel.
- **forced colors**: with `forcedColors: 'active'`, each part whose border or outline the spec gives a width keeps a border on every side or an outline, in a color other than the page's, and a focus ring stays an outline. An image of a checked, indeterminate, current or selected example differs from its example at rest by more than its text drawn at another fraction of a pixel or the image cut a pixel apart: a line of a pixel in a color of its own is enough. The images are of the parts its state changes, or of the two examples whole where the state draws a part the example at rest does not, such as a checked box's fill.

Its one option, `implementation`, names the entry of the spec's `implementations` whose part map to read: a slot, a slot and a pseudo-element of it, such as `label::after`, or a slot inside another where the same slot draws two parts, such as `base leadingIcon`, the icon of a select menu's trigger and not of the search in its list. Without it, a part's slot is its name. The helper puts the page in each theme with `data-theme` on `<html>` and the system's color scheme to match. `checkSpec` takes the same and, in place of failing, returns a report: its `failures`, and `checks`, how many values it compared. `specNames()` and `loadSpec(name)` read the published specs. The helper checks what a spec says a part draws. Keys and accessibility stay with each implementation's own tests.

**The component tier.** Where every implementation has to make the same decision, a spec's row names a component token. Each is an alias of a role or a measure, and follows the theme as the roles do, in a part held in the other theme too. Six groups so far:

- `--ws-control-*`, every one-line control: a button, a field, a select's trigger. For each of the five sizes, `xs`, `sm`, `md` (the default), `lg` and `xl`: `--ws-control-height-<size>`, `--ws-control-gap-<size>` between the icon and the label or value, and `--ws-control-icon-size-<size>`. At every size `--ws-control-radius`, and the edge `--ws-control-border-width-rest`, `-invalid` with an error.
- `--ws-field-*`, a text field, a select and a select menu: `--ws-field-bg`, the value `--ws-field-text-rest` and `-disabled`, the edge `--ws-field-border-rest`, `-hover`, `-invalid` and `-disabled`, an icon in it `--ws-field-icon`, and around it `--ws-field-label-text`, `--ws-field-help-text`, `--ws-field-error-text` with `--ws-field-error-icon` and `--ws-field-error-font-weight`, and `--ws-field-required-text` for the asterisk.
- `--ws-button-*`, the colors of each kind of button: `--ws-button-<kind>-<bg|border|text>-<state>`, such as `--ws-button-primary-bg-hover` or `--ws-button-danger-border-rest`, for the kinds `primary`, `secondary`, `ghost`, `quiet` and `danger`, and `--ws-button-text-disabled` and `--ws-button-border-disabled` for a disabled button of every kind. Danger is an outline in both themes. A button's height, gap, radius and icon size are the control's.
- `--ws-choice-*`, a checkbox and a radio group: the side of the box or the circle at each size, `--ws-choice-control-size-<size>`, 14, 16, 20, 22 and 24 px, on the page color `--ws-choice-control-bg` with the edge `--ws-choice-control-border-rest`, `-hover`, `-invalid` and `-disabled`; the fill of a checked or an indeterminate one and the mark on it, `--ws-choice-indicator-bg-<state>` and `--ws-choice-indicator-icon-<state>` for `checked`, `indeterminate` and `disabled`; and the label and description of an option, `--ws-choice-label-text-rest` and `--ws-choice-description-text-rest`, each `-disabled` too.
- `--ws-overlay-*`, what a select's list and a modal's window share: the surface `--ws-overlay-bg`, the edge `--ws-overlay-border` and `--ws-overlay-border-width`, and for each the radius and the padding, `--ws-overlay-list-radius` and `--ws-overlay-list-padding`, `--ws-overlay-window-radius` and `--ws-overlay-window-padding`. An overlay has no shadow.
- `--ws-tag-*`, a badge and the system's own `.ws-tag`: the fill and the word of each kind on a tint, `--ws-tag-<kind>-bg` and `--ws-tag-<kind>-text` for `primary`, the tag, and `success`, `info`, `warning`, `danger` and `neutral`, and the word of the outlined one, `--ws-tag-outline-text`; the radius `--ws-tag-radius`; and at each size the padding of a tag on a tint, `--ws-tag-padding-inline-<size>` and `--ws-tag-padding-block-<size>`, which an xs tag does not have, and of an outlined one, `--ws-tag-outline-padding-inline-<size>` and `--ws-tag-outline-padding-block-<size>`, whose block padding counts its edge.

Read them by name, where the control is drawn, and they keep in step with the system:

```css
.field {
  height: var(--ws-control-height-md);
  border: var(--ws-control-border-width-rest) solid var(--ws-field-border-rest);
  border-radius: var(--ws-control-radius);
  background: var(--ws-field-bg);
  color: var(--ws-field-text-rest);
}

.field[aria-invalid='true'] {
  border-color: var(--ws-field-border-invalid);
  border-width: var(--ws-control-border-width-invalid);
}
```

They are not in Tailwind's theme, so no other element takes a field's color by accident. With Tailwind, read them with the variable shorthand: `h-(--ws-control-height-md) rounded-(--ws-control-radius) border-(--ws-field-border-rest) hover:bg-(--ws-button-secondary-bg-hover)`. The tokens are in `tokens/components/`, one file per group, and in the data of section 11. Every one of them is read by a spec.

## Before you finish

- No hex values, no `--ws-palette-*` in interface code, no fonts from elsewhere. Stylelint with the config of section 2 passes.
- It reads in both themes. Check with `data-theme="light"` on `<html>`.
- Nothing overflows sideways at 390 px, and nothing is cut off. The window hides what overflows it, so a page can fit while the window clips its content: measure the window too, and its bars, not only the page. Each `scrollWidth` of `document.documentElement`, `.ws-term`, `.ws-tab-bar` and `.ws-status-line` is at most its `clientWidth`.
- Every key hint works, every status has a word, every control can be reached and seen with the keyboard.
