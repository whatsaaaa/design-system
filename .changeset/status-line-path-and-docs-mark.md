---
'@whatsaaaa/design-system': patch
---

Two things the website, the form-builder docs, the sample apps and ui-vue found when they moved to 0.8.0.

- **The mark of a docs site.** The docs theme pulls the logo out by the two empty sprite columns on each side of a project's mark, 4 px at 32 px, as the usage guide tells a page to. Its pixels start where the page does on a phone, at 16 px, where they started at 20, and over the headings of the sidebar from 60rem up, where they started 4 px to the right of them. The brand's name moves 8 px to the left with it.
- **The path of the status line.** It is cut with an ellipsis down to five characters, `6ch`, and goes as a whole with less room, where it showed down to one character and the ellipsis. With the 10 px padding of 0.8.0 a 320 px phone showed `w…` or `~…` there. From 64rem up, between its 14 px padding, it keeps the same five.

A site on the docs theme and a page with `ws-status-line__path` take both with no change of their own. Drop a margin of your own on the docs theme's `.logo`.
