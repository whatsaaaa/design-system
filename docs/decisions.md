# Decisions

Why the design system is built the way it is, and what was looked at before deciding. The direction itself, the ghost, the terminal, Rosé Pine and the two faces, was settled before this repository existed. This is about how it is built.

## One package

Everything ships as one package, `@whatsaaaa/design-system`, with one entry per part: the stylesheets, the tokens, the ghost, the theme switch, the shortcuts, the code theme, the docs theme and the asset kit.

Several packages, one per part, is how large systems do it (Primer has primitives, CSS and components apart). It pays when parts have their own users and their own release rhythm. Here every part reads the same tokens, changes together and has one maintainer, so one version and one install is simpler and cannot drift. `@vue/theme`, Open Props and VoidZero's shared docs theme are single packages for the same reason. The VitePress and Vue peers are optional, so a project that only wants the styles installs nothing extra.

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

Dark is the default block, light applies under `prefers-color-scheme: light`, and `data-theme` overrides both, on the page or on any element inside it.

The newer way is `light-dark()` with `color-scheme`. It needs no second block and nests for free. It was not used because a browser without it shows no colors at all, and the selector approach works everywhere and still nests: code blocks and the samples in the style guide use `data-theme` on an element.

An element for one theme only, `ws-theme-dark` or `ws-theme-light`, is hidden by selectors too. A token cannot hide an element: `display` cannot be switched by a variable without losing the display the element has, and a container style query, which could read the theme from a variable, is not in every browser yet. A selector cannot ask for the nearest `data-theme`, so the rules spell out the depths that occur: a theme on `<html>` and up to three parts held in a theme, one in the other. They hide with `!important`, so no other rule that sets the display of the element shows it in the wrong theme.

The color of the browser's own bars, `<meta name="theme-color">`, is read from the stylesheet, from `--ws-color-bg` on `<html>`, and not written into the theme module. So it is the token's value in the theme that applies, by the same rules as everything else, and the module carries no copy of a color. The price is that it is known only once the stylesheet is there: the head script sets it in the first animation frame, which a browser runs once the stylesheets of the `<head>` are loaded and before the first paint. Material for MkDocs reads its theme-color from the page the same way.

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
