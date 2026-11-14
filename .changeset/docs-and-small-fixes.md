---
'@whatsaaaa/design-system': patch
---

Docs corrections and small fixes the first apps and the website ran into.

- **The markup is in the stylesheets you install.** The comments between the rules, with the markup of each piece, now come along into `dist/css/*.css` and `dist/index.css`, where the usage guide says they are. They were stripped before.
- **Errors and brand.** The usage guide says an error uses the danger tokens, `--ws-color-danger` for a field's border and icon and `--ws-color-danger-text` for its message, and not brand. Brand marks where you are, such as the current tab, and what you press uses the interactive color.
- **The tabs are optional**, and `ws-crumb`, the path above a page title, is in the usage guide. Assistive technology now reads its parts as words of their own, with a comma in place of each slash, where it ran them into one word before.
- **Vite.** The usage guide shows a plugin that inlines the head scripts from the package, as a bundler does not copy a plain script out of `node_modules`.
- **Before you finish** says to measure the terminal window and its bars too, which hide what overflows them, and not only the page.
- **A state lines up with the text beside it.** `ws-state` takes its baseline from its word, not from its dot, which put it half a pixel low.
- **A prompt that wraps keeps its chevron on its first line**, where it sat between the lines before.
- **The numbers of the tabs show only while their keys work**: not without JavaScript, and not before the shortcuts module runs. The head script marks the page `data-ws-keys="pending"` until then, so the numbers keep their place unseen and the labels of the tabs do not move when they show. The docs theme does the same.
- **The focus ring's radius gives way.** `base.css` rounds a focused element's corners with no weight, so a radius of the page's own, such as a round radio button's, wins wherever it is written.

A project on an earlier version writes nothing new, but it has to load the head script of the keys from the package: `shortcuts/init.js`, or `keysInitScript` inlined, as with the Vite plugin. A page with no head script, or with a copy of an earlier one, draws the numbers of the tabs only once the shortcuts module runs, and the labels of the tabs move then.

What it can drop, as in `docs/usage.md`:

- A rule that sets `align-items: baseline` on `ws-state`, or `align-items: flex-start` and a margin on the chevron of `ws-prompt`.
- A rule that only restates its own `border-radius` on `:focus-visible` to win over `base.css`.
- Its own copy of the stylesheets' markup, which is now in `dist/`.
