---
'@whatsaaaa/design-system': minor
---

Three more component specs, all drafts: `select`, `select-menu` and `modal`, each with its page in the style guide. A select and a select menu are a field, as the input's, in Nuxt UI's five sizes, whose list opens on a panel; a select menu's list has a search at its top. A modal is a window over the page dimmed in its own color, with a header bar as tall as the tab bar, a body and a footer of actions. Their implementations record what ui-vue draws today and where it does not meet them yet.

The component tier has a fourth group, `overlay`, for what a select's list and a modal's window share: `--ws-overlay-bg`, the edge `--ws-overlay-border` and `--ws-overlay-border-width`, and for each the radius and the padding, `--ws-overlay-list-radius`, `--ws-overlay-list-padding`, `--ws-overlay-window-radius` and `--ws-overlay-window-padding`. The edge is the field border, which reads at 3:1 on the panel and on the page. An overlay has no shadow, as nothing in the system does, and its specs say `box-shadow: none`.

A spec row can set `padding-block`, `min-height`, `max-width`, `box-shadow`, `text-transform` and the line under a part, `border-block-end-style`, `-width` and `-color`, and the `testing` helper compares `border-block-end-color` as a color. The `open` state's examples draw their list or window in place, inside the example.
