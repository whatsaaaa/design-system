---
'@whatsaaaa/design-system': minor
---

Component specs: what every implementation of a component draws alike, as data. `specs/<component>.spec.json`, in the package as `@whatsaaaa/design-system/specs/button.spec.json`, checked against `specs/spec.schema.json`, names a component's parts, kinds, sizes and states, its state table (for each kind, state and part, the token each CSS property takes), its keys and accessibility rules, how each implementation maps onto it and where it does not meet it yet, and the examples its gallery shows by `data-spec` id. The first two are drafts: `button`, in the kinds primary, secondary, ghost, quiet and danger, an outline in both themes, in the five sizes, and `input`, the field with its label, help and error. The style guide has a page for each, drawn from its file, in a components section next to the styles, and `docs/usage.md` explains specs and the tier in section 12.

The component tier gains the `button` group, the colors of each kind in each state: `--ws-button-<kind>-<bg|border|text>-<state>`, such as `--ws-button-primary-bg-hover`, and `--ws-button-text-disabled` and `--ws-button-border-disabled`. Nothing that exists changes.
