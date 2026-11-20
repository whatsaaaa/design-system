---
'@whatsaaaa/design-system': minor
---

The five tints, `color.tag-bg`, `color.tip-tint`, `color.note-tint`, `color.warning-tint` and `color.danger-tint`, are opaque in both themes: each is the color its hue made on the page at its strength, 12% or 10% for the tag and 9% for a status. On the page nothing changes. A tag, a callout or the danger button's hover fill now reads the same on every ground: a tag in a chosen table row read as low as 2.48:1 in dark and 3.89:1 in light, and now reads 4.87:1 or more everywhere. On a panel a tint is a touch darker than before in dark. Text on a tint is `color.text`, never secondary text: `docs/usage.md` says so, `tokens/contrast.json` checks `color.text` on `color.tag-bg`, and the checkbox and radio group specs say the description of a checked card takes the text color. The contrast check fails a pair whose background is translucent unless it names the color it lies `over`.
