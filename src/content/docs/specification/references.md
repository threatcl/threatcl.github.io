---
title: Referring to Elements
---

Several attributes in a threat model refer to another element by name. A data flow's endpoints, an asset link, and a trust zone, for example. Names are free-form strings, so `threatcl` accepts three equivalent ways of writing each of those references.

References are checked when the file is parsed. An unknown or ambiguous reference is an error, not a silently broken link.

## Where references appear

| Attribute | Refers to |
| --- | --- |
| `flow`'s `from` and `to` | a `process`, `external_element` or `data_store` |
| `data_store`'s `information_asset` | an `information_asset` block |
| `threat`'s `information_asset_refs` | `information_asset` blocks |
| `trust_zone` on a `process`, `external_element` or `data_store` | a `trust_zone` block |

## By name

The original form: the element's label, exactly as declared.

```hcl
flow "request" {
  from = "Web App"
  to   = "User Database"
}
```

An exact name match always wins over any of the forms below.

## By slug

Anywhere a name is accepted, you can use the element's slug instead. Slugs are lowercase, with a divider inserted between words and at case boundaries. `"Web App"`, `"Web App!"` and `"WebApp"` all slugify to `web-app`.

Either divider works, so both of these resolve to `"Web App"`:

```hcl
from = "web-app"
from = "web_app"
```

This is the same slugification the OTM exporter uses for element ids. If a slug matches more than one element in the model, that's a validation error; rename one of them, or use the exact name.

References are rewritten to the canonical element name when the file is parsed, so renderers, exporters and round-tripped HCL always show the declared name regardless of which form you wrote.

## By dot notation

References can also be written as expressions rather than quoted strings:

```hcl
flow "request" {
  from = process.web_app
  to   = data_store.user_database
}

threat "Data theft" {
  description            = "..."
  information_asset_refs = [information_asset.customer_data]
}

process "Web App" {
  trust_zone = trust_zone.internal_zone
}
```

There's a namespace for each element type (`process`, `external_element`, `data_store`, `information_asset` and `trust_zone`) built from the labels declared in the same file. An unknown slug fails at parse time, so a typo surfaces immediately.

Dotted references use the **underscore** form of the slug. That's consistent with the [threatmodel id](/specification/threatmodel/#id) convention, and avoids the ambiguity between a hyphen and subtraction in a bare HCL expression.

For a slug that isn't a valid HCL identifier (one starting with a digit, say) use index syntax:

```hcl
from = process["3rd_party"]
```

## Trust zones

A `trust_zone` attribute that slug-matches a declared `trust_zone` block resolves to that block. Only a value matching no declared zone creates an implicit zone of its own.

```hcl
data_flow_diagram_v2 "dfd" {
  trust_zone "Internal Zone" {
    process "Web App" {}
  }

  # resolves to the "Internal Zone" block above, not a new zone
  data_store "User Database" {
    trust_zone = "internal-zone"
  }
}
```
