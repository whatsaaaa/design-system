# @whatsaaaa/design-system

## 0.9.0

### Minor Changes

- [#44](https://github.com/whatsaaaa/design-system/pull/44) [`f4a7bbe`](https://github.com/whatsaaaa/design-system/commit/f4a7bbee5e6a55ab1fe405211e31a6be329899d3) Thanks [@whatsaaaa](https://github.com/whatsaaaa)! - Component specs: what every implementation of a component draws alike, as data. `specs/<component>.spec.json`, in the package as `@whatsaaaa/design-system/specs/button.spec.json`, checked against `specs/spec.schema.json`, names a component's parts, kinds, sizes and states, its state table (for each kind, state and part, the token each CSS property takes), its keys and accessibility rules, how each implementation maps onto it and where it does not meet it yet, and the examples its gallery shows by `data-spec` id. The first two are drafts: `button`, in the kinds primary, secondary, ghost, quiet and danger, an outline in both themes, in the five sizes, and `input`, the field with its label, help and error. The style guide has a page for each, drawn from its file, in a components section next to the styles, and `docs/usage.md` explains specs and the tier in section 12.

  The component tier gains the `button` group, the colors of each kind in each state: `--ws-button-<kind>-<bg|border|text>-<state>`, such as `--ws-button-primary-bg-hover`, and `--ws-button-text-disabled` and `--ws-button-border-disabled`. Nothing that exists changes.

- [#41](https://github.com/whatsaaaa/design-system/pull/41) [`4d39c4c`](https://github.com/whatsaaaa/design-system/commit/4d39c4c05a5324c7339d954c197b6876c958cf38) Thanks [@whatsaaaa](https://github.com/whatsaaaa)! - A component token tier: the names every implementation of a control reads alike, such as ui-vue on Nuxt UI or an app that draws its own fields. Its first two groups are `--ws-control-*`, the height, gap and icon size of a one-line control for each of Nuxt UI's five sizes, `xs` to `xl`, with its radius and border widths, and `--ws-field-*`, the colors of a text field, a select and a select menu and of every field's label, help, error and required mark. Each is an alias of a role or a measure, declared wherever a theme is chosen, so it follows a part of the page held in the other theme. They are in `tokens/components/`, in the resolver's new `components` set and in the token data, and not in Tailwind's theme: read them by name, as `h-(--ws-control-height-md)`. `docs/usage.md` describes them, and `docs/decisions.md` says why the tier is thin.

  New semantic tokens for them: `--ws-color-brand-text`, the brand red as small text, love on dark and a darker love on light that reads at 4.5:1, for the required mark; `--ws-size-control-xs`, `-sm`, `-lg` and `-xl`, the heights of the other control sizes, 28, 32, 44 and 48 px; and `--ws-size-icon-lg`, 20 px, the icon of the two large sizes. In the Tailwind entry they are `text-brand-text`, `h-control-sm` and the like. Nothing that exists changes.

- [#37](https://github.com/whatsaaaa/design-system/pull/37) [`e977973`](https://github.com/whatsaaaa/design-system/commit/e977973dc10fe58ab1df3381d666fa0fc4370205) Thanks [@whatsaaaa](https://github.com/whatsaaaa)! - Remove `css/nuxt-ui.css`, deprecated in 0.8.3. ui-vue now ships the stylesheet that points Nuxt UI's colors at the roles. An app on Nuxt UI imports `@whatsaaaa/ui-vue/index.css`, which brings it; an app that imported `@whatsaaaa/design-system/css/nuxt-ui.css` directly copies the file from 0.8.3 into its own stylesheets or moves to ui-vue.

## 0.8.3

### Patch Changes

- [#33](https://github.com/whatsaaaa/design-system/pull/33) [`0d94a82`](https://github.com/whatsaaaa/design-system/commit/0d94a82606cc5600df15548e8c08c1d989e19277) Thanks [@whatsaaaa](https://github.com/whatsaaaa)! - The current tab keeps its mark in forced colors, such as a Windows contrast theme. The browser dropped the bar over it, a shadow, and drew the edges every tab keeps for the current one on all of them, so the current tab looked like the others. In the tab bar of the terminal frame and in the docs theme it now has its bar and its number in the system's color of a selection and its edges in the text color, and the other tabs have no edges. Out of forced colors nothing changes. A page with the tab bar or a site on the docs theme takes this with no change of its own.

  `css/nuxt-ui.css` is deprecated and is removed in 0.9.0. It stays in 0.8.3 as it was. An app on Nuxt UI gets it from ui-vue, which `@whatsaaaa/ui-vue/index.css` brings. An app that imports `@whatsaaaa/design-system/css/nuxt-ui.css` directly copies the file from 0.8.3 into its own stylesheets and imports that copy in its place.

## 0.8.2

### Patch Changes

- [#27](https://github.com/whatsaaaa/design-system/pull/27) [`ffff150`](https://github.com/whatsaaaa/design-system/commit/ffff15072579fbabdf3063ceda0ae46281797aa5) Thanks [@whatsaaaa](https://github.com/whatsaaaa)! - The path of the docs theme's status line gives way the way 0.8.1's does. The docs theme put the file in the status line without `ws-status-line__path`, so it never had the rules 0.8.1 added for it: on a docs site the path showed down to one character and then a bare ellipsis below about 242 px, and the status line reached past the window at 198 px and narrower. It is cut with an ellipsis down to five characters now and goes as a whole with less room, never a stub, and the status line fits at every width a phone has. From 320 px up it looks as it did. A site on the docs theme takes this with no change of its own.

## 0.8.1

### Patch Changes

- [#25](https://github.com/whatsaaaa/design-system/pull/25) [`bd41e0b`](https://github.com/whatsaaaa/design-system/commit/bd41e0b2acdd3204e9fdbf07ba3e59eb6ba13d24) Thanks [@whatsaaaa](https://github.com/whatsaaaa)! - Two things the website, the form-builder docs, the sample apps and ui-vue found when they moved to 0.8.0.

  - **The mark of a docs site.** The docs theme pulls the logo out by the two empty sprite columns on each side of a project's mark, 4 px at 32 px, as the usage guide tells a page to. Its pixels start where the page does on a phone, at 16 px, where they started at 20, and over the headings of the sidebar from 60rem up, where they started 4 px to the right of them. The brand's name moves 8 px to the left with it. The brand's link takes 10 px of room around them for its focus ring, as the brand of the tab bar does, so the ring keeps clear of the mark. Below 60rem the tabs follow that room.
  - **The path of the status line.** It is cut with an ellipsis down to five characters, `6ch`, and goes as a whole with less room, where it showed down to one character and the ellipsis. With the 10 px padding of 0.8.0 a 320 px phone showed `w…` or `~…` there. From 64rem up, between its 14 px padding, it keeps the same five.

  A site on the docs theme and a page with `ws-status-line__path` take both with no change of their own. Drop a margin of your own on the docs theme's `.logo`.

## 0.8.0

### Minor Changes

- [#23](https://github.com/whatsaaaa/design-system/pull/23) [`b5024be`](https://github.com/whatsaaaa/design-system/commit/b5024be4e7aafe09d613b5674766b64a55597c17) Thanks [@whatsaaaa](https://github.com/whatsaaaa)! - The gaps the website, the form-builder docs and the sample apps found when they moved to 0.6.1.

  - **A calendar icon.** `--ws-icon-calendar`, drawn like the other icons, for a field that takes a date, such as the button that opens a date picker.
  - **An icon size.** `--ws-size-icon` (16 px), the size the icons are drawn for: a tick, the icon of a callout or a field in error, a calendar. One size, as each icon is drawn on a grid of 16 in strokes of 1.5. In the Tailwind entry it is `size-icon`.
  - **A second breakpoint, 40rem.** Below it a row of fields stacks, one field to a line, and from it up two fields share a row, in the one column of a tablet too. In the Tailwind entry it is `max-sm:`. In CSS write it out: `@media (width < 40rem)`.
  - **Sections of a review that line up.** `ws-pairs-group` around the lists of a review step gives them one term column, as wide as the longest term of them all, so the values of every section start at one edge. Each heading in it takes a row of its own.
  - **The gutter of a phone.** The usage guide names it: below 64rem the content of a window starts `--ws-space-16` in, where the brand of the tab bar starts. The style guide's examples pad their panes by it, where they padded 20 px, and the docs theme pads its page, the row of its menu and its home page by it on a phone, below 48rem, where it padded 24 px, and the home page 48 px from 40rem.
  - **The status line on a phone.** Below 64rem it pads its items 10 px, not 14, so the path keeps about 32 px more at 390 px.
  - **theme-color without JavaScript.** The page as it is sent has two theme-color tags, the dark background and the light one for a light system, so a visitor without JavaScript and a link preview get the color of the browser's bars. The docs theme's base config writes them. `themeColorMeta`, from the new `@whatsaaaa/design-system/theme/meta`, gives a build their attributes from the tokens. The head script keeps both at the theme shown.
  - **Docs theme.** A code group's language stands in the row of its tabs, as in the caption of a block on its own, and no longer covers a long first line. A button of the theme, such as a tab that opens a menu, takes the theme's 2px ring in place of the browser's, and the brand, the tabs and the buttons of the bar and of the row under it draw their ring inside them, where the top of the window cut it off.

  What a project on 0.7 or earlier changes, as in `docs/usage.md`:

  - Replace a calendar icon of your own with `--ws-icon-calendar`, and an icon drawn at `1rem` or `--ws-space-16` with `--ws-size-icon`.
  - Drop a phone gutter of your own when it is 16 px, and pad a pane 16 px below 64rem where it was 20.
  - Drop a rule that pads the status line's items 10 px on a phone.
  - Put the two theme-color tags in the `<head>` you send, or write them there from `themeColorMeta` in your build, as the usage guide's Vite plugin does. Drop tags of your own that set the color by hand.
  - Wrap the lists of a review step in `ws-pairs-group` to line their values up.
  - Stack a row of fields below `40rem`, where it stacked below `64rem`.

  A docs site on the theme sends the two theme-color tags with no change of its own, and on a phone its page starts 8 px further left, under its brand.

## 0.7.0

### Minor Changes

- [#21](https://github.com/whatsaaaa/design-system/pull/21) [`b739738`](https://github.com/whatsaaaa/design-system/commit/b739738c51e4ef9465fd10fcf24048e8fb6ecbdd) Thanks [@whatsaaaa](https://github.com/whatsaaaa)! - An app on Nuxt UI takes its colors from the roles with one import: `@whatsaaaa/design-system/css/nuxt-ui.css`, after Nuxt UI and the variants. It points Nuxt UI's `--ui-*` variables at the `--ws-color-*` roles, outside any layer so it wins over Nuxt UI's own, on `:root` and again on every element that chooses a theme with `data-theme` or a `dark` or `light` class, so both themes follow by themselves. The primary color is the interactive role, success, info, warning and error are tip, note, warning and danger, and the steps the system has no role for, such as the shades of each color, are mixed from the roles around them in oklab. It also sets `--ui-radius` to the small radius and `--ui-header-height` to the height of the tab bar.

  It is not in `index.css` or `tailwind.css`, as it has to come after Nuxt UI. The usage guide shows the import order.

  What an app on Nuxt UI drops: the `--ui-*` variables it pointed at the roles itself, as the usage guide asked before. Set one again after the import only to change it.

## 0.6.1

### Patch Changes

- [#18](https://github.com/whatsaaaa/design-system/pull/18) [`be03552`](https://github.com/whatsaaaa/design-system/commit/be035522b19aa605d2d336484d58a62322011196) Thanks [@whatsaaaa](https://github.com/whatsaaaa)! - Docs corrections and small fixes the first apps and the website ran into.

  - **The markup is in the stylesheets you install.** The comments between the rules, with the markup of each piece, now come along into `dist/css/*.css` and `dist/index.css`, where the usage guide says they are. They were stripped before.
  - **Errors and brand.** The usage guide says an error uses the danger tokens, `--ws-color-danger` for a field's border and icon and `--ws-color-danger-text` for its message, and not brand. Brand marks where you are, such as the current tab, and what you press uses the interactive color.
  - **The tabs are optional**, and `ws-crumb`, the path above a page title, is in the usage guide. Assistive technology now reads its parts as words of their own, with a comma in place of each slash, where it ran them into one word before.
  - **Vite.** The usage guide shows a plugin that inlines the head scripts from the package, as a bundler does not copy a plain script out of `node_modules`.
  - **Before you finish** says to measure the terminal window and its bars too, which hide what overflows them, and not only the page.
  - **A state lines up with the text beside it.** `ws-state` takes its baseline from its word, not from its dot, which put it half a pixel low.
  - **A prompt that wraps keeps its chevron on its first line**, where it sat between the lines before.
  - **The numbers of the tabs show only while their keys work**: not without JavaScript, and not before the shortcuts module runs. The head script marks the page `data-ws-keys="pending"` until then, so the numbers keep their place unseen and the labels of the tabs do not move when they show. The docs theme does the same.
  - **The focus ring's radius gives way.** `base.css` rounds a focused element's corners with no more weight than an element, so a class of the page's own, such as a round radio button's, wins wherever it is written, and so does a `rounded-*` utility with the Tailwind entry. A button or field without a radius of its own still takes the small corners, with the Tailwind entry too, over the square ones of its preflight.

  A project on an earlier version writes nothing new, but it has to load the head script of the keys from the package: `shortcuts/init.js`, or `keysInitScript` inlined, as with the Vite plugin. A page with no head script, or with a copy of an earlier one, draws the numbers of the tabs only once the shortcuts module runs, and the labels of the tabs move then.

  What it can drop, as in `docs/usage.md`:

  - A rule that sets `align-items: baseline` on `ws-state`, or `align-items: flex-start` and a margin on the chevron of `ws-prompt`.
  - A rule that only restates its own `border-radius` on `:focus-visible` to win over `base.css`.
  - Its own copy of the stylesheets' markup, which is now in `dist/`.

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
