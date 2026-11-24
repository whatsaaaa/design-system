---
'@whatsaaaa/design-system': patch
---

The docs theme's 404 page and status line name a page that is not there by its path inside the site, as they name every other page. On a site served from a base, such as the style guide on GitHub Pages under `/design-system/`, they named it with the base in front: the 404 page read `cat /design-system/nope` and the status line `design-system/nope.md` for `/design-system/nope`. They now read `cat /nope` and `nope.md`. A site served from the root of its host shows the same as before. A site on the docs theme takes this with no change of its own.
