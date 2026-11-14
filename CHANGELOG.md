# @whatsaaaa/design-system

## 0.6.0

### Minor Changes

- [#16](https://github.com/whatsaaaa/design-system/pull/16) [`a88f88a`](https://github.com/whatsaaaa/design-system/commit/a88f88acaa454a223bce9670ba34c503b6782093) Thanks [@whatsaaaa](https://github.com/whatsaaaa)! - An app on Tailwind CSS v4, such as one on Nuxt UI, imports `@whatsaaaa/design-system/tailwind.css` in place of `tailwindcss` and `index.css`. It brings Tailwind and everything `index.css` brings in cascade layers, so a utility wins over a class of the system, and gives Tailwind the tokens as its theme: `bg-surface` and the other color roles in place of Tailwind's palette, `font-mono` and `font-sans`, the text styles as `text-h1` and the rest, the space as Tailwind's scale, the sizes by name as `h-tab-bar`, and the radii, border widths and easings. A utility reads its token where it is used, so it follows the theme as the token does. The token build writes the theme, so a token added to a group comes through on its own.

  - `dark:` and `light:` follow the theme as the tokens do: the nearest `data-theme` or `dark` or `light` class, on `<html>` or on any element around a part of the page, then the system. A library that defines its own after the entry, as Nuxt UI does, replaces them: import `@whatsaaaa/design-system/tailwind/variants.css` again after it.
  - `tailwindcss` 4.3.5 or a later 4.x is an optional peer dependency: only the Tailwind entry needs it.
  - Tailwind's defaults that no token stands behind are taken out on the entry, in the app and in a library imported after it: the palette, white and black included, the shadows, `font-serif`, and the weights and radii with no token. As classes they compile to nothing, and in `@apply` they fail the build.
  - The entry gives Nuxt UI the system's fonts, weights, radii and spacing, but not its colors: Nuxt UI takes them from its own `--ui-*` variables, which the app points at the roles.

  The usage guide shows the import order, how to point Nuxt UI's colors at the roles, which utility reads which token, and what to use in place of the defaults taken out.

## 0.5.0

### Minor Changes

- [#13](https://github.com/whatsaaaa/design-system/pull/13) [`420e3d9`](https://github.com/whatsaaaa/design-system/commit/420e3d9f7f70ddc736591d77d1b9c9ce51dd7522) Thanks [@whatsaaaa](https://github.com/whatsaaaa)! - The pieces the first apps and the website each drew for themselves, mostly for forms.

  - **A check icon.** `--ws-icon-check`, in `css/icons.css`, drawn like the other icons, for a ticked box, a done step or a sent form.
  - **Sizes for controls.** `--ws-size-control` (40 px) is the height of a one-line field, a button and a segmented control. `--ws-size-check` (20 px) is a checkbox or a radio button and `--ws-size-step` (24 px) the circle of a step number.
  - **A hover and a pressed fill for the primary button.** `--ws-color-interactive-hover` and `--ws-color-interactive-active`, the interactive color a step further from the page, with their contrast checked. The docs theme's primary buttons use them.
  - **A segmented control.** `ws-segmented`, in the new `css/segmented.css`: buttons in a row with `aria-pressed`, such as a switch between languages. The pressed one is raised with an interactive edge at 3:1, and takes the selection colors in forced colors. The usage guide says how its keys work.
  - **Terms and values.** `ws-pairs`, in the new `css/pairs.css`: a `<dl>` for the review step of a form, and with `ws-pairs--amounts` for an order summary, its amounts aligned at the right in tabular figures, with a `ws-pairs__total` row.
  - **Number fields.** `base.css` hides the browser's spin buttons on `<input type="number">`. The arrow keys still step the value.
  - **The ghost without markup.** `ghostElement()` builds the ghost as an element, and `<ws-ghost>` now fills itself in and shouts without `innerHTML`. The kit has `ghost-on-dark.svg` and `ghost-on-light.svg`, the ghost without the margin of its grid, for a component that would otherwise need `v-html` or `dangerouslySetInnerHTML`. The usage guide says how far a project's mark sits inside its box, and how to pull it out to an edge.
  - **Code blocks that wrap.** `ws-code--wrap` wraps the lines of a code block instead of scrolling it, with a hanging indent per line from `--ws-code-hang`. The `hangingIndent()` Shiki transformer in `@whatsaaaa/design-system/shiki` sets it. The usage guide says when to load Shiki lazily, and when the syntax tokens are enough without it.
  - **A tagline.** The `tagline` and `tagline-compact` text styles, for the line under the display name, and `compact-px` on `<ws-ghost>`, the size of a large ghost on a phone.

  What a project on 0.1 changes to use them, as in `docs/usage.md`:

  - Replace your own check mask with `--ws-icon-check`, and `--ws-space-40`, `-20` and `-24` used as sizes with the size tokens.
  - Replace a hover fill mixed with `color-mix()` with `--ws-color-interactive-hover`.
  - Replace your own language switch with `ws-segmented`. Its pressed segment is no longer filled, and your forced-colors rule for it can go.
  - Replace your own summary rows with `ws-pairs` or `ws-pairs ws-pairs--amounts`.
  - Drop your own rule that hides the spin buttons, when you load `base.css` or `index.css`.
  - Replace `ghostSvg()` in `v-html`, `dangerouslySetInnerHTML` or `set:html` with the two ghost files and `ws-theme-dark` and `ws-theme-light`, or `ghostElement()` in a script.
  - Replace your own wrapping code block with `ws-code--wrap`, and its per-line hang with `--ws-code-hang` or the `hangingIndent()` transformer.
  - Replace the tagline's font size and weight with `--ws-text-tagline`, and the ghost's phone size with `compact-px`.

  A page that loads `base.css` now shows a number field without spin buttons, where the browser showed its own before. The `<ws-ghost>` element no longer sets `innerHTML`, neither when it fills itself in nor when it shouts.

## 0.4.0

### Minor Changes

- [#11](https://github.com/whatsaaaa/design-system/pull/11) [`1d47798`](https://github.com/whatsaaaa/design-system/commit/1d47798046748fd60133b0b5747dc5d11f7785a5) Thanks [@whatsaaaa](https://github.com/whatsaaaa)! - A `dark` or `light` class chooses the theme as `data-theme` does, so an app built on Nuxt UI or VueUse's `useColorMode`, which put a `dark` or a `light` class on `<html>`, needs no script to bridge the two. A library that marks light only by leaving `dark` off, as the toggle script in Tailwind's docs, VueUse's `useDark` and VitePress do, needs a `light` class kept in step with it: on when light is chosen, off for dark or the system. For Tailwind's script that is `classList.toggle('light', localStorage.theme === 'light')` next to its toggle of `dark`. With no class the tokens follow the system.

  - The tokens, `ws-theme-dark` and `ws-theme-light`, the status line's theme names and the head script that keeps `<meta name="theme-color">` in step all follow the class, on `<html>` or on any element around a part of the page.
  - On one element `data-theme` wins over the class, and both classes together choose nothing. The nearest choice around an element holds, made either way, and any choice wins over the system's theme.
  - `setTheme` and `toggleTheme` still write `data-theme`. `getTheme` and `getThemeChoice` read the class of `<html>` where there is no `data-theme`.

  Upgrading: a `dark` or `light` class an app gives an element for something else now puts what is inside it in that theme. Rename it. An app whose color mode library owns the class switches the theme with the library and does not call `setTheme` or `toggleTheme`. Where the library sets a `light` class too, the app can drop its bridge script and keep the head script. If the bridge called `setTheme` or `toggleTheme`, visitors still have a choice remembered under `ws-theme`, and the head script sets `data-theme` from it on every load, over the library's class. So remove it before the head script runs, with `localStorage.removeItem('ws-theme')`.

## 0.3.1

### Patch Changes

- [#10](https://github.com/whatsaaaa/design-system/pull/10) [`1224b68`](https://github.com/whatsaaaa/design-system/commit/1224b68357868e3e154d698ffc15bb80bdc63c95) Thanks [@whatsaaaa](https://github.com/whatsaaaa)! - Everything made for Whatsaaaa in the package is now under the MIT License, the identity artwork included: the ghost, the wordmark, the lockups and marks, the sprite and mark of each project, the README headers, the social cards, the profile banner and the favicons. A site that is not Whatsaaaa's own no longer has to hide the ghost. Third-party material keeps its own license, as listed in `licenses/README.md`, so the `license` field of `package.json` now reads `(MIT AND OFL-1.1)`. Versions already published keep the license they were published with.

## 0.3.0

### Minor Changes

- [#7](https://github.com/whatsaaaa/design-system/pull/7) [`0240496`](https://github.com/whatsaaaa/design-system/commit/0240496fe6f753538518d03b788ab6e76c276a00) Thanks [@whatsaaaa](https://github.com/whatsaaaa)! - The handle's kit has a profile banner, `assets/whatsaaaa/profile-banner.png`, for the header image of a Gravatar profile: the title bar of a terminal window and `whoami`, with the profile below it as the output. It is 1280 x 288, twice the 640 x 144 box Gravatar shows, and keeps its command where every crop from a 360 px phone up shows it and the avatar does not cover it.

## 0.2.0

### Minor Changes

- [#6](https://github.com/whatsaaaa/design-system/pull/6) [`c9f4399`](https://github.com/whatsaaaa/design-system/commit/c9f4399baa804cfdd957206e71efa17b3a983528) Thanks [@whatsaaaa](https://github.com/whatsaaaa)! - The theme and the status line now do what the first apps and the website each built for themselves.

  - **A theme switch on a phone.** The status line has a theme button, `ws-status-line__theme`, that names the theme shown and switches it at every width. It holds both names, so it keeps the focus when the theme changes. Its name for assistive technology starts with `ws-visually-hidden` text, a new small piece.
  - **A path that gives way.** Put the path in `ws-status-line__path`: it takes the room the other items leave, is cut with an ellipsis and goes as a whole when not even its first character fits, so the items after it fit at every width from 320 px.
  - **An element for one theme only.** `ws-theme-dark` and `ws-theme-light`, in the new `css/theme.css`, show an element only in its theme: by the nearest `data-theme` or the system's theme, with no script.
  - **The browser's bars follow the theme.** The head script keeps `<meta name="theme-color">` at `--ws-color-bg` of the theme shown, when the system's theme changes and when `setTheme`, `toggleTheme` or anything else sets `data-theme`, and adds the tag to a page that has none. The docs theme does the same.
  - **Focus rings are seen whole.** The rings of tabs, key hints, the keys switch, the theme button and a brand that is a link are drawn inside them, and a ring in a corner of the window follows its curve.
  - **The mode segment** says `NORMAL`, or `INSERT` while the focus is in a field: the usage guide now says so.

  What a project on 0.1 changes to use them, as in `docs/usage.md`:

  - Wrap `ws-status-line__file` in `<span class="ws-status-line__path">` and drop the `ws-status-line__spacer` after it, and drop your own container query for the path. Without the wrapper the path behaves as before.
  - Replace the two theme-name items, or your own theme-name buttons, with one `ws-status-line__theme` button that calls `toggleTheme`, and drop the script that moved the focus between them.
  - Replace your own `prefers-color-scheme` rules for per-theme images with `ws-theme-dark` and `ws-theme-light`. `ws-status-line__item--dark` and `--light` still work, now as other names of these classes.
  - Drop your own theme-color script. Theme-color tags of your own may stay: they now take the theme's color from the head script.
  - Drop your own `outline-offset` for the controls of the tab bar and the status line, and the padding you gave the key hints for it.

  The theme visibility rules now hide with `!important` and go by the nearest `data-theme`: the old status line rule hid both names in a part of the page held in the other theme. The key hints and the brand of the tab bar have inline padding for their ring, taken back with a negative margin, so a hint does not move. In a group of hints, such as the docs theme's `j` and `k`, a control after another takes nothing back at its start, so the two do not overlap. In the docs theme, the theme name of the status line is one item that holds both names, the controls of the status line draw the theme's focus ring instead of the browser's, the `j` and `k` keys fill its height, and the HTML in a Markdown code block is highlighted on every build, not only on one where an HTML block happened to come first.

## 0.1.1

### Patch Changes

- [#4](https://github.com/whatsaaaa/design-system/pull/4) [`61b235d`](https://github.com/whatsaaaa/design-system/commit/61b235deeeef1a30ebe7c3407b5679a29457b21e) Thanks [@whatsaaaa](https://github.com/whatsaaaa)! - The usage guide is now the one place for the rules of the shortcut keys and of the docs theme's site title, and adds what only the style guide said before: keys typed into a field or pressed with Ctrl, Alt or Cmd are left alone, the brand box is 17rem, and a long title is shortened with `themeConfig.siteTitle`.

## 0.1.0

### Minor Changes

- [#2](https://github.com/whatsaaaa/design-system/pull/2) [`efb64b4`](https://github.com/whatsaaaa/design-system/commit/efb64b47364a590603b89a3c5293ed0ea5f0d7e8) Thanks [@whatsaaaa](https://github.com/whatsaaaa)! - The first release. The package has the identity, the tokens, the fonts, the stylesheets, `<ws-ghost>`, the theme switch, the shortcut keys, the code theme, the docs theme for VitePress and the asset kit. How to use it is in https://github.com/whatsaaaa/design-system/blob/main/docs/usage.md. Until 1.0 a minor version can change a token or a class.
