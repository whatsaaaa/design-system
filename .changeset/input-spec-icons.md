---
'@whatsaaaa/design-system': minor
---

A row of a component spec can hold only where an example draws a part, `"with": "leading-icon"`, or only where it does not, `"without": "leading-icon"`, and a value can read tokens by their variables, as in `calc(var(--ws-space-12) + var(--ws-control-icon-size-md) + var(--ws-control-gap-md))`. The `testing` helper holds each example only to the rows whose condition it meets, and its coverage check asks that some example meet each one. The rows can also set `padding-inline-start` and `padding-inline-end`.

The input spec uses them: its root `padding-inline` rows, which an input with an icon could never meet, are now `padding-inline-start` and `padding-inline-end` at each size, the field's padding without an icon on that side and the padding, the control's icon size and its gap with one (36 px at md). Its gallery contract adds `input.outline.invalid.xs`, `.sm`, `.lg` and `.xl`, so the error's size is checked at every size. An implementation's gallery shows those four examples, and at every size an example with each icon and one without it.
