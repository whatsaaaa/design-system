# @whatsaaaa/design-system

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
