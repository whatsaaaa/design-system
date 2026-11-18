---
outline: [2, 3]
---

# Tabs

<SpecStatus of="tabs" />

## Use it for

<SpecList of="tabs" list="use" />

Not for:

<SpecList of="tabs" list="notFor" />

## Anatomy

Each part's name is its `data-slot` in an implementation, or the slot it maps to under [Implementations](#implementations).

<SpecTerms of="tabs" list="parts" />

## Variants

<SpecTerms of="tabs" list="variants" />

## Sizes

<SpecTerms of="tabs" list="sizes" />

<SpecSizes of="tabs" />

## States

<SpecTerms of="tabs" list="states" />

What each part takes in each state, at every size. A state lists what it changes from rest, and a row of every kind holds for each of them. A token is named by its id, which reads as its variable: `control.height.md` is `--ws-control-height-md`. Under a component token is the token it aliases, and its value is shown in the dark theme, then the light one.

<SpecStates of="tabs" />

## Keyboard and assistive technology

<SpecKeyboard of="tabs" />

<SpecList of="tabs" list="aria" />

## Forced colors and motion

In forced colors:

<SpecList of="tabs" list="forcedColors" />

In motion:

<SpecList of="tabs" list="motion" />

## Content

<SpecList of="tabs" list="content" />

## Contrast

The pairs of the colors the states name, measured as WCAG 2 contrast in both themes and rounded down. A disabled state is exempt.

<ContrastTable of="tabs" />

## Implementations

<SpecImplementations of="tabs" />

## Gallery contract

Every implementation's gallery shows these examples, each marked with its id in `data-spec`, and its parity test checks each against the state table. An id without a size is at the default size.

<SpecGallery of="tabs" />

## Notes

<SpecList of="tabs" list="notes" />
