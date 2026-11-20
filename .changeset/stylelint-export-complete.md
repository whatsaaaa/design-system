---
'@whatsaaaa/design-system': minor
---

The stylelint config rejects a `color()` literal, such as `color(srgb ...)` or `color(display-p3 ...)`, as it does the other color functions. `color-mix()` still passes. It now knows the `--ws-icon-*` variables of `css/icons.css` next to the tokens, so a project that extends `@whatsaaaa/design-system/stylelint` names no file of the package in its own config. `docs/usage.md` says what a project on Tailwind CSS adds for Tailwind's at-rules and functions.
