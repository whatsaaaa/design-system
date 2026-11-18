---
outline: [2, 3]
---

# Table

<SpecStatus of="table" />

## Use it for

<SpecList of="table" list="use" />

Not for:

<SpecList of="table" list="notFor" />

## Anatomy

Each part's name is its `data-slot` in an implementation, or the slot it maps to under [Implementations](#implementations).

<SpecTerms of="table" list="parts" />

## Variants

<SpecTerms of="table" list="variants" />

## Sizes

<SpecTerms of="table" list="sizes" />

## States

<SpecTerms of="table" list="states" />

What each part takes in each state. A state lists what it changes from rest, and a row of every kind holds for each of them. A token is named by its id, which reads as its variable: `table.row.bg.selected` is `--ws-table-row-bg-selected`. Under a component token is the token it aliases, and its value is shown in the dark theme, then the light one.

<SpecStates of="table" />

## Keyboard and assistive technology

<SpecKeyboard of="table" />

<SpecList of="table" list="aria" />

## Forced colors and motion

In forced colors:

<SpecList of="table" list="forcedColors" />

In motion:

<SpecList of="table" list="motion" />

## Content

<SpecList of="table" list="content" />

## Contrast

The pairs of the colors the states name, measured as WCAG 2 contrast in both themes and rounded down. A disabled state is exempt.

<ContrastTable of="table" />

## Implementations

<SpecImplementations of="table" />

## Gallery contract

Every implementation's gallery shows these examples, each marked with its id in `data-spec`, and its parity test checks each against the state table. An id without a size is at the default size.

<SpecGallery of="table" />

## Notes

<SpecList of="table" list="notes" />
