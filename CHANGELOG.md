# @whatsaaaa/design-system

## 0.15.0

### Minor Changes

- [#83](https://github.com/whatsaaaa/design-system/pull/83) [`82b2662`](https://github.com/whatsaaaa/design-system/commit/82b26624c1cce8b172276679f5782da188f175ec) Thanks [@whatsaaaa](https://github.com/whatsaaaa)! - The five tints, `color.tag-bg`, `color.tip-tint`, `color.note-tint`, `color.warning-tint` and `color.danger-tint`, are opaque in both themes: each is the color its hue made on the page at its strength, 12% or 10% for the tag and 9% for a status. On the page nothing changes. A tag, a callout or the danger button's hover fill now reads the same on every ground: a tag in a chosen table row read as low as 2.48:1 in dark and 3.89:1 in light, and now reads 4.87:1 or more everywhere. On a panel, and on the raised color in dark, a tint is a touch darker than before, and on the raised color in light a touch lighter. On a tint, body text and a description take `color.text`, never secondary text, and a tag's word and a status label keep their `-text` token: `docs/usage.md` says so, `tokens/contrast.json` checks `color.text` on `color.tag-bg`, and the checkbox and radio group specs say the description of a checked card takes the text color. The contrast check fails a pair whose background is translucent unless it names the color it lies `over`.

- [#80](https://github.com/whatsaaaa/design-system/pull/80) [`5a08862`](https://github.com/whatsaaaa/design-system/commit/5a08862e2c645897ec9c20cbd0f4434f82d80d71) Thanks [@whatsaaaa](https://github.com/whatsaaaa)! - A component spec holds nothing about one implementation any more, and no version of its own. This breaks whatever read either from a spec, and every parity test that named an implementation.

  What breaks:

  - **The spec format loses `implementations`.** The field, its place among the required ones and the two definitions only it used, `implementation` and `props`, are gone from `specs/spec.schema.json`, and the entry is gone from all eleven specs: the library and its version, the slot that draws each part, the props of each kind and size, the deviations and the result of the parity test. A spec with the field no longer validates. An implementation keeps what it records about itself in its own repository.
  - **The spec format loses `changed`**, the version a spec last changed in, from the schema and from all eleven specs. It was written by hand before a release knew its version. This changelog is where a change to a spec is recorded.
  - **The `testing` helper's `implementation` option is replaced by `parts`.** `expectSpec(page, name, { implementation: 'ui-vue' })` read the part map of that entry in the spec. Now the implementation passes its own map: `expectSpec(page, name, { parts: { root: 'base', required: 'label::after', 'leading-icon': 'base leadingIcon' } })`. A value is what the spec's map held: a slot, a slot and a pseudo-element of it, or a slot inside another, and a slot's name can now hold a hyphen, as a part's own name does. A part the map does not name is still the slot of its own name. New: a map that names a part the spec does not have, or draws a part as anything else, fails with an error that names it, such as `the button spec has no part rooot`, so a part an update of the spec renamed is not left unchecked. An option the helper does not have, such as `implementation`, is an error too, where it used to be left unread.
  - **The types of `@whatsaaaa/design-system/testing` follow**: `Spec` has no `implementations` and no `changed`, and `SpecOptions` has `parts` in place of `implementation`.

  `expectSpec`, `checkSpec`, `loadSpec` and `specNames` keep their names and signatures. No part, kind, size, state, row or gallery id of any spec changes.

  To follow, an implementation moves each map out of the specs into a file next to its parity test and passes it as `parts`, and keeps its props, its deviations and its parity result in its own docs. The entries as they were stay readable in 0.14.0: `node -p "require('@whatsaaaa/design-system/specs/button.spec.json').implementations"` with that version installed.

  A spec's notes name no component library and no implementation any more, the schema's description of a size neither, and a test holds both to it. In the style guide, a component's page loses its table of implementations, its "Implementations" section and its "Last changed in" line.

- [#75](https://github.com/whatsaaaa/design-system/pull/75) [`14031be`](https://github.com/whatsaaaa/design-system/commit/14031be5141e9d72d5b5c25542c8106b8531c9c2) Thanks [@whatsaaaa](https://github.com/whatsaaaa)! - The stylelint config rejects a `color()` literal, such as `color(srgb ...)` or `color(display-p3 ...)`, as it does the other color functions. `color-mix()` still passes. It now knows the `--ws-icon-*` variables of `css/icons.css` next to the tokens, so a project that extends `@whatsaaaa/design-system/stylelint` names no file of the package in its own config. `docs/usage.md` says what a project on Tailwind CSS adds for Tailwind's at-rules and functions.

- [#85](https://github.com/whatsaaaa/design-system/pull/85) [`ef53171`](https://github.com/whatsaaaa/design-system/commit/ef5317163f539c9656173a50c454c024d0c47bbc) Thanks [@whatsaaaa](https://github.com/whatsaaaa)! - Every color of the component tier names its state, the select's separator is a border, and the status line's two older class names are gone. Each of the three breaks what reads the old name or draws the old way. This is the last 0.x release that breaks anything before 1.0.0, so no renamed variable keeps an alias.

  What breaks:

  - **26 colors of the tier take `rest`.** A color of the tier now always ends in a state, `rest` where it has no other, as `--ws-field-border-rest` already did: `field.bg` is `field.bg.rest`, read as `--ws-field-bg-rest`. Each keeps its alias, its value in both themes and its contrast pairs, so nothing draws differently. A later state, such as a disabled fill, joins its color with no rename. A stylesheet that reads an old variable gets no value from it, so the property falls back to what it inherits or its initial value: the stylelint config of this version reports each one as a variable that nothing defines. The specs that named the old ids, badge, checkbox, input, modal, radio-group, select, select-menu and table, name the new ones, and `.ws-tag` and the prose table read them.
  - **The separator of a select's and a select menu's list is a border.** The `open` rows of `separator` were a fill, `background-color` `color.border` with a `height` of `border-width.thin`. They are now `border-block-end-style` `solid`, `border-block-end-width` `border-width.thin` and `border-block-end-color` `color.border`. Forced colors, such as a Windows contrast theme, paint a fill in the list's color and the line was gone; a border is kept. An implementation that draws the line as a fill fails the parity test until it draws a border.
  - **`ws-status-line__item--dark` and `ws-status-line__item--light` are removed.** They were older names of `ws-theme-dark` and `ws-theme-light`, an element shown in one theme only. Use those.

  | Variable in 0.14           | Variable now                    | Token in 0.14         | Token now                  |
  | -------------------------- | ------------------------------- | --------------------- | -------------------------- |
  | `--ws-choice-control-bg`   | `--ws-choice-control-bg-rest`   | `choice.control.bg`   | `choice.control.bg.rest`   |
  | `--ws-field-bg`            | `--ws-field-bg-rest`            | `field.bg`            | `field.bg.rest`            |
  | `--ws-field-icon`          | `--ws-field-icon-rest`          | `field.icon`          | `field.icon.rest`          |
  | `--ws-field-label-text`    | `--ws-field-label-text-rest`    | `field.label.text`    | `field.label.text.rest`    |
  | `--ws-field-help-text`     | `--ws-field-help-text-rest`     | `field.help.text`     | `field.help.text.rest`     |
  | `--ws-field-error-text`    | `--ws-field-error-text-rest`    | `field.error.text`    | `field.error.text.rest`    |
  | `--ws-field-error-icon`    | `--ws-field-error-icon-rest`    | `field.error.icon`    | `field.error.icon.rest`    |
  | `--ws-field-required-text` | `--ws-field-required-text-rest` | `field.required.text` | `field.required.text.rest` |
  | `--ws-overlay-bg`          | `--ws-overlay-bg-rest`          | `overlay.bg`          | `overlay.bg.rest`          |
  | `--ws-overlay-border`      | `--ws-overlay-border-rest`      | `overlay.border`      | `overlay.border.rest`      |
  | `--ws-table-head-bg`       | `--ws-table-head-bg-rest`       | `table.head.bg`       | `table.head.bg.rest`       |
  | `--ws-table-head-text`     | `--ws-table-head-text-rest`     | `table.head.text`     | `table.head.text.rest`     |
  | `--ws-table-row-text`      | `--ws-table-row-text-rest`      | `table.row.text`      | `table.row.text.rest`      |
  | `--ws-tag-primary-bg`      | `--ws-tag-primary-bg-rest`      | `tag.primary.bg`      | `tag.primary.bg.rest`      |
  | `--ws-tag-primary-text`    | `--ws-tag-primary-text-rest`    | `tag.primary.text`    | `tag.primary.text.rest`    |
  | `--ws-tag-success-bg`      | `--ws-tag-success-bg-rest`      | `tag.success.bg`      | `tag.success.bg.rest`      |
  | `--ws-tag-success-text`    | `--ws-tag-success-text-rest`    | `tag.success.text`    | `tag.success.text.rest`    |
  | `--ws-tag-info-bg`         | `--ws-tag-info-bg-rest`         | `tag.info.bg`         | `tag.info.bg.rest`         |
  | `--ws-tag-info-text`       | `--ws-tag-info-text-rest`       | `tag.info.text`       | `tag.info.text.rest`       |
  | `--ws-tag-warning-bg`      | `--ws-tag-warning-bg-rest`      | `tag.warning.bg`      | `tag.warning.bg.rest`      |
  | `--ws-tag-warning-text`    | `--ws-tag-warning-text-rest`    | `tag.warning.text`    | `tag.warning.text.rest`    |
  | `--ws-tag-danger-bg`       | `--ws-tag-danger-bg-rest`       | `tag.danger.bg`       | `tag.danger.bg.rest`       |
  | `--ws-tag-danger-text`     | `--ws-tag-danger-text-rest`     | `tag.danger.text`     | `tag.danger.text.rest`     |
  | `--ws-tag-neutral-bg`      | `--ws-tag-neutral-bg-rest`      | `tag.neutral.bg`      | `tag.neutral.bg.rest`      |
  | `--ws-tag-neutral-text`    | `--ws-tag-neutral-text-rest`    | `tag.neutral.text`    | `tag.neutral.text.rest`    |
  | `--ws-tag-outline-text`    | `--ws-tag-outline-text-rest`    | `tag.outline.text`    | `tag.outline.text.rest`    |

  To follow, replace each variable of the table's first column with the one beside it, and draw the separator as a border.

  `tests/tier.test.ts` holds the rule: a color of the tier ends in a state of the closed list, where it used to allow none, and the contrast pairs no longer read a color without a state as the color at rest. `docs/usage.md` and `docs/decisions.md` state the rule. The token descriptions of the control, choice and tag groups name no component library any more, and a test holds every token file to it.

### Patch Changes

- [#84](https://github.com/whatsaaaa/design-system/pull/84) [`65709ca`](https://github.com/whatsaaaa/design-system/commit/65709ca4c71f980a5f04d25aeda0d3a962a574fe) Thanks [@whatsaaaa](https://github.com/whatsaaaa)! - The docs theme's theme switch, menu button and search button keep showing in forced colors, such as a Windows contrast theme. The browser paints every fill in the page's color there, so the switch's sun and moon and the magnifier of the phone's search button, which are masks, the switch's knob, and the lines of the phone's menu button, which are fills, were gone. The theme switch was an empty box, its border all that was left of it, and the menu button and the phone's search button, which have no border, could not be seen at all. Each is now drawn in the system's color of a button's text, the knob as a ring, and the menu button's cross with its menu open too. On a wider screen the search button shows its word and its key, which forced colors kept, and it does not change. Out of forced colors nothing changes. A site on the docs theme takes this with no change of its own.

- [#81](https://github.com/whatsaaaa/design-system/pull/81) [`87b1ad5`](https://github.com/whatsaaaa/design-system/commit/87b1ad567078fa97b98adcf8e353b351156548bc) Thanks [@whatsaaaa](https://github.com/whatsaaaa)! - The icons drawn as masks keep showing in forced colors, such as a Windows contrast theme. The browser paints every fill in the page's color there, the fill under a mask too, so the callout's icon, the arrow after a link that leaves the site, the prompt's chevron and the arrow of the docs theme's links out were gone. Each is now drawn in the system's color of the text it stands with: the callout's icon and the chevron in the text color, an arrow in its link's color. In the docs theme the same holds for the default theme's own icons of the links out, in the menu behind the three dots and in the phone's menu, for the three dots, and for the arrow after a link of the bar or the sidebar that leaves the site. Out of forced colors nothing changes. A page with these pieces or a site on the docs theme takes this with no change of its own. An icon you draw yourself from `css/icons.css` needs the same rule, which `docs/usage.md` and the file's comment give.

## 0.14.0

### Minor Changes

- [#72](https://github.com/whatsaaaa/design-system/pull/72) [`65835e2`](https://github.com/whatsaaaa/design-system/commit/65835e2a4fcb5f2d188df70d3b8d66a94a313191) Thanks [@whatsaaaa](https://github.com/whatsaaaa)! - Two more component specs, both drafts: `table` and `tabs`, each with its page in the style guide. A table is the prose table's: a frame with the large radius that it scrolls in, its head on the surface as an overline, rows apart by lines and amounts at the end of their column in figures of one width. A table whose rows can be chosen is still a table, with a checkbox in each row's first cell and one in the head to choose every row: it raises a row under the pointer, gives a chosen row the selection color with the line under it in `color.selection-border`, rings a row inside it while its checkbox has the focus, and keeps the chosen row in the selection colors in forced colors. Tabs are the frame's tabs as views switched in place, in Nuxt UI's five sizes: a row of mono labels over a line, the current tab marked by a bar of the brand color, which keeps the selection color in forced colors. Nuxt UI's pill tabs have no spec: the segmented control covers that use. Their implementations record what ui-vue draws today and where it does not meet them yet.

  The component tier gains the `table` group, which the prose table reads too: the head `--ws-table-head-bg` and `--ws-table-head-text`, the room in each cell `--ws-table-cell-padding-inline` and `--ws-table-cell-padding-block`, a row's text `--ws-table-row-text`, and its fill under the pointer and once chosen, `--ws-table-row-bg-hover` and `--ws-table-row-bg-selected`. The prose table looks as it did. The color roles gain `color.selection-border`, a line on the selection color: Dawn's highlight high on light, a step darker than the selection color, which is the border color there, and the border color on dark. The tabs have no group: each of their states is a role that already names its use.

  A spec row can set `text-align` and `font-variant-numeric`. In forced colors the `testing` helper compares the pixels each part covers at least half of, so a row at a fraction of a pixel no longer takes in the line under it, and where a part is drawn at another size or place in the two examples, such as the bar under another tab, it compares the closest elements around the part that are at one size and place in the two, such as the row of tabs and not the panel under it, where it used to find a difference that did not show a state.

- [#70](https://github.com/whatsaaaa/design-system/pull/70) [`90ab5f8`](https://github.com/whatsaaaa/design-system/commit/90ab5f8c2a96dd9a0ad262b50d7d633cb9dededf) Thanks [@whatsaaaa](https://github.com/whatsaaaa)! - Two more component specs, both drafts: `badge` and `card`, each with its page in the style guide. A badge is the system's tag, a short word next to what it describes, in Nuxt UI's five sizes: on a tint in `primary`, the tag, and in `success`, `info`, `warning`, `danger` and `neutral`, or outlined, the kinds in use. A card is a panel on the surface in an edge of the border color with the large radius, an optional header with its title and description, a body and an optional footer of actions, its parts apart by a line. Their implementations record what ui-vue draws today and where it does not meet them yet, such as an outlined badge drawn as a ring in the padding of a tint, and a card's title that is no heading.

  The component tier gains the `tag` group: the fill and the word of each kind on a tint, `--ws-tag-<kind>-bg` and `--ws-tag-<kind>-text`, the word of the outlined one, `--ws-tag-outline-text`, the radius `--ws-tag-radius`, and at each size the padding of a tag on a tint, `--ws-tag-padding-inline-<size>` and `--ws-tag-padding-block-<size>`, which an xs tag does not have, and of an outlined one, `--ws-tag-outline-padding-inline-<size>` and `--ws-tag-outline-padding-block-<size>`. Every pair of its colors reaches 4.5:1 in both themes. `.ws-tag` and `.ws-tag--outline` read it, and look as they did; a `.ws-tag` takes a gap of `space.6` for an icon beside its word. A card names its roles directly and has no group.

### Patch Changes

- [#68](https://github.com/whatsaaaa/design-system/pull/68) [`5bb4ce7`](https://github.com/whatsaaaa/design-system/commit/5bb4ce73eed6ce42151226cb0a2278fcf4a49e8f) Thanks [@whatsaaaa](https://github.com/whatsaaaa)! - Inline code no longer breaks at its hyphens. A browser breaks code after any hyphen at the end of a line, so `--ws-field-*` read as `-` and `-ws-field-*`, and `@whatsaaaa/design-system/specs/button.spec.json` broke after `design-`. The docs theme's Markdown setup now holds each run of hyphens in inline code to the characters on both sides of it, in a `<span class="ws-code-joined">` that the prose styles keep on one line, and puts a `<wbr>` after the slashes of a path, so a path breaks there. Code too long for a line still breaks, elsewhere in it, and copies as it is. Inside a table cell, where code stays in one piece, a `<wbr>` has no box.

## 0.13.0

### Minor Changes

- [#62](https://github.com/whatsaaaa/design-system/pull/62) [`0e4878d`](https://github.com/whatsaaaa/design-system/commit/0e4878d231ede033b72f9c853e2ba8484efd5afb) Thanks [@whatsaaaa](https://github.com/whatsaaaa)! - Two more component specs, both drafts: `checkbox` and `radio-group`, in their list look and Nuxt UI's five sizes. In forced colors each keeps the edge of its box or circle, and a checked one its fill and its mark. The checkbox is checked, indeterminate or neither, with its label, description, required mark and error; the radio group is a legend over its options. Each has a page in the style guide, drawn from its file, and records what ui-vue draws today and where it does not meet the spec yet, such as a disabled checked box in the interactive fill.

  The component tier gains the `choice` group, what the two share: `--ws-choice-control-size-<size>`, the side of the box or the circle at each size, 14 to 24 px; its color `--ws-choice-control-bg` and edge `--ws-choice-control-border-<rest|hover|invalid|disabled>`; the fill and the mark of a checked or an indeterminate one, `--ws-choice-indicator-<bg|icon>-<checked|indeterminate|disabled>`; and an option's label and description, `--ws-choice-label-text-<rest|disabled>` and `--ws-choice-description-text-<rest|disabled>`. New semantic sizes for it: `--ws-size-check-xs`, `-sm`, `-lg` and `-xl`, 14, 16, 22 and 24 px, and `--ws-size-tick-sm` and `-lg`, the tick of 12 and 18 px. The space page of the style guide lists them.

  The `testing` helper compares an indeterminate example with its example at rest in forced colors too, and compares the two examples whole where the state draws a part the example at rest does not, such as a checked box's fill. Where an example has several elements of one slot, such as a group's options, it measures the first that draws the part. No existing token, style or spec changes.

- [#67](https://github.com/whatsaaaa/design-system/pull/67) [`b684f51`](https://github.com/whatsaaaa/design-system/commit/b684f51b4dc74fd556631e21774b3a8bbc19a2a7) Thanks [@whatsaaaa](https://github.com/whatsaaaa)! - Three more component specs, all drafts: `select`, `select-menu` and `modal`, each with its page in the style guide. A select and a select menu are a field, as the input's, in Nuxt UI's five sizes, whose list opens on a panel; a select menu's list has a search at its top. A modal is a window over the page dimmed in its own color, with a header bar as tall as the tab bar, a body and a footer of actions. Their implementations record what ui-vue draws today and where it does not meet them yet.

  The component tier gains the `overlay` group, for what a select's list and a modal's window share: `--ws-overlay-bg`, the edge `--ws-overlay-border` and `--ws-overlay-border-width`, and for each the radius and the padding, `--ws-overlay-list-radius`, `--ws-overlay-list-padding`, `--ws-overlay-window-radius` and `--ws-overlay-window-padding`. The edge is the field border, which reads at 3:1 on the panel and on the page. An overlay has no shadow, as nothing in the system does, and its specs say `box-shadow: none`.

  A spec row can set `padding-block`, `min-height`, `max-width`, `box-shadow`, `text-transform` and the line under a part, `border-block-end-style`, `-width` and `-color`, and the `testing` helper compares `border-block-end-color` as a color. An implementation's part map can name a slot inside another where one slot draws two parts, `base leadingIcon`, the icon of a select menu's trigger and not of the search in its list. The `open` state's examples draw their list or window in place, inside the example, and a select's example wraps the select itself, never its form field.

## 0.12.0

### Minor Changes

- [#52](https://github.com/whatsaaaa/design-system/pull/52) [`b5d9212`](https://github.com/whatsaaaa/design-system/commit/b5d9212cd7c59c55b275369de1e457e88315a716) Thanks [@whatsaaaa](https://github.com/whatsaaaa)! - `@whatsaaaa/design-system/stylelint`, the token lint rules as a stylelint config, so a project extends it in place of keeping its own copy: a hex value, a named color or a color written with one of the functions `rgb`, `rgba`, `hsl`, `hsla`, `oklch`, `oklab`, `lab`, `lch` and `hwb` is an error, and so is a variable that nothing defines, checked against the `tokens.css` of the version installed, the component tier included, wherever the linter runs. It extends `stylelint-config-standard`. `stylelint`, `stylelint-config-standard` and `stylelint-value-no-unknown-custom-properties` are optional peers that only this entry needs. `docs/usage.md` describes it in section 2. Nothing that exists changes.

### Patch Changes

- [#54](https://github.com/whatsaaaa/design-system/pull/54) [`f0f5df4`](https://github.com/whatsaaaa/design-system/commit/f0f5df4aadf097852d9cd60318755f981fdd1145) Thanks [@whatsaaaa](https://github.com/whatsaaaa)! - The input spec keeps a field's value and icons in their place when its edge widens in an error. Its padding rows were written for rest and so held a field with an error too, whose edge is `control.border-width.invalid`, 2 px, against 1 px at rest: a field whose value did not move measured 1 px less and failed at every size. The spec now has `invalid` rows for `padding-inline-start` and `padding-inline-end` at each size, with an icon on that side and without one, each the padding at rest less the extra edge, `control.border-width.invalid` less `control.border-width.rest` (11 px at md, 35 px past an icon), and a note that says so.

  An implementation's gallery shows, at every size, a field at rest and a field with an error each with its icons and without them, since the rows at rest no longer hold a field with an error. The style guide shows such a padding by its total and names what it takes away.

## 0.11.0

### Minor Changes

- [#50](https://github.com/whatsaaaa/design-system/pull/50) [`62febc0`](https://github.com/whatsaaaa/design-system/commit/62febc0b9a0a5988d051f3a14953995dfc582e92) Thanks [@whatsaaaa](https://github.com/whatsaaaa)! - A row of a component spec can hold only where an example draws a part, `"with": "leading-icon"`, or only where it does not, `"without": "leading-icon"`, and a value can read tokens by their variables, as in `calc(var(--ws-space-12) + var(--ws-control-icon-size-md) + var(--ws-control-gap-md))`. The `testing` helper holds each example only to the rows whose condition it meets, and its coverage check asks that some example meet each one. The rows can also set `padding-inline-start` and `padding-inline-end`.

  The input spec uses them: its root `padding-inline` rows, which an input with an icon could never meet, are now `padding-inline-start` and `padding-inline-end` at each size, the field's padding without an icon on that side and the padding, the control's icon size and its gap with one (36 px at md). Its gallery contract adds `input.outline.invalid.xs`, `.sm`, `.lg` and `.xl`, so the error's size is checked at every size. An implementation's gallery shows those four examples, and at every size an example with each icon and one without it.

## 0.10.0

### Minor Changes

- [#48](https://github.com/whatsaaaa/design-system/pull/48) [`03dd6f5`](https://github.com/whatsaaaa/design-system/commit/03dd6f5c90a70d12a59c7e54bd57aeeed38dc0fc) Thanks [@whatsaaaa](https://github.com/whatsaaaa)! - `@whatsaaaa/design-system/testing`, a Playwright helper that holds an implementation's gallery to the published component specs, whatever its framework. `expectSpec(page, 'button', { implementation: 'ui-vue' })` checks, in both themes, that every example of the spec's gallery is on the page by its `data-spec` id and every row of the state table is drawn by an example; that each property of each part is its token's value, resolved inside the part so a part held in the other theme is measured in it; and that in forced colors each part with an edge keeps a border or an outline and a checked, current or selected example still looks unlike its example at rest. A hover, a pressed state and the focus are forced with `data-demo`, never with the pointer. `checkSpec` returns the failures in place of failing, and `specNames` and `loadSpec` read the specs. `@playwright/test` is an optional peer that only this entry needs. `docs/usage.md` describes it in section 12. Nothing that exists changes.

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
