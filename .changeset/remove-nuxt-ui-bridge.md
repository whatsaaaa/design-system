---
'@whatsaaaa/design-system': minor
---

Remove `css/nuxt-ui.css`, deprecated in 0.8.3. ui-vue now ships the stylesheet that points Nuxt UI's colors at the roles. An app on Nuxt UI imports `@whatsaaaa/ui-vue/index.css`, which brings it; an app that imported `@whatsaaaa/design-system/css/nuxt-ui.css` directly copies the file from 0.8.3 into its own stylesheets or moves to ui-vue.
