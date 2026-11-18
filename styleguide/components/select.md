---
outline: [2, 3]
---

# Select

<SpecStatus of="select" />

## Use it for

<SpecList of="select" list="use" />

Not for:

<SpecList of="select" list="notFor" />

## Anatomy

Each part's name is its `data-slot` in an implementation, or the slot it maps to under [Implementations](#implementations).

<SpecTerms of="select" list="parts" />

The icons it draws itself are Lucide's, by name:

<SpecTerms of="select" list="icons" />

## Variants

<SpecTerms of="select" list="variants" />

## Sizes

<SpecTerms of="select" list="sizes" />

<SpecSizes of="select" />

## States

<SpecTerms of="select" list="states" />

What each part takes in each state, at every size. A state lists what it changes from rest, and a row of every kind holds for each of them. A token is named by its id, which reads as its variable: `overlay.list.radius` is `--ws-overlay-list-radius`. Under a component token is the token it aliases, and its value is shown in the dark theme, then the light one.

<SpecStates of="select" />

## Keyboard and assistive technology

<SpecKeyboard of="select" />

<SpecList of="select" list="aria" />

## Forced colors and motion

In forced colors:

<SpecList of="select" list="forcedColors" />

In motion:

<SpecList of="select" list="motion" />

## Content

<SpecList of="select" list="content" />

## Contrast

The pairs of the colors the states name, measured as WCAG 2 contrast in both themes and rounded down. A disabled state is exempt.

<ContrastTable of="select" />

## Implementations

<SpecImplementations of="select" />

## Gallery contract

Every implementation's gallery shows these examples, each marked with its id in `data-spec`, and its parity test checks each against the state table. An id without a size is at the default size.

<SpecGallery of="select" />

## Notes

<SpecList of="select" list="notes" />
