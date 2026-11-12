# The ghost

The mark of the handle: a 16 x 16 sprite of a ghost with a w-shaped mouth and its tongue out, standing on two points.

It is original artwork, drawn pixel by pixel in [`src/identity/ghost.ts`](https://github.com/whatsaaaa/design-system/blob/main/src/identity/ghost.ts). Every file on this page is generated from that one drawing.

## Sizes

The mark is a sprite, so it is sharp where one sprite pixel is a whole number of screen pixels: at 16, 32, 48, 64 px and their multiples. At 16 px the eyes are 2 x 2 px and the tongue is 2 px wide. It still reads as a pale face with a pink dot under it.

<MarkSizes identity="whatsaaaa" />

## Cuts

On its dark tile the mark looks the same in both themes, which is what a favicon and an avatar need. In a header or in running text the ghost stands free and takes the colors of the theme. In one color the tongue cannot change color, so it becomes a hole.

<Kit identity="whatsaaaa" match="^mark" />

## The name

The wordmark is the handle in JetBrains Mono at weight 800, set tight. The ghost does not say "W", so wherever the mark could be mistaken, the name goes with it.

<Kit identity="whatsaaaa" match="^(wordmark|lockup)" />

## Poses

Six poses of the same sprite. Only the face changes: the outline stays, so a pose can replace another without anything around it moving.

<Poses />

<Kit identity="whatsaaaa" match="^pose-.*-dark" />

Each pose also comes for light backgrounds, as `pose-<name>-light.svg`.

## The easter egg

Press the ghost three times in a row and it shouts the handle in a speech bubble. Every further press holds the a for one letter longer. The first two presses only wag the tongue, and the ghost calms down again after a moment.

<GhostDemo :px="8" />

- It is a real button, so <kbd>Enter</kbd> and <kbd>Space</kbd> press it.
- The shout is announced once to screen readers, when it starts.
- With reduced motion the bubble appears without its pop and the tongue does not wag.
- The bubble shows above everything, moves below the ghost when there is no room above, and stops growing at the edge of the window.

This is the shout, held open:

<GhostDemo :px="6" :shout="6" />

The ghost at the right end of the tab bar on this site is the same element.

### In a page

The element is `<ws-ghost>`. Load its styles and register it once:

```html
<link rel="stylesheet" href="@whatsaaaa/design-system/index.css" />
<script type="module">
  import { defineGhost } from '@whatsaaaa/design-system/ghost'
  defineGhost()
</script>

<ws-ghost px="6"></ws-ghost>
```

| Attribute   | What it does                                               | Default                                  |
| ----------- | ---------------------------------------------------------- | ---------------------------------------- |
| `px`        | Size of one sprite pixel, in CSS pixels. Use whole numbers | `2`                                      |
| `bubble-px` | Size of one pixel of the bubble                            | `2`, or `3` for a ghost of 4 px and more |
| `bubble`    | `above` or `below`, to fix the side the bubble takes       | above when it fits                       |
| `label`     | What a screen reader calls the button                      | "The whatsaaaa ghost"                    |
| `shout`     | A number of a's. The ghost shouts at once and holds it     | not set                                  |

To have the ghost in the page before any script runs, render its inside on the server with `ghostMarkup()`. For a ghost that is only a picture or a link, use `ghostSvg()`.

```ts
import { ghostMarkup, ghostSvg } from '@whatsaaaa/design-system/ghost'

const egg = `<ws-ghost px="6">${ghostMarkup({ px: 6 })}</ws-ghost>`
const home = `<a href="https://whatsaaaa.github.io/" aria-label="A whatsaaaa project">${ghostSvg()}</a>`
```

## Rules

The ghost lives among other ghosts. Three habits keep it its own:

- **The tongue is always there and always in the love color.** The one exception is the `lost` pose, which has its mouth shut.
- **The body is never recolored.** It is the text color of the theme, or the pale text color on the tile. Not red, pink, cyan or orange.
- **Nothing goes on its face or its tile.** No prompt, no letter, no badge.

And three more for drawing it:

- Draw it on whole pixels. Do not rotate it, stretch it or smooth it.
- Do not redraw it by hand. Take a file from the kit or the element.
- As a favicon it keeps its tile. A pale body would vanish on a light tab strip.

::: info Before public use
Whether to run a trademark search for the ghost before it is used in public is an open question for the owner. This guide does not settle it.
:::
