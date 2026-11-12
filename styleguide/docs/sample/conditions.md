# Conditions

The affects package adds conditions to definitions: a field, a section or a step shows, hides, or hides and clears its value, by the values of other fields. A hidden field isn't validated, in every Formisch package and in a plain `v.parse`. Below you will learn how to write conditions and what they do.

::: info A sample page
This is adapted from the Conditions guide of [form-builder](https://github.com/whatsaaaa/form-builder), to show the docs theme with real documentation.
:::

## Adding the extension

Conditions come from [`@whatsaaaa/form-builder-affects`](https://github.com/whatsaaaa/form-builder), an extension of the schema builder. Give the builder the extension:

```ts [conditions.ts]
import { affects } from '@whatsaaaa/form-builder-affects'
import { createSchemaBuilder } from '@whatsaaaa/form-builder-schema'

const builder = createSchemaBuilder({ extensions: [affects()] })
```

Then write `affects` on the fields. Here, the VAT ID only shows, and is only required, for a business account:

```json [definition.json]
{
  "version": "1",
  "fields": [
    {
      "name": "accountType",
      "type": "radio",
      "required": true,
      "options": [
        { "value": "personal", "label": "Personal" },
        { "value": "business", "label": "Business" }
      ]
    },
    {
      "name": "vatId",
      "type": "text",
      "required": true,
      "affects": [
        {
          "effect": "hideAndClear",
          "when": { "field": "accountType", "notEquals": "business" }
        }
      ]
    }
  ]
}
```

```ts [conditions.ts]
const schema = builder.build(definition)

const personal = v.parse(schema, { accountType: 'personal' }) // { accountType: 'personal' }
const business = v.safeParse(schema, { accountType: 'business' }) // fails: vatId is required
```

::: warning
Without the extension, `affects` is an unknown key: `validate()` reports it, and `build()` throws. A definition never runs without its conditions by mistake.
:::

## Effects

`affects` is a list of effects, each with the condition that applies it:

| Effect         | While its condition is met                                |
| -------------- | --------------------------------------------------------- |
| `show`         | the field shows. Otherwise it is hidden, like with `hide` |
| `hide`         | the field is hidden, and keeps its value                  |
| `hideAndClear` | the field is hidden, and its value is cleared             |

- **Hide always wins.** A field is hidden when its `show` condition isn't met, or its `hide` or `hideAndClear` condition is. It is cleared only when its `hideAndClear` condition is met.
- **Each effect goes once on a field.** Join conditions with `all` or `any` instead. A field can have `show` together with `hide` or `hideAndClear`.

::: tip
Use `hideAndClear` for data that only makes sense while the field shows, and `hide` or `show` to keep what the user typed for when the field comes back.
:::

## Conditions

A condition tests one field, by its dot path, with exactly one operator. `all` and `any` join conditions, and nest to any depth:

```json [condition.json]
{
  "all": [
    { "field": "accountType", "equals": "business" },
    {
      "any": [
        { "field": "country", "in": ["RS", "ME"] },
        { "field": "vatId", "notEmpty": true }
      ]
    }
  ]
}
```

| Operator    | Value                       | True when the field                                       |
| ----------- | --------------------------- | --------------------------------------------------------- |
| `equals`    | a string, number or boolean | holds the value                                           |
| `notEquals` | a string, number or boolean | doesn't hold the value, or is empty                       |
| `in`        | a list of at least one      | holds one of the values                                   |
| `includes`  | a string, number or boolean | is a multiselect or a list of values, and holds the value |
| `empty`     | `true`                      | is empty                                                  |
| `notEmpty`  | `true`                      | isn't empty                                               |

Paths are those of form rules: `accountType`, `billing.zip`, or `lines.*.kind` for the field of the same item of `lines`, from a field, a section or a display element inside its items.
