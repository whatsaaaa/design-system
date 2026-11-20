---
'@whatsaaaa/design-system': minor
---

A component spec holds nothing about one implementation any more, and no version of its own. This breaks whatever read either from a spec, and every parity test that named an implementation.

What breaks:

- **The spec format loses `implementations`.** The field, its place among the required ones and the two definitions only it used, `implementation` and `props`, are gone from `specs/spec.schema.json`, and the entry is gone from all eleven specs: the library and its version, the slot that draws each part, the props of each kind and size, the deviations and the result of the parity test. A spec with the field no longer validates. An implementation keeps what it records about itself in its own repository.
- **The spec format loses `changed`**, the version a spec last changed in, from the schema and from all eleven specs. It was written by hand before a release knew its version. This changelog is where a change to a spec is recorded.
- **The `testing` helper's `implementation` option is replaced by `parts`.** `expectSpec(page, name, { implementation: 'ui-vue' })` read the part map of that entry in the spec. Now the implementation passes its own map: `expectSpec(page, name, { parts: { root: 'base', required: 'label::after', 'leading-icon': 'base leadingIcon' } })`. A value is what the spec's map held: a slot, a slot and a pseudo-element of it, or a slot inside another, and a slot's name can now hold a hyphen, as a part's own name does. A part the map does not name is still the slot of its own name. New: a map that names a part the spec does not have, or draws a part as anything else, fails with an error that names it, such as `the button spec has no part rooot`, so a part an update of the spec renamed is not left unchecked. An option the helper does not have, such as `implementation`, is an error too, where it used to be left unread.
- **The types of `@whatsaaaa/design-system/testing` follow**: `Spec` has no `implementations` and no `changed`, and `SpecOptions` has `parts` in place of `implementation`.

`expectSpec`, `checkSpec`, `loadSpec` and `specNames` keep their names and signatures. No part, kind, size, state, row or gallery id of any spec changes.

To follow, an implementation moves each map out of the specs into a file next to its parity test and passes it as `parts`, and keeps its props, its deviations and its parity result in its own docs. The entries as they were stay readable in 0.14.0: `node -p "require('@whatsaaaa/design-system/specs/button.spec.json').implementations"` with that version installed.

A spec's notes name no component library and no implementation any more, the schema's description of a size neither, and a test holds both to it. In the style guide, a component's page loses its table of implementations, its "Implementations" section and its "Last changed in" line.
