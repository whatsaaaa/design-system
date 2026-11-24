# Components

The system draws no components. It specifies them: each spec says what every implementation of a component has to draw alike, whatever its framework. ui-vue draws them on Nuxt UI, ui-react is to draw them on shadcn/ui with Radix, and an app may draw its own. Each keeps its own map of its library onto the spec, in its own repository, and proves in its own tests that it meets it.

<SpecIndex />

## A spec

A spec is data, `specs/<component>.spec.json` in the package, checked against `specs/spec.schema.json`. Its page here is drawn from that file, so the two cannot disagree. It names:

- what the component is for and what it is not for, its parts, its kinds, its sizes and its states;
- the state table: for each kind, state and part, the token each CSS property takes, or a value the system writes without a token, such as the focus ring's `3px` offset. A state lists what it changes from rest. This is the whole mapping an implementation's parity test reads;
- its keys, its accessibility rules, what it keeps in forced colors and with less motion, and how to write what it says;
- the gallery contract: the examples every implementation's gallery shows, each marked with its id in `data-spec`, such as `button.primary.hover`.

A spec holds nothing about one implementation. The slot that draws each part, the props of each kind and size, and where an implementation does not meet a spec yet are that implementation's own to record: it keeps them in its repository, next to its parity test, and passes its map of parts to [the parity helper](/docs/usage#_12-components-specs-and-the-tier).

The states are one closed list, the same one the names of the component tokens end in: `rest`, `hover`, `active`, `focus`, `disabled`, `checked`, `indeterminate`, `invalid`, `open`, `selected`, `current` and `loading`.

## The component tokens

A row of a state table names a semantic token where one says it all, such as the focus ring's `color.interactive`. Where every implementation has to make the same decision of its own, the row names a component token, an alias of a semantic one: the primary button's fill is `--ws-button-primary-bg-rest`, an alias of `--ws-color-interactive`. Implementations read them by name at runtime, so a value changed here reaches all of them with a release.

The tests hold the two together: every token a spec names exists and fits its property, every component token is read by some spec, and the colors of the component tokens are measured for contrast in both themes from their names. How to read them is in [the usage guide](/docs/usage#_12-components-specs-and-the-tier).

## Status

A draft spec can still change in any release, and its implementations follow it. A stable spec is held to the [versioning policy](https://github.com/whatsaaaa/design-system/blob/main/docs/versioning.md#draft-and-stable): removing or renaming one of its parts, kinds, sizes, states or gallery ids waits for the next major. The [changelog](https://github.com/whatsaaaa/design-system/blob/main/CHANGELOG.md) says which release changed a spec. Whether an implementation ships a component, and whether its parity test passes, is for that implementation to say.
