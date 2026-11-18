---
'@whatsaaaa/design-system': patch
---

The input spec keeps a field's value and icons in their place when its edge widens in an error. Its padding rows were written for rest and so held a field with an error too, whose edge is `control.border-width.invalid`, 2 px, against 1 px at rest: a field whose value did not move measured 1 px less and failed at every size. The spec now has `invalid` rows for `padding-inline-start` and `padding-inline-end` at each size, with an icon on that side and without one, each the padding at rest less the extra edge, `control.border-width.invalid` less `control.border-width.rest` (11 px at md, 35 px past an icon), and a note that says so.

An implementation's gallery shows, at every size, a field at rest and a field with an error each with its icons and without them, since the rows at rest no longer hold a field with an error. The style guide shows such a padding by its total and names what it takes away.
