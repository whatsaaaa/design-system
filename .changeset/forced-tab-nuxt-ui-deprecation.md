---
'@whatsaaaa/design-system': patch
---

The current tab keeps its mark in forced colors, such as a Windows contrast theme. The browser dropped the bar over it, a shadow, and drew the edges every tab keeps for the current one on all of them, so the current tab looked like the others. In the tab bar of the terminal frame and in the docs theme it now has its bar and its number in the system's color of a selection and its edges in the text color, and the other tabs have no edges. Out of forced colors nothing changes. A page with the tab bar or a site on the docs theme takes this with no change of its own.

`css/nuxt-ui.css` is deprecated and is removed in 0.9.0. It stays in 0.8.3 as it was. An app on Nuxt UI gets it from ui-vue, which `@whatsaaaa/ui-vue/index.css` brings. An app that imports `@whatsaaaa/design-system/css/nuxt-ui.css` directly copies the file from 0.8.3 into its own stylesheets and imports that copy in its place.
