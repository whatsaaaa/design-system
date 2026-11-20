---
outline: [2, 3]
---

# Button

<SpecStatus of="button" />

## Use it for

<SpecList of="button" list="use" />

Not for:

<SpecList of="button" list="notFor" />

## Anatomy

Each part's name is its `data-slot` in an implementation, or the slot the implementation's own map of parts gives it, which it passes to [the parity helper](/docs/usage#_12-components-specs-and-the-tier).

<SpecTerms of="button" list="parts" />

The icons it draws itself are Lucide's, by name:

<SpecTerms of="button" list="icons" />

## Variants

<SpecTerms of="button" list="variants" />

## Sizes

<SpecTerms of="button" list="sizes" />

<SpecSizes of="button" />

## States

<SpecTerms of="button" list="states" />

What each part takes in each state, at every size. A state lists what it changes from rest, and a row of every kind holds for each of them. A token is named by its id, which reads as its variable: `button.primary.bg.rest` is `--ws-button-primary-bg-rest`. Under a component token is the token it aliases, and its value is shown in the dark theme, then the light one.

<SpecStates of="button" />

## Keyboard and assistive technology

<SpecKeyboard of="button" />

<SpecList of="button" list="aria" />

## Forced colors and motion

In forced colors:

<SpecList of="button" list="forcedColors" />

In motion:

<SpecList of="button" list="motion" />

## Content

<SpecList of="button" list="content" />

## Contrast

The pairs of the colors the states name, measured as WCAG 2 contrast in both themes and rounded down. A disabled state is exempt.

<ContrastTable of="button" />

## Gallery contract

Every implementation's gallery shows these examples, each marked with its id in `data-spec`, and its parity test checks each against the state table. An id without a size is at the default size.

<SpecGallery of="button" />

## Notes

<SpecList of="button" list="notes" />
