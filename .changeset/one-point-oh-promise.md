---
'@whatsaaaa/design-system': major
---

1.0.0 starts the promise of the [versioning policy](https://github.com/whatsaaaa/design-system/blob/main/docs/versioning.md): the public surface holds until the next major. It is every path of the `exports` map, what each module exports with its types, the name and meaning of every `--ws-*` variable, every `ws-` class with its documented markup and the attributes the styles and modules read, the Tailwind utility names, the token ids and the resolver's inputs, the spec format and every stable spec's name, parts, kinds, sizes, states and gallery ids, the testing helper's API, the lint config, and the Node and peer ranges. A minor may add to it, change a value on purpose, such as a color or a size, add or tighten a lint rule, deprecate what the next major removes, and turn a draft spec stable. A patch brings the output back to what the documents and the specs already say.

The 11 specs are stable, as ui-vue passes each of them: `button`, `input`, `checkbox`, `radio-group`, `select`, `select-menu`, `modal`, `badge`, `card`, `table` and `tabs`. From this release on they are held to the policy, and a new spec enters as a draft. Nothing is removed or renamed in this release: a project on 0.15.0 moves to it by its range, `^1.0.0`.
