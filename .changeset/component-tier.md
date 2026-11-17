---
'@whatsaaaa/design-system': minor
---

A component token tier: the names every implementation of a control reads alike, such as ui-vue on Nuxt UI or an app that draws its own fields. Its first two groups are `--ws-control-*`, the height, gap and icon size of a one-line control for each of Nuxt UI's five sizes, `xs` to `xl`, with its radius and border widths, and `--ws-field-*`, the colors of a text field, a select and a select menu and of every field's label, help, error and required mark. Each is an alias of a role or a measure, declared wherever a theme is chosen, so it follows a part of the page held in the other theme. They are in `tokens/components/`, in the resolver's new `components` set and in the token data, and not in Tailwind's theme: read them by name, as `h-(--ws-control-height-md)`. `docs/usage.md` describes them, and `docs/decisions.md` says why the tier is thin.

New semantic tokens for them: `--ws-color-brand-text`, the brand red as small text, love on dark and a darker love on light that reads at 4.5:1, for the required mark; `--ws-size-control-xs`, `-sm`, `-lg` and `-xl`, the heights of the other control sizes, 28, 32, 44 and 48 px; and `--ws-size-icon-lg`, 20 px, the icon of the two large sizes. In the Tailwind entry they are `text-brand-text`, `h-control-sm` and the like. Nothing that exists changes.
