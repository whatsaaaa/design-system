---
outline: [2, 3]
---

# Card

<SpecStatus of="card" />

## Use it for

<SpecList of="card" list="use" />

Not for:

<SpecList of="card" list="notFor" />

## Anatomy

Each part's name is its `data-slot` in an implementation, or the slot it maps to under [Implementations](#implementations).

<SpecTerms of="card" list="parts" />

## Variants

<SpecTerms of="card" list="variants" />

## Sizes

<SpecTerms of="card" list="sizes" />

## States

<SpecTerms of="card" list="states" />

What each part takes. A card names no component token: each row names a role or a measure of the system, by its id, which reads as its variable: `color.surface` is `--ws-color-surface`. Its value is shown in the dark theme, then the light one.

<SpecStates of="card" />

## Keyboard and assistive technology

A card takes no focus and has no keys: what is in it has its own.

<SpecList of="card" list="aria" />

## Forced colors and motion

In forced colors:

<SpecList of="card" list="forcedColors" />

In motion:

<SpecList of="card" list="motion" />

## Content

<SpecList of="card" list="content" />

## Contrast

The pairs of the colors the parts name, measured as WCAG 2 contrast in both themes and rounded down.

<ContrastTable of="card" />

## Implementations

<SpecImplementations of="card" />

## Gallery contract

Every implementation's gallery shows these examples, each marked with its id in `data-spec`, and its parity test checks each against the state table. An id without a size is at the default size.

<SpecGallery of="card" />

## Notes

<SpecList of="card" list="notes" />
