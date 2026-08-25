---
title: Multiple Files
---

A threat model rarely lives alone. `threatcl` gives you three ways to spread one across several files, and they solve different problems:

- **[extends](/specification/threatmodel/#extends)**: a model inherits another model's content by [id](/specification/threatmodel/#id), within the set of files being parsed together.
- **[including](/specification/threatmodel/#including)**: a model uses a single other model file as its base.
- **[imports](/specification/threatmodel/#imports)**: a model pulls in centrally defined `component` blocks, currently controls.

This page covers the first, and the set-parsing rules that make it work.

## Files are parsed as a set

When you hand `threatcl` more than one file, a glob, a directory, several arguments, every `.hcl` file is parsed together as one set:

```bash title="terminal"
$ threatcl validate ./models/*.hcl
Validated 2 threatmodels in 2 files
```

This applies to `validate`, `list`, `view`, `dfd`, `mermaid`, `export` and `dashboard`. JSON threat models are parsed individually, and keep their own behaviour.

Because the files are parsed together, a threat model in one file can `extends` a model declared in another:

```hcl title="models/platform.hcl"
spec_version = "0.8.0"

threatmodel "Platform" {
  id     = "platform"
  author = "@xntrik"

  threat "Credential stuffing" {
    description = "Attackers replay leaked credentials"
  }
}
```

```hcl title="models/payments.hcl"
spec_version = "0.8.0"

threatmodel "Payments" {
  id      = "platform.payments"
  extends = "platform"
  author  = "@xntrik"
}
```

`Payments` inherits the parent's threats, information assets, use cases, exclusions, third party dependencies and `attributes` block. Anything it declares itself wins over what it inherits, and scalars, data flow diagrams and mermaid diagrams are never inherited.

### Names and ids must be unique across the set

Since every file is parsed together, two models in different files can no longer share a name. A collision fails the parse and names the files involved:

```
Each threat model must have a unique name and id when files are parsed together as a set.
Duplicates found:
  - name "Platform" in: models/platform.hcl, models/platform-copy.hcl
  - id "platform" in: models/platform.hcl, models/platform-copy.hcl
```

This is a behaviour change from earlier versions, where each file was parsed on its own and the same name could appear in several of them.

## Namespaced ids

An [id](/specification/threatmodel/#id) may be dot-separated, which places a model in a hierarchy:

```hcl
id = "buildings"              # the parent
id = "buildings.tower"        # nested beneath it
id = "buildings.bridge"
id = "infra.network.vpc"      # namespaces don't need a model of their own
```

A model may sit at a namespace itself. `buildings` above is both a model and the parent of `buildings.tower`. Its children then sit alongside its own fields in any reference tree, which is where the one real constraint comes from: **a segment directly beneath a parent model's id can't be one of that model's field names**. `buildings.threats` would shadow the threats of the model with id `buildings`, so it's rejected.

The reserved segments are the threat model's own attribute and block names, in singular and plural form: `name`, `id`, `extends`, `description`, `imports`, `including`, `link`, `diagram_link`, `repository`, `author`, `created_at`, `updated_at`, `attributes`, `additional_attribute(s)`, `information_asset(s)`, `threat(s)`, `usecase(s)`, `exclusion(s)`, `third_party_dependenc(y|ies)`, `data_flow_diagram`, `data_flow_diagram_v2`, `data_flow_diagrams`, `mermaid`, `mermaid_diagrams`, `controls` and `proposed_controls`.

Namespaces are only a constraint when a parent model exists at the prefix. `infra.network.vpc` needs no model at `infra` or `infra.network`.

## Multi-file models in Threatcl Cloud

Threatcl Cloud can hold one threat model split across several files, keyed by each file's `id`. The file declaring the un-dotted root id is the model's default file, and each additional file declares a dotted id beneath it and typically extends the root.

Push the root file first, then its children. The server validates each file against the model's other stored files, so a child's `extends` target doesn't have to live in the same file. The `backend` block's old `segment` attribute is gone; the `id` alone keys each file. See [Managing Threat Models](/cloud/threat-models/).
