---
'@whatsaaaa/design-system': patch
---

The docs theme's theme switch, menu button and search button keep showing in forced colors, such as a Windows contrast theme. The browser paints every fill in the page's color there, so the switch's sun and moon and the magnifier of the phone's search button, which are masks, the switch's knob, and the lines of the phone's menu button, which are fills, were gone. The theme switch was an empty box, its border all that was left of it, and the menu button and the phone's search button, which have no border, could not be seen at all. Each is now drawn in the system's color of a button's text, the knob as a ring, and the menu button's cross with its menu open too. On a wider screen the search button shows its word and its key, which forced colors kept, and it does not change. Out of forced colors nothing changes. A site on the docs theme takes this with no change of its own.
