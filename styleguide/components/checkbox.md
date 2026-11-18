---
outline: [2, 3]
---

# Checkbox

<SpecStatus of="checkbox" />

## Use it for

<SpecList of="checkbox" list="use" />

Not for:

<SpecList of="checkbox" list="notFor" />

## Anatomy

Each part's name is its `data-slot` in an implementation, or the slot it maps to under [Implementations](#implementations).

<SpecTerms of="checkbox" list="parts" />

The icons it draws itself are Lucide's, by name:

<SpecTerms of="checkbox" list="icons" />

## Variants

<SpecTerms of="checkbox" list="variants" />

## Sizes

<SpecTerms of="checkbox" list="sizes" />

<SpecSizes of="checkbox" />

## States

<SpecTerms of="checkbox" list="states" />

What each part takes in each state, at every size. A state lists what it changes from rest, and a row of every kind holds for each of them. A token is named by its id, which reads as its variable: `choice.control.border.hover` is `--ws-choice-control-border-hover`. Under a component token is the token it aliases, and its value is shown in the dark theme, then the light one.

<SpecStates of="checkbox" />

## Keyboard and assistive technology

<SpecKeyboard of="checkbox" />

<SpecList of="checkbox" list="aria" />

## Forced colors and motion

In forced colors:

<SpecList of="checkbox" list="forcedColors" />

In motion:

<SpecList of="checkbox" list="motion" />

## Content

<SpecList of="checkbox" list="content" />

## Contrast

The pairs of the colors the states name, measured as WCAG 2 contrast in both themes and rounded down. A disabled state is exempt.

<ContrastTable of="checkbox" />

## Implementations

<SpecImplementations of="checkbox" />

## Gallery contract

Every implementation's gallery shows these examples, each marked with its id in `data-spec`, and its parity test checks each against the state table. An id without a size is at the default size.

<SpecGallery of="checkbox" />

## Notes

<SpecList of="checkbox" list="notes" />
