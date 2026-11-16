# Decisions

Why the design system is built the way it is, and what was looked at before deciding. The direction itself, the ghost, the terminal, Rosé Pine and the two faces, was settled before this repository existed. This is about how it is built.

## One package

Everything ships as one package, `@whatsaaaa/design-system`, with one entry per part: the stylesheets, the Tailwind entry, the tokens, the ghost, the theme switch, the shortcuts, the code theme, the docs theme and the asset kit.

Several packages, one per part, is how large systems do it (Primer has primitives, CSS and components apart). It pays when parts have their own users and their own release rhythm. Here every part reads the same tokens, changes together and has one maintainer, so one version and one install is simpler and cannot drift. `@vue/theme`, Open Props and VoidZero's shared docs theme are single packages for the same reason. The VitePress, Vue and Tailwind peers are optional, so a project that only wants the styles installs nothing extra.

## Tokens: the DTCG format, built by Terrazzo

The tokens are written in the Design Tokens Community Group format (the 2025.10 version, with a resolver file for the two themes) and built by [Terrazzo](https://terrazzo.app).

| Option                                                                              | What it is                                                | Why or why not                                                                                                                                                                                                                                    |
| ----------------------------------------------------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Terrazzo 2**                                                                      | Built around the DTCG format and its resolver             | Chosen. It reads the current format as it is, emits the theme blocks through plain selectors that this repository controls, and lints the token files. Themes are a resolver with two contexts, which is the standard way to say "dark and light" |
| Style Dictionary 5                                                                  | The long-standing tool, with DTCG support since version 4 | Its own docs say the 2025.10 format is not fully supported yet, and a theme switch needs a custom format                                                                                                                                          |
| Hand-written, as Open Props, Radix Colors, the Rosé Pine and Catppuccin palettes do | A script that turns a JavaScript object into CSS          | The least machinery, but a format of our own. Nothing else could read the tokens                                                                                                                                                                  |

Two things Terrazzo does not do are done here. Its contrast rule only checks the default theme, so the contrast of every pair is a unit test over both themes, driven by `tokens/contrast.json`. And its JavaScript output is the resolver API, which is right for build scripts and is what the package exports as data.

Colors are written as sRGB hex, the exact Rosé Pine values, not converted to another color space, because the contrast figures are measured from those values.

## Themes: an attribute and a media query

Dark is the default block, light applies under `prefers-color-scheme: light`, and `data-theme` overrides both, on the page or on any element inside it. So does a `dark` or `light` class, which Nuxt UI and VueUse's `useColorMode` put on `<html>`, so an app built on them needs no script to bridge the two. The toggle script in Tailwind's docs, VueUse's `useDark` and VitePress mark light only by leaving `dark` off. A stylesheet cannot tell that from no choice at all, so no class stays the system's theme. An app on one of those keeps a `light` class in step with `dark`: on for light, off for dark or the system. The docs theme sets `data-theme` for every choice from VitePress's switch instead. On one element the attribute wins over the class, so `setTheme` still holds where a library has left its class. The selectors of both are made in one place, `scripts/lib/theme-selectors.ts`, and the token build writes them into the theme blocks of the tokens, into the rules of an element for one theme only and into the `dark:` and `light:` variants of the Tailwind entry. A `.dark` block of its own would have needed a copy of every value.

The newer way is `light-dark()` with `color-scheme`. It needs no second block and nests for free. It was not used because a browser without it shows no colors at all, and the selector approach works everywhere and still nests: the samples in the style guide use `data-theme` or a `dark` or `light` class on an element.

An element for one theme only, `ws-theme-dark` or `ws-theme-light`, is hidden by selectors too. A token cannot hide an element: `display` cannot be switched by a variable without losing the display the element has, and a container style query, which could read the theme from a variable, is not in every browser yet. A selector cannot ask for the nearest `data-theme` or class, so the rules spell out the depths that occur: a theme on `<html>` and up to three parts held in a theme, one in the other. They hide with `!important`, so no other rule that sets the display of the element shows it in the wrong theme.

The color of the browser's own bars, `<meta name="theme-color">`, is read from the stylesheet, from `--ws-color-bg` on `<html>`, and not written into the theme module. So it is the token's value in the theme that applies, by the same rules as everything else, and the module carries no copy of a color. The price is that it is known only once the stylesheet is there: the head script sets it in the first animation frame, which a browser runs once the stylesheets of the `<head>` are loaded and before the first paint. Material for MkDocs reads its theme-color from the page the same way.

A page without JavaScript, and a link preview, which reads the HTML as it is sent, would get no color at all that way. So the served `<head>` has two tags of its own: the dark background, and the light one under `media="(prefers-color-scheme: light)"`, which is the theme the stylesheet chooses with no choice by hand. They are written from the tokens when a site is built, by `themeColorMeta` in its own entry, `theme/meta`, which reads the token data: the theme module, which runs in the page, still carries no color. The head script then takes both tags over. The dark one comes first, under `not all and (prefers-color-scheme: light)`, so a reader that takes the first tag and ignores `media` gets the default theme, and a browser that knows `media` gets the same as the stylesheet. One tag without `media` would have left a light system with the dark color until the script ran, and none at all without it.

## Forms: shared measures, not components

The system draws no fields and no buttons. Each app that uses it draws its own from the roles, in a few rules each, and the system gives them what they have to share to look like one family: a control height, the sizes of the small boxes, a hover and a pressed fill, a check icon, and the two pieces that are more than a box, a segmented control and a list of terms and values. A set of field classes would have to cover every state of every control in every framework's markup, which the first three apps did not need.

The hover and pressed fills of the interactive color are that color a step further from the page in OKLab lightness, 0.05 and 0.1: lighter on dark, darker on light, so the label on them gains contrast in both themes. The first apps mixed the text color in instead, which barely moves the fill on Dawn, where pine and the text are about as dark.

Icons have one size, `--ws-size-icon`, 16 px, and no scale of sizes. Each is drawn on a grid of 16 in strokes of 1.5, the weight of the text it stands next to. Drawn at another size the stroke scales with it: at 12 px it is just over a pixel and blurs, at 24 px it is heavier than the text beside it. The apps drew every icon at 16 px already, the tick, the icon of a field in error and the calendar of a date picker. An icon that has to be larger is a drawing of its own. The chevron of a prompt and the arrow of a link are not on the grid: they are glyphs, sized in `em` with their text.

The sections of a review step share their term column through a group around their lists, `ws-pairs-group`, that holds the columns, with each list and each row in it a subgrid of them. So the column is as wide as the longest term of all the sections, measured by the browser, and a section of short terms lines up with the rest. A fixed width for the terms, a variable an app would set, was the alternative: it needs no group, but it is a guess, too wide for short terms and too narrow for a long one in another language. One list with the headings as rows of it was another, but a heading inside a `<dl>` is not a term or a value. A browser without subgrid, Chrome before 117, sizes each list apart, as before.

The pressed segment of a segmented control is raised, with a thicker edge of the interactive color, not filled. A filled segment next to a filled primary button reads as a second primary button. The edge carries the state at 3:1 or more on the page and on the raised fill.

## The frame on a phone: a gutter of 16 px

Below 64rem one length, `--ws-space-16`, is the gutter: the brand of the tab bar starts that far in from the window's edge, and the content under it, a pane, a page or a form, is padded by the same, so the two start at one pixel. The style guide's example padded a pane 20 px, which left it 4 px off the brand, and the apps each chose for themselves. 16 px was chosen over 20 because the brand already had it, the form example and the apps used it, and on a 320 px phone the four pixels a side go to the content. The docs theme takes it on a phone too, below 48rem, where the default theme lays out for one: it padded the brand 16 px and the page and the row of its menu 24 px. From 48rem the default theme centers the page, which then shares no edge with the brand.

The status line pads its items 10 px below 64rem, and 14 px from there up. At 390 px, with the mode, the keys switch and the theme button, 14 px left the path a few characters. The website set 10 px on a phone for that reason, and with it the path keeps about 32 px more. Every item takes the smaller padding, not only the path, so the items still look alike.

The path shows only with room for five characters and the ellipsis, `6ch` of the status line's mono face, and goes as a whole with less. With 10 px the path got the room for a letter and the ellipsis where it had gone before, `w…` on a 320 px phone, which reads as a glitch and not as a path cut on purpose. Five characters are a short word or the start of one, such as `~/pro…` or `docs/…`. Fewer leave a stub. The width is in `ch` of the line's own face, not a length from the spacing scale, so it holds characters at any font size. It is written out in the container query, next to the padding, as a query takes no `var()`.

## Breakpoints: 64rem and 40rem

The system has two widths where a layout changes, and no scale of them. Below 64rem, `--ws-compact`, a page has one column. Below 40rem, `--ws-narrow`, a row of fields stacks. The first apps had only the first, so a tablet showed one field to a line in a column that had room for two: a field such as a name or a date reads well from about 17rem, and two with the gap between them and the gutters of the page fit in about 38rem.

40rem is Tailwind's `sm`, as 64rem is its `lg`, so the Tailwind entry needs no breakpoints of its own: `max-sm:` and `max-lg:` are the system's two. The name says what the width is, narrow, as compact does, and not a device. A third width, such as Tailwind's `md` at 48rem, was left out: each is a layout to design and to check, and no app needed one.

## Tailwind entry: plain CSS, with an entry for Tailwind CSS v4

The stylesheets stay plain CSS, which any page can import, and an app on Tailwind CSS v4 imports `tailwind.css` in their place: Tailwind and the same stylesheets in Tailwind's cascade layers, with the tokens as its theme. Rewriting the system in Tailwind, as utilities and `@apply`, was the alternative. It would make Tailwind a dependency of everything that uses the system, the docs theme and the framework-free pages included, for what one entry already gives the apps on it. Tailwind stays an optional peer, and only that entry needs it.

The theme is `@theme inline`, so a utility reads the token where it is used: `bg-surface` is `background-color: var(--ws-color-surface)`. Without `inline`, Tailwind declares a variable of its own, `--color-surface`, on `:root`, and the utility reads that. It takes the token's value once, at the root, so the utility keeps the theme of the page and ignores a `data-theme` or a `dark` or `light` class on a part of it. Inline, a utility follows the theme as the system's classes do.

Tailwind's defaults that no token stands behind are taken out: its palette, its shadows, and the families, weights and radii the system does not have. As a class one makes nothing, and in `@apply` one fails the build, so an app does not reach for a color or a shadow outside the system by habit. The token build maps every group of tokens or names why it leaves one out, so a new group is a decision.

## Docs theme: on top of VitePress's default theme

The docs theme extends the default theme and restyles it. It does not replace it.

| Option                                                             | Example                                             | Why or why not                                                                                                                                                                                                                         |
| ------------------------------------------------------------------ | --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Extend the default theme: variables, stylesheets, layout slots** | `vitepress-theme-tui`, most branded VitePress sites | Chosen. A site keeps its whole config: nav, sidebar, search, i18n, edit links. Accessibility and search come from VitePress and stay maintained there                                                                                  |
| A theme of its own                                                 | `@vue/theme`, about a hundred files                 | Full control over the markup, and no dependency on the default theme's class names. But it means owning the sidebar, the outline, the search, the mobile menus and their accessibility for good, which a lean first version should not |

The price is that the stylesheets address the default theme's class names, and its component styles are scoped, so selectors repeat a bit of structure to win. The theme therefore follows VitePress 1, and a new major version needs a pass over `src/vitepress/styles/`. The screenshot tests would show what moved.

The theme's client code ships as source, as `@vue/theme` does, so the site's own build compiles it. The base config has to be loaded by Node, so it ships compiled.

The status line and the tab numbering are real: keys are bound to the controls they are shown on, in one small module that the framework-free pages use too.

Those keys are single characters, which WCAG 2.1.4 allows only with a way to turn them off, to remap them, or to limit them to a focused control. The way here is one switch in the status line, `keys on`, that the same module wires and the browser remembers. It follows the switch pattern of the ARIA Authoring Practices, and what GitHub does with its "character keys" setting: one remembered choice that rests every single-key shortcut. The module makes the switch a condition: a key acts only on a page that has one, so a page cannot have the keys without the way out. A held key acts once, because a key that repeats would switch the theme many times a second, a flash WCAG 2.3.1 forbids. There is no site option to drop it and no remapping.

In the tab bar the brand has a box as wide as the sidebar and the tabs start where it ends, so one length places both the border of the sidebar and the left edge of the first tab, in plain CSS, with nothing measured in a script. A short brand leaves a gap before the tabs, which is accepted. An earlier form put the first tab inside that box, with its right edge on the border. It kept the tabs next to the brand, but the brand and the first tab then had to share about 17 characters, a project name such as `building-blocks` was cut, and the brand needed CSS anchor sizing to learn how wide the tab was. Now only a brand longer than the sidebar is cut, and the tabs have no limit that comes from the brand.

## Asset kit: a generator on established libraries

`scripts/generate-assets.ts` draws every file from the sprite data: SVG as strings, PNG through [resvg](https://github.com/linebender/resvg), ICO through `png-to-ico`, and text as outlines through `opentype.js`.

| Option                                                                        | Why or why not                                                                                                                                                                                         |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **A generator of our own on those libraries**                                 | Chosen. The marks are sprites that must land on whole pixels at every size, which a favicon tool that scales one image cannot promise. The same code draws marks, lockups and banners from one drawing |
| Favicon generators: `@vite-pwa/assets-generator`, `favgen`, `modern-favicons` | They take one image and resize it. At 180 px a 16 x 16 sprite does not divide evenly, so pixels blur. They also do nothing for lockups and banners                                                     |
| Satori for the banners                                                        | It renders HTML to SVG and needs fonts at build time. The banner is a fixed layout of a few lines and a sprite, which is less code as SVG than as HTML                                                 |

resvg was chosen over sharp because it draws the same pixels on every platform. That is what lets the generated kit be committed and checked: `assets/` is in the repository so a change to artwork shows in a pull request as changed images, a README can show its own header, and CI fails when `assets/` is not what the sources produce.

## Fonts: from Fontsource at build time

The variable fonts and their licenses are copied from the Fontsource packages into `dist/fonts/` when the package builds, with a stylesheet that declares the `latin` and `latin-ext` subsets. No font file is kept in the repository, the lockfile pins the versions, and the package is self-contained for a project that uses it.

Depending on the Fontsource packages at runtime was the alternative. It would make every consumer resolve another package's CSS, and ship all subsets.

## Checks

- Contrast is a unit test, not a manual table: `tokens/contrast.json` lists the pairs and their bars.
- Stylelint rejects a color that is not a token in the stylesheets.
- The screenshots are taken and compared in the Playwright container, on Linux, because text is drawn differently on every system. They are committed, so a visual change shows in a pull request.
- Lint and format follow form-builder: oxlint, ESLint for Vue and TypeScript, and oxfmt.
