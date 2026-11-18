---
'@whatsaaaa/design-system': minor
---

`@whatsaaaa/design-system/stylelint`, the token lint rules as a stylelint config, so a project extends it in place of keeping its own copy: a hex value, a named color or a color function is an error, and so is a variable that nothing defines, checked against the `tokens.css` of the version installed, the component tier included, wherever the linter runs. It extends `stylelint-config-standard`. `stylelint`, `stylelint-config-standard` and `stylelint-value-no-unknown-custom-properties` are optional peers that only this entry needs. `docs/usage.md` describes it in section 2. Nothing that exists changes.
