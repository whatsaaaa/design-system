---
'@whatsaaaa/design-system': patch
---

The docs theme's theme switch and menu button keep showing in forced colors, such as a Windows contrast theme. The browser paints every fill in the page's color there, so the switch's sun and moon, which are masks, its knob, and the lines of the phone's menu button, which are fills, were gone, and both controls were empty boxes. Each is now drawn in the system's color of a button's text, the knob as a ring, and the menu button's cross with its menu open too. Out of forced colors nothing changes. A site on the docs theme takes this with no change of its own.
