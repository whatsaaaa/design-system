---
'@whatsaaaa/design-system': minor
---

An app on Nuxt UI takes its colors from the roles with one import: `@whatsaaaa/design-system/css/nuxt-ui.css`, after Nuxt UI and the variants. It points Nuxt UI's `--ui-*` variables at the `--ws-color-*` roles, outside any layer so it wins over Nuxt UI's own, on `:root` and again on every element that chooses a theme with `data-theme` or a `dark` or `light` class, so both themes follow by themselves. The primary color is the interactive role, success, info, warning and error are tip, note, warning and danger, and the steps the system has no role for, such as the shades of each color, are mixed from the roles around them in oklab. It also sets `--ui-radius` to the small radius and `--ui-header-height` to the height of the tab bar.

It is not in `index.css` or `tailwind.css`, as it has to come after Nuxt UI. The usage guide shows the import order.

What an app on Nuxt UI drops: the `--ui-*` variables it pointed at the roles itself, as the usage guide asked before. Set one again after the import only to change it.
