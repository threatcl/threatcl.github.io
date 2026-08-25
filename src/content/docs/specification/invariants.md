---
title: Invariants
---

Invariants are org-wide, machine-checked rules evaluated against threat models, things like "no public endpoints should be unauthenticated", or "all internet-facing features must document audit logging".

They live in their own HCL file, separate from the threat models themselves, so one rule set can govern a whole fleet of models:

```bash title="terminal"
$ threatcl validate -invariants=invariants.hcl ./models/
```

The same parser and evaluator run in the `threatcl` CLI and in [Threatcl Cloud](#invariants-in-threatcl-cloud), so a rule means the same thing wherever it runs.

## The invariants file

An invariants file contains one or more `invariant` blocks:

```hcl title="invariants.hcl"
invariant "no_unauthenticated_public_endpoints" {
  description = "No public endpoints should be unauthenticated"
  severity    = "error"
  target      = "process"
  when        = item.trust_zone == "Public"
  condition   = anytrue([for c in tm.controls : c.implemented && can(regex("(?i)auth", c.name))])
}

invariant "threats_have_implemented_controls" {
  description = "Every threat must have at least one implemented control"
  target      = "threat"
  condition   = anytrue([for c in item.controls : c.implemented])
}
```

Invariant names are the block labels, and must be unique within a file.

### Attributes

| Attribute | Required | Meaning |
| --- | --- | --- |
| `target` | yes | Which collection the rule applies to (see [Targets](#targets)). The condition runs once per item |
| `condition` | yes | HCL expression that must evaluate to `true` for each targeted item. `false` records a violation |
| `when` | no | HCL expression filtering which items the rule applies to. Items where `when` is `false` are skipped |
| `severity` | no | `"error"` (default) or `"warning"`. Only error violations fail a run |
| `description` | no | Human explanation, used as the violation message when `error_message` isn't set |
| `error_message` | no | HCL string expression for the violation message. May interpolate `item`, `tm` and, for DFD targets, `dfd` |

## Targets

The `target` attribute picks the collection each item comes from. The condition is evaluated once per item, so a violation names the exact offending item.

| Target | Item |
| --- | --- |
| `threatmodel` | The threat model itself (one item per model) |
| `threat` | Each `threat` block |
| `control` | Each control across all threats, inline and imported |
| `information_asset` | Each `information_asset` block |
| `usecase` | Each `usecase` block |
| `exclusion` | Each `exclusion` block |
| `third_party_dependency` | Each `third_party_dependency` block |
| `data_flow_diagram` | Each `data_flow_diagram_v2` block (legacy `data_flow_diagram` blocks included) |
| `process` | Each DFD process, including those nested in `trust_zone` blocks |
| `external_element` | Each DFD external element, including nested |
| `data_store` | Each DFD data store, including nested |
| `flow` | Each DFD flow |
| `trust_zone` | Each DFD trust zone |

Items with no name of their own (`usecase` and `exclusion`) are reported by their 1-based position, as `usecase #2`.

## Expressions

`when`, `condition` and `error_message` are native HCL expressions, with three variables in scope:

- `item`: the current target item.
- `tm`: the threat model that owns the item. For `target = "threatmodel"`, `item` and `tm` are the same object.
- `dfd`: the owning diagram, for the DFD element targets only (`process`, `external_element`, `data_store`, `flow`, `trust_zone`).

Referencing any other variable is a parse error, so a typo fails when the file is read rather than when some particular model happens to be evaluated.

### The tm object

| Field | Type | Notes |
| --- | --- | --- |
| `name`, `description`, `author`, `link`, `diagram_link` | string | |
| `id`, `extends` | string | The declared attributes, empty when not declared. Models a rule sees already have `extends` inheritance applied |
| `repository` | list(string) | |
| `created_at`, `updated_at` | number | Unix timestamps |
| `attributes` | object | `new_initiative`, `internet_facing`, `initiative_size`. All-defaults when the block is absent |
| `additional_attributes` | map(string) | `additional_attribute` blocks as a name to value map |
| `information_assets` | list(object) | `name`, `description`, `information_classification`, `source`, `ref` |
| `threats` | list(object) | See below |
| `usecases`, `exclusions` | list(object) | Each has `description` |
| `third_party_dependencies` | list(object) | `name`, `description`, `saas`, `paying_customer`, `open_source`, `uptime_dependency`, `uptime_notes`, `infrastructure` |
| `data_flow_diagrams` | list(object) | See below |
| `controls` | list(object) | Every control across every threat, flattened |

Each **threat** has `name`, `description`, `impacts`, `stride`, `information_asset_refs`, `control` (the legacy string attribute), `ref`, `controls`, `proposed_controls`, and `risk`, an object with `likelihood`, `impact`, `severity` and `rationale`, or `null` when the threat has no [risk block](/specification/threatmodel/#risk).

Each **control** has `name`, `implemented`, `description`, `implementation_notes`, `ref`, `risk_reduction`, and `attributes` (a name to value map of its `attribute` blocks).

Each **data flow diagram** has `name`, `processes`, `external_elements`, `data_stores`, `flows` and `trust_zones`. The element lists include elements nested inside `trust_zone` blocks, and every element's `trust_zone` field is resolved, so a nested element reports its enclosing zone. Flows have `name`, `from`, `to` and `protocol`.

Every string field is present (empty rather than null) so a comparison like `item.protocol != ""` is safe without a null check.

### Functions

The usual expression toolkit is available, behaving like its Terraform counterpart: `alltrue`, `anytrue`, `can`, `try`, `coalesce`, `compact`, `concat`, `contains`, `distinct`, `element`, `flatten`, `format`, `join`, `keys`, `length`, `lookup`, `lower`, `max`, `merge`, `min`, `regex`, `regexall`, `replace`, `reverse`, `sort`, `split`, `substr`, `trim`, `trimprefix`, `trimspace`, `trimsuffix`, `upper`, `values`, `zipmap`.

Quantification uses `for` expressions:

```hcl
# every: all controls implemented
condition = alltrue([for c in item.controls : c.implemented])

# exists: at least one confidential asset
condition = anytrue([for a in tm.information_assets : a.information_classification == "Confidential"])

# none: no flow uses plain http
condition = length([for f in item.flows : f if lower(f.protocol) == "http"]) == 0
```

## Exemptions

An `exemption` block waives an invariant for one threat model, with a required justification so the waiver is auditable:

```hcl
invariant "internet_facing_models_document_audit_logging" {
  description = "All internet-facing features must emit audit logs"
  severity    = "warning"
  target      = "threatmodel"
  when        = item.attributes.internet_facing
  condition   = anytrue([for c in tm.controls : can(regex("(?i)audit", c.name))])

  error_message = "threatmodel '${item.name}' is internet-facing but documents no audit logging control"

  exemption {
    model         = threatmodel["Legacy Public API"]
    justification = "Grandfathered until Q3 migration; tracked in SEC-123"
  }
}
```

`model` is a real reference, not a string. `threatmodel` is a registry of the models in the current run, addressable two ways:

- **By display name**, with index syntax: `threatmodel["Legacy Public API"]`.
- **By identifier, with dot notation**: `threatmodel.legacy_public_api`. A model's identifier is its declared [id](/specification/threatmodel/#id) when it has one, otherwise one derived from its name. Dotted ids nest, so `id = "buildings.tower"` is `threatmodel.buildings.tower`, and a model whose id *is* the namespace resolves at that address itself.

Referencing a model that isn't in the run is a hard error listing the models that are, so a renamed or typo'd model can't leave a silently dead waiver behind. Identifier collisions are errors too, every address must mean exactly one thing.

If one invariants file is shared across fleets that are evaluated separately, wrap the reference so it's simply inactive where the model isn't present:

```hcl
model = try(threatmodel["Other Fleet's Model"], null)
```

Exemptions live in the invariants file, never in the threat model, so a model can't waive a rule for itself. Exempted models are skipped rather than evaluated, and are reported with their justification.

## Output and exit codes

`threatcl validate` validates the threat model files as usual, then evaluates every invariant against every validated model. Every model in the run is in scope, so rules that reason about the fleet, and exemptions naming another model, resolve against the whole set.

```bash title="terminal"
$ threatcl validate -invariants=invariants.hcl ./models/
Validated 4 threatmodels in 3 files
Invariant 'internet_facing_models_document_audit_logging' exempts threatmodel 'Legacy Public API' (models/legacy.hcl): Grandfathered until Q3 migration; tracked in SEC-123
Invariant violation [error] 'threats_have_implemented_controls': threat 'Credential theft' in threatmodel 'Payments' (models/payments.hcl): Every threat must have at least one implemented control
Checked 3 invariants against 4 threatmodels: 1 errors, 0 warnings, 1 exemptions
```

Each violation names the offending item, its threat model and the file it came from. Exemptions are printed with their justification, so a waiver stays visible in every run instead of quietly suppressing a finding.

`-invariants` also works with `-stdin` and `-stdinjson`, where violations are attributed to `STDIN`.

The exit code is non-zero if:

- the threat models themselves fail validation,
- the invariants file is invalid,
- an invariant expression fails to evaluate. That's a bug in the rule, and it's reported loudly rather than skipped, or
- any `error`-severity invariant is violated.

`warning`-severity violations are reported, but exit zero.

## Rolling out a new rule

The two severities make invariants straightforward to adopt in CI without a flag day:

1. Add the rule with `severity = "warning"`. CI keeps passing, and every run prints the models that don't comply.
2. Fix the fleet, or add an `exemption` block with a justification for the models that are genuinely allowed to differ.
3. Flip the rule to `severity = "error"` (the default) once the warnings are gone. From then on, a regression fails the build.

## Invariants in Threatcl Cloud

Threatcl Cloud's policy engine speaks invariants as well as Rego, so the same file can gate a pull request locally and every model in your organization centrally. A cloud policy is either a Rego module (engine `rego`) or a single `invariant` block (engine `invariant`), and the cloud runs the same evaluator described here.

```bash title="terminal"
$ threatcl cloud policy sync-invariants invariants.hcl
```

Each `invariant` block becomes one policy, addressed by its name label. See [Policies](/cloud/policies/) for the cloud side of this.
