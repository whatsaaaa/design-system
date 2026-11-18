---
outline: [2, 3]
---

# Radio group

<SpecStatus of="radio-group" />

## Use it for

<SpecList of="radio-group" list="use" />

Not for:

<SpecList of="radio-group" list="notFor" />

## Anatomy

Each part's name is its `data-slot` in an implementation, or the slot it maps to under [Implementations](#implementations).

<SpecTerms of="radio-group" list="parts" />

The icons it draws itself are Lucide's, by name:

<SpecTerms of="radio-group" list="icons" />

## Variants

<SpecTerms of="radio-group" list="variants" />

## Sizes

<SpecTerms of="radio-group" list="sizes" />

<SpecSizes of="radio-group" />

## States

<SpecTerms of="radio-group" list="states" />

What each part takes in each state, at every size. A state lists what it changes from rest, and a row of every kind holds for each of them. A token is named by its id, which reads as its variable: `choice.control.border.hover` is `--ws-choice-control-border-hover`. Under a component token is the token it aliases, and its value is shown in the dark theme, then the light one.

<SpecStates of="radio-group" />

## Keyboard and assistive technology

<SpecKeyboard of="radio-group" />

<SpecList of="radio-group" list="aria" />

## Forced colors and motion

In forced colors:

<SpecList of="radio-group" list="forcedColors" />

In motion:

<SpecList of="radio-group" list="motion" />

## Content

<SpecList of="radio-group" list="content" />

## Contrast

The pairs of the colors the states name, measured as WCAG 2 contrast in both themes and rounded down. A disabled state is exempt.

<ContrastTable of="radio-group" />

## Implementations

<SpecImplementations of="radio-group" />

## Gallery contract

Every implementation's gallery shows these examples, each marked with its id in `data-spec`, and its parity test checks each against the state table. An id without a size is at the default size.

<SpecGallery of="radio-group" />

## Notes

<SpecList of="radio-group" list="notes" />
