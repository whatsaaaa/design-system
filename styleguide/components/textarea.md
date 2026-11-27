---
outline: [2, 3]
---

# Text area

<SpecStatus of="textarea" />

## Use it for

<SpecList of="textarea" list="use" />

Not for:

<SpecList of="textarea" list="notFor" />

## Anatomy

Each part's name is its `data-slot` in an implementation, or the slot the implementation's own map of parts gives it, which it passes to [the parity helper](/docs/usage#_12-components-specs-and-the-tier).

<SpecTerms of="textarea" list="parts" />

The icons it draws itself are Lucide's, by name:

<SpecTerms of="textarea" list="icons" />

## Variants

<SpecTerms of="textarea" list="variants" />

## Sizes

<SpecTerms of="textarea" list="sizes" />

<SpecSizes of="textarea" />

## States

<SpecTerms of="textarea" list="states" />

What each part takes in each state, at every size. A state lists what it changes from rest, and a row of every kind holds for each of them. A token is named by its id, which reads as its variable: `field.border.hover` is `--ws-field-border-hover`. Under a component token is the token it aliases, and its value is shown in the dark theme, then the light one.

<SpecStates of="textarea" />

## Keyboard and assistive technology

<SpecKeyboard of="textarea" />

<SpecList of="textarea" list="aria" />

## Forced colors and motion

In forced colors:

<SpecList of="textarea" list="forcedColors" />

In motion:

<SpecList of="textarea" list="motion" />

## Content

<SpecList of="textarea" list="content" />

## Contrast

The pairs of the colors the states name, measured as WCAG 2 contrast in both themes and rounded down. A disabled state is exempt.

<ContrastTable of="textarea" />

## Gallery contract

Every implementation's gallery shows these examples, each marked with its id in `data-spec`, and its parity test checks each against the state table. An id without a size is at the default size.

<SpecGallery of="textarea" />

## Notes

<SpecList of="textarea" list="notes" />
