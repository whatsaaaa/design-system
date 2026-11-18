---
outline: [2, 3]
---

# Modal

<SpecStatus of="modal" />

## Use it for

<SpecList of="modal" list="use" />

Not for:

<SpecList of="modal" list="notFor" />

## Anatomy

Each part's name is its `data-slot` in an implementation, or the slot it maps to under [Implementations](#implementations).

<SpecTerms of="modal" list="parts" />

The icons it draws itself are Lucide's, by name:

<SpecTerms of="modal" list="icons" />

## Variants

<SpecTerms of="modal" list="variants" />

## Sizes

<SpecTerms of="modal" list="sizes" />

## States

<SpecTerms of="modal" list="states" />

What each part takes in each state. A state lists what it changes from rest, and a row of every kind holds for each of them. A token is named by its id, which reads as its variable: `overlay.window.radius` is `--ws-overlay-window-radius`. Under a component token is the token it aliases, and its value is shown in the dark theme, then the light one.

<SpecStates of="modal" />

## Keyboard and assistive technology

<SpecKeyboard of="modal" />

<SpecList of="modal" list="aria" />

## Forced colors and motion

In forced colors:

<SpecList of="modal" list="forcedColors" />

In motion:

<SpecList of="modal" list="motion" />

## Content

<SpecList of="modal" list="content" />

## Contrast

The pairs of the colors the states name, measured as WCAG 2 contrast in both themes and rounded down. A disabled state is exempt.

<ContrastTable of="modal" />

## Implementations

<SpecImplementations of="modal" />

## Gallery contract

Every implementation's gallery shows these examples, each marked with its id in `data-spec`, and its parity test checks each against the state table. An id without a size is at the default size.

<SpecGallery of="modal" />

## Notes

<SpecList of="modal" list="notes" />
