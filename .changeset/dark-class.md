---
'@whatsaaaa/design-system': minor
---

A `dark` or `light` class chooses the theme as `data-theme` does, so an app built on Nuxt UI, Tailwind or VueUse's `useColorMode`, which switch dark mode with a class on `<html>`, needs no script to bridge the two.

- The tokens, `ws-theme-dark` and `ws-theme-light`, the status line's theme names and the head script that keeps `<meta name="theme-color">` in step all follow the class, on `<html>` or on any element around a part of the page.
- On one element `data-theme` wins over the class, and both classes together choose nothing. The nearest choice around an element holds, made either way, and any choice wins over the system's theme.
- `setTheme` and `toggleTheme` still write `data-theme`. `getTheme` and `getThemeChoice` read the class of `<html>` where there is no `data-theme`.

Upgrading: a `dark` or `light` class an app gives an element for something else now puts what is inside it in that theme. Rename it. An app whose color mode library owns the class switches the theme with the library and does not call `setTheme` or `toggleTheme`; it can drop its bridge script and keep the head script.
