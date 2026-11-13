# Space, radius and motion

## Space

Spacing sits on a 2 px grid. A token is named by its size in px at the default root size and is set in rem, so it scales with the reader's font size.

<Scale kind="space" />

## Radius

Corners are small. Nothing is a pill except a dot.

<Scale kind="radius" />

## Border width

Borders separate things. There are no shadows.

<Scale kind="borderWidth" />

## Sizes

The few fixed measures of a page.

<Scale kind="size" />

## Motion

Little moves. A hover or a focus changes at once or in 120 ms. Nothing slides in from far away.

<Scale kind="duration" />

<Scale kind="easing" />

Sprites move in steps, like sprites: the speech bubble of the ghost pops in four frames, `steps(4, end)`, not on a curve.

Everything that moves respects `prefers-reduced-motion`. With reduced motion, things appear in place.

## Breakpoint

There is one: `64rem`. Below it a page has one column, the tab bar wraps and headings take their compact sizes.

A custom property cannot be used in a media query, so write it out:

```css
@media (width < 64rem) {
  /* one column */
}
```
