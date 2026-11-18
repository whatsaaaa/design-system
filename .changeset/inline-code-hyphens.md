---
'@whatsaaaa/design-system': patch
---

Inline code no longer breaks at its hyphens. A browser breaks code after any hyphen at the end of a line, so `--ws-field-*` read as `-` and `-ws-field-*`, and `@whatsaaaa/design-system/specs/button.spec.json` broke after `design-`. The docs theme's Markdown setup now holds each run of hyphens in inline code to the characters on both sides of it, in a `<span class="ws-code-joined">` that the prose styles keep on one line, and puts a `<wbr>` after the slashes of a path, so a path breaks there. Code too long for a line still breaks, elsewhere in it, and copies as it is. Inside a table cell, where code stays in one piece, a `<wbr>` has no box.
