---
'@whatsaaaa/design-system': minor
---

The pieces the first apps and the website each drew for themselves, mostly for forms.

- **A check icon.** `--ws-icon-check`, drawn like the other icons, for a ticked box, a done step or a sent form.
- **Sizes for controls.** `--ws-size-control` (40 px) is the height of a one-line field, a button and a segmented control. `--ws-size-check` (20 px) is a checkbox or a radio button, `--ws-size-step` (24 px) the circle of a step number, `--ws-size-icon` (16 px) an icon next to text.
- **A hover and a pressed fill for the primary button.** `--ws-color-interactive-hover` and `--ws-color-interactive-active`, the interactive color a step further from the page, with their contrast checked. The docs theme's primary buttons use them.
- **A segmented control.** `ws-segmented`, in the new `css/segmented.css`: buttons in a row with `aria-pressed`, such as a switch between languages. The pressed one is raised with an interactive edge at 3:1, and takes the selection colors in forced colors. The usage guide says how its keys work.
- **Terms and values.** `ws-pairs`, in the new `css/pairs.css`: a `<dl>` for the review step of a form, and with `ws-pairs--amounts` for an order summary, its amounts aligned at the right in tabular figures, with a `ws-pairs__total` row.
- **Number fields.** `base.css` hides the browser's spin buttons on `<input type="number">`. The arrow keys still step the value.
- **The ghost without markup.** `ghostElement()` builds the ghost as an element, and `<ws-ghost>` now fills itself in without `innerHTML`. The kit has `ghost-on-dark.svg` and `ghost-on-light.svg`, the ghost without the margin of its grid, for a component that would otherwise need `v-html` or `dangerouslySetInnerHTML`. The usage guide says how far a project's mark sits inside its box, and how to pull it out to an edge.
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

A page that loads `base.css` now shows a number field without spin buttons, where the browser showed its own before. The `<ws-ghost>` element no longer sets `innerHTML` when it fills itself in.
