---
'@whatsaaaa/design-system': minor
---

Two more component specs, both drafts: `textarea` and `number-field`, each with its page in the style guide. Both are built from the input spec: its edge, value, label, required mark, help and error, with the same tokens of the `control` and `field` groups, the same rows for every state and the same five sizes, and only the rows each needs of its own.

A text area is the input with rows of text in place of its one line and no height of its own: it is as tall as its rows. Its value is the field's text style at each size, `text.body` from md up, with that style's line height, and its padding above and below is half of what the control's height leaves around a line, less the edge, so its first line sits where an input's value does and a text area of one row is as tall as the input of its size. Its edge widens inward in an error on every side, so the text keeps its place. It has no icons and no loading state.

A number field is the input at the control's height with two step buttons inside its edge: decrement at the start, increment at the end, each holding its minus or plus icon where the input draws its icons, with the control's gap around it, so the value starts past it as past an icon. Its value is in figures of one width. The step buttons are kept: they are two real buttons with names, not the browser's spin buttons, which `base.css` still hides on every number field. They are not stops of the tab order, as the spin button pattern says; the field's arrow keys step it. Their icons take `field.icon.rest`, and `button.text.disabled` in a disabled field.

The input spec's text points to the two: text of more than one line is a text area, and a quantity that is stepped is a number field. Its parts, kinds, sizes, states, rows and gallery ids are unchanged. The usage guide and the forms page say that the browser's spin buttons are hidden and a number field's own two buttons are not those. No token is added.
