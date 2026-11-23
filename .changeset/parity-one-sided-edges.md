---
'@whatsaaaa/design-system': minor
---

The parity helper's forced-colors check covers a line on one side. A part whose rows give it a border on one side only, such as `border-block-end-width`, keeps a border on that side in forced colors: a width more than none, a style other than none and a color other than the page's. That holds the separator of a select's and a select menu's list, the line under a tab list, the lines of a table's head and rows, and the lines of a card's and a modal's header and a card's body. Before, the check looked only at a border on every side and at an outline, so a line on one side that forced colors dropped, or drew as a fill in the page's color, passed. A failure names the example, the part and the side: `select.outline.open: separator loses its border-block-end in forced colors: border-block-end 0px none rgb(255, 255, 255)`.

What breaks: an implementation whose parity test passed can fail it now, where a line on one side is drawn as a fill, a box shadow or a pseudo-element in place of the part's border, or is taken away in forced colors. Draw it as the border the spec names. Nothing else in the release depends on it, so an implementation can take 0.15.0 first and meet this check after.

Each element an id marks is held to the edges of its own rows: a card with a footer and one without under one id are each checked for the line under the body that is theirs. The probe that reads the page's color in forced colors goes outside a table, as one among a table's rows left a table of collapsed borders drawn otherwise.
