---
outline: [2, 3]
---

# Select menu

<SpecStatus of="select-menu" />

## Use it for

<SpecList of="select-menu" list="use" />

Not for:

<SpecList of="select-menu" list="notFor" />

## Anatomy

Each part's name is its `data-slot` in an implementation, or the slot the implementation's own map of parts gives it, which it passes to [the parity helper](/docs/usage#_12-components-specs-and-the-tier).

<SpecTerms of="select-menu" list="parts" />

The icons it draws itself are Lucide's, by name:

<SpecTerms of="select-menu" list="icons" />

## Variants

<SpecTerms of="select-menu" list="variants" />

## Sizes

<SpecTerms of="select-menu" list="sizes" />

<SpecSizes of="select-menu" />

## States

<SpecTerms of="select-menu" list="states" />

What each part takes in each state, at every size. A state lists what it changes from rest, and a row of every kind holds for each of them. A token is named by its id, which reads as its variable: `overlay.list.radius` is `--ws-overlay-list-radius`. Under a component token is the token it aliases, and its value is shown in the dark theme, then the light one.

<SpecStates of="select-menu" />

## Keyboard and assistive technology

<SpecKeyboard of="select-menu" />

<SpecList of="select-menu" list="aria" />

## Forced colors and motion

In forced colors:

<SpecList of="select-menu" list="forcedColors" />

In motion:

<SpecList of="select-menu" list="motion" />

## Content

<SpecList of="select-menu" list="content" />

## Contrast

The pairs of the colors the states name, measured as WCAG 2 contrast in both themes and rounded down. A disabled state is exempt.

<ContrastTable of="select-menu" />

## Gallery contract

Every implementation's gallery shows these examples, each marked with its id in `data-spec`, and its parity test checks each against the state table. An id without a size is at the default size.

<SpecGallery of="select-menu" />

## Notes

<SpecList of="select-menu" list="notes" />
