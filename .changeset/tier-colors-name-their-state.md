---
'@whatsaaaa/design-system': minor
---

Every color of the component tier names its state, the select's separator is a border, and the status line's two older class names are gone. Each of the three breaks what reads the old name or draws the old way. This is the last 0.x release that breaks anything before 1.0.0, so no renamed variable keeps an alias.

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

`tests/tier.test.ts` holds the rule: a color of the tier ends in a state of the closed list, where it used to allow none, and the contrast pairs no longer read a color without a state as the color at rest. `docs/usage.md` and `docs/decisions.md` state the rule. The token descriptions of the control, choice and tag groups name no component library any more, and a test holds the tier to it.
