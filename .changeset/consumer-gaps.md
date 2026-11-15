---
'@whatsaaaa/design-system': minor
---

The gaps the website, the form-builder docs and the sample apps found when they moved to 0.6.1.

- **A calendar icon.** `--ws-icon-calendar`, drawn like the other icons, for a field that takes a date, such as the button that opens a date picker.
- **An icon size.** `--ws-size-icon` (16 px), the size the icons are drawn for: a tick, the icon of a callout or a field in error, a calendar. One size, as each icon is drawn on a grid of 16 in strokes of 1.5. In the Tailwind entry it is `size-icon`.
- **A second breakpoint, 40rem.** Below it a row of fields stacks, one field to a line, and from it up two fields share a row, in the one column of a tablet too. In the Tailwind entry it is `max-sm:`. In CSS write it out: `@media (width < 40rem)`.
- **Sections of a review that line up.** `ws-pairs-group` around the lists of a review step gives them one term column, as wide as the longest term of them all, so the values of every section start at one edge. Each heading in it takes a row of its own.
- **The gutter of a phone.** The usage guide names it: below 64rem the content of a window starts `--ws-space-16` in, where the brand of the tab bar starts. The style guide's examples pad their panes by it, where they padded 20 px, and the docs theme pads its page, the row of its menu and its home page by it on a phone, below 48rem, where it padded 24 px.
- **The status line on a phone.** Below 64rem it pads its items 10 px, not 14, so the path keeps about 32 px more at 390 px.
- **theme-color without JavaScript.** The page as it is sent has two theme-color tags, the dark background and the light one for a light system, so a visitor without JavaScript and a link preview get the color of the browser's bars. The docs theme's base config writes them. `themeColorMeta` and `themeColorTags`, from the new `@whatsaaaa/design-system/theme/meta`, give them to a build from the tokens. The head script keeps both at the theme shown.
- **Docs theme.** A code group's language stands in the row of its tabs, as in the caption of a block on its own, and no longer covers a long first line. A button of the theme, such as a tab that opens a menu, takes the theme's 2px ring in place of the browser's, and the tabs and the brand draw their ring inside them, where the top of the window cut it off.

What a project on 0.6 changes, as in `docs/usage.md`:

- Replace a calendar icon of your own with `--ws-icon-calendar`, and an icon drawn at `1rem` or `--ws-space-16` with `--ws-size-icon`.
- Drop a phone gutter of your own when it is 16 px, and pad a pane 16 px below 64rem where it was 20.
- Drop a rule that pads the status line's items 10 px on a phone.
- Put the two theme-color tags in the `<head>` you send, or inline `themeColorTags` or `themeColorMeta` there in your build, as the usage guide's Vite plugin does. Drop tags of your own that set the color by hand.
- Wrap the lists of a review step in `ws-pairs-group` to line their values up.
- Stack a row of fields below `40rem`, where it stacked below `64rem`.

A docs site on the theme sends the two theme-color tags with no change of its own, and on a phone its page starts 8 px further left, under its brand.
