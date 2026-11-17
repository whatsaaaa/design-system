---
outline: [2, 3]
---

# Input

<SpecStatus of="input" />

## Use it for

<SpecList of="input" list="use" />

Not for:

<SpecList of="input" list="notFor" />

## Anatomy

Each part's name is its `data-slot` in an implementation, or the slot it maps to under [Implementations](#implementations).

<SpecTerms of="input" list="parts" />

The icons it draws itself are Lucide's, by name:

<SpecTerms of="input" list="icons" />

## Variants

<SpecTerms of="input" list="variants" />

## Sizes

<SpecTerms of="input" list="sizes" />

<SpecSizes of="input" />

## States

<SpecTerms of="input" list="states" />

What each part takes in each state, at every size. A state lists what it changes from rest, and a row of every kind holds for each of them. A token is named by its id, which reads as its variable: `field.border.hover` is `--ws-field-border-hover`. Under a component token is the token it aliases, and its value is shown in the dark theme, then the light one.

<SpecStates of="input" />

## Keyboard and assistive technology

<SpecKeyboard of="input" />

<SpecList of="input" list="aria" />

## Forced colors and motion

In forced colors:

<SpecList of="input" list="forcedColors" />

In motion:

<SpecList of="input" list="motion" />

## Content

<SpecList of="input" list="content" />

## Contrast

The pairs of the colors the states name, measured as WCAG 2 contrast in both themes and rounded down. A disabled state is exempt.

<ContrastTable of="input" />

## Implementations

<SpecImplementations of="input" />

## Gallery contract

Every implementation's gallery shows these examples, each marked with its id in `data-spec`, and its parity test checks each against the state table. An id without a size is at the default size.

<SpecGallery of="input" />

## Notes

<SpecList of="input" list="notes" />
