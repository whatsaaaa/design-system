---
outline: [2, 3]
---

# Badge

<SpecStatus of="badge" />

## Use it for

<SpecList of="badge" list="use" />

Not for:

<SpecList of="badge" list="notFor" />

## Anatomy

Each part's name is its `data-slot` in an implementation, or the slot the implementation's own map of parts gives it, which it passes to [the parity helper](/docs/usage#_12-components-specs-and-the-tier).

<SpecTerms of="badge" list="parts" />

## Variants

<SpecTerms of="badge" list="variants" />

## Sizes

<SpecTerms of="badge" list="sizes" />

<SpecSizes of="badge" />

## States

<SpecTerms of="badge" list="states" />

What each part takes, at every size, and a row of every kind holds for each of them. A token is named by its id, which reads as its variable: `tag.primary.bg.rest` is `--ws-tag-primary-bg-rest`. Under a component token is the token it aliases, and its value is shown in the dark theme, then the light one.

<SpecStates of="badge" />

## Keyboard and assistive technology

A badge takes no focus and has no keys.

<SpecList of="badge" list="aria" />

## Forced colors and motion

In forced colors:

<SpecList of="badge" list="forcedColors" />

In motion:

<SpecList of="badge" list="motion" />

## Content

<SpecList of="badge" list="content" />

## Contrast

The pairs of the colors the kinds name, measured as WCAG 2 contrast in both themes and rounded down.

<ContrastTable of="badge" />

## Gallery contract

Every implementation's gallery shows these examples, each marked with its id in `data-spec`, and its parity test checks each against the state table. An id without a size is at the default size.

<SpecGallery of="badge" />

## Notes

<SpecList of="badge" list="notes" />
