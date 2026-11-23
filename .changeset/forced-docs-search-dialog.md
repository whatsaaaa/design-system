---
'@whatsaaaa/design-system': patch
---

The icons of the docs theme's search dialog keep showing in forced colors, such as a Windows contrast theme. They are masks, whose fill the browser paints in the page's color there, so the back button on a phone, the layout toggle and the reset button, which are their icon alone, could not be seen at all, and the magnifier of the field, the chevrons between the titles of a result and the arrows of the keys under the results were gone. Each is now drawn in the system's color of its text: a button's, a link's for a result's chevrons, and the page's. The reset button, disabled while the field is empty, is drawn as the system draws disabled text. Out of forced colors nothing changes. A site on the docs theme takes this with no change of its own.
