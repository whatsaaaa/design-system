---
'@whatsaaaa/design-system': minor
---

An app on Tailwind CSS v4, such as one on Nuxt UI, imports `@whatsaaaa/design-system/tailwind.css` in place of `tailwindcss` and `index.css`. It brings Tailwind and everything `index.css` brings in cascade layers, so a utility wins over a class of the system, and gives Tailwind the tokens as its theme: `bg-surface` and the other color roles in place of Tailwind's palette, `font-mono` and `font-sans`, the text styles as `text-h1` and the rest, the space as Tailwind's scale, the sizes by name as `h-tab-bar`, and the radii, border widths and easings. A utility reads its token where it is used, so it follows the theme as the token does. The token build writes the theme, so a token added to a group comes through on its own.

- `dark:` and `light:` follow the theme as the tokens do: the nearest `data-theme` or `dark` or `light` class, on `<html>` or on any element around a part of the page, then the system. A library that defines its own after the entry, as Nuxt UI does, replaces them: import `@whatsaaaa/design-system/tailwind/variants.css` again after it.
- `tailwindcss` 4.3.5 or a later 4.x is an optional peer dependency: only the Tailwind entry needs it.
- Tailwind's defaults that no token stands behind are taken out on the entry, in the app and in a library imported after it: the palette, white and black included, the shadows, `font-serif`, and the weights and radii with no token. As classes they compile to nothing, and in `@apply` they fail the build.

The usage guide shows the import order, which utility reads which token, and what to use in place of the defaults taken out.
