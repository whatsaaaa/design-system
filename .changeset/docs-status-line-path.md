---
'@whatsaaaa/design-system': patch
---

The path of the docs theme's status line gives way the way 0.8.1's does. The docs theme put the file in the status line without `ws-status-line__path`, so it never had the rules 0.8.1 added for it: on a docs site the path showed down to one character and then a bare ellipsis below about 242 px, and the status line reached past the window at 198 px and narrower. It is cut with an ellipsis down to five characters now and goes as a whole with less room, and the status line fits down to 180 px. From 320 px up it looks as it did. A site on the docs theme takes this with no change of its own.
