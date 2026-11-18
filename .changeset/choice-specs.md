---
'@whatsaaaa/design-system': minor
---

Two more component specs, both drafts: `checkbox` and `radio-group`, in their list look and Nuxt UI's five sizes. In forced colors each keeps the edge of its box or circle, and a checked one its fill and its mark. The checkbox is checked, indeterminate or neither, with its label, description, required mark and error; the radio group is a legend over its options. Each has a page in the style guide, drawn from its file, and records what ui-vue draws today and where it does not meet the spec yet, such as a disabled checked box in the interactive fill.

The component tier gains the `choice` group, what the two share: `--ws-choice-control-size-<size>`, the side of the box or the circle at each size, 14 to 24 px; its color `--ws-choice-control-bg` and edge `--ws-choice-control-border-<rest|hover|invalid|disabled>`; the fill and the mark of a checked or an indeterminate one, `--ws-choice-indicator-<bg|icon>-<checked|indeterminate|disabled>`; and an option's label and description, `--ws-choice-label-text-<rest|disabled>` and `--ws-choice-description-text-<rest|disabled>`. New semantic sizes for it: `--ws-size-check-xs`, `-sm`, `-lg` and `-xl`, 14, 16, 22 and 24 px, and `--ws-size-tick-sm` and `-lg`, the tick of 12 and 18 px. The space page of the style guide lists them.

The `testing` helper compares an indeterminate example with its example at rest in forced colors too, and compares the two examples whole where the state draws a part the example at rest does not, such as a checked box's fill. Where an example has several elements of one slot, such as a group's options, it measures the first that draws the part. No existing token, style or spec changes.
