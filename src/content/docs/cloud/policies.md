---
title: Policies
---

Threatcl Cloud policies let you define automated checks against your threat models. They can enforce standards like requiring specific controls, minimum threat coverage, or naming conventions across your organization.

A policy is written with one of two engines:

- **`rego`** (the default) - a [Rego](https://www.openpolicyagent.org/docs/latest/policy-language/) module, in Open Policy Agent's policy language.
- **`invariant`** - a single threatcl [`invariant` block](/specification/invariants/), evaluated by the same engine `threatcl validate -invariants` runs locally. A rule means the same thing in CI and in the cloud.

Most commands below take an `-engine` flag to say which you're working with.

:::note
Not every deployment offers the invariant engine. Where it's switched off, these commands report that the feature isn't enabled and evaluation ignores invariant policies. Run `threatcl validate -invariants` locally in the meantime.
:::

## Listing Policies

The `cloud policies` command lists all policies in your organization.

```bash title="terminal"
$ threatcl cloud policies
```

The output includes an ENGINE column, showing whether each policy is a Rego module or an invariant.

#### Policies options

- `-enabled-only` - filter to enabled policies only
- `-engine` - filter to one engine, either `rego` or `invariant`
- `-json` - output as JSON

## Viewing a Policy

The `cloud policy` command displays details for a single policy, including which engine it uses.

```bash title="terminal"
$ threatcl cloud policy -policy-id=<uuid>
```

#### Policy options

- `-policy-id` - **required**. The policy ID to display
- `-show-source` - include the full policy source in the output. `-show-rego` is a deprecated alias for this flag
- `-json` - output as JSON

## Creating a Policy

The `cloud policy create` command creates a new policy from a local file: a `.rego` module, or an `.hcl` file holding a single `invariant` block.

```bash title="terminal"
$ threatcl cloud policy create -name="Require Controls" -severity=error -file=./require-controls.rego

$ threatcl cloud policy create -engine=invariant -file=./one-invariant.hcl
```

For an invariant policy the block itself is authoritative, so `-name` and `-severity` are optional and default to the block's name label and `severity` attribute. A `-severity` that contradicts the block is rejected locally, rather than at the API. To import a whole invariants file at once, use [sync-invariants](#importing-an-invariants-file) instead.

#### Create options

- `-name` - the policy name. Required for Rego policies, defaults to the block's name label for invariant policies
- `-engine` - the policy engine, either `rego` (the default) or `invariant`
- `-severity` - policy severity: `error`, `warning`, or `info`. Required for Rego policies. Invariant policies take it from the block, and have no `info` level
- `-file` - **required**. Path to the policy source: a `.rego` module, or an `.hcl` file with a single `invariant` block. `-rego-file` is a deprecated alias for this flag
- `-description` - optional description
- `-category` - optional category
- `-tags` - optional comma-separated tags
- `-enabled` - enable the policy on creation (default: `true`)
- `-json` - output as JSON

## Updating a Policy

The `cloud policy update` command updates an existing policy. Only specified fields will be updated.

```bash title="terminal"
$ threatcl cloud policy update -policy-id=<uuid> -severity=warning
```

A policy's engine is fixed when it's created, so `-engine` here only tells the command how to read a replacement source file. Pass `-engine=invariant` when updating an invariant policy, so the file is parsed as an invariant block before it's sent.

#### Update options

- `-policy-id` - **required**. The policy ID to update
- `-name` - new policy name
- `-description` - new description
- `-severity` - new severity: `error`, `warning`, or `info`
- `-engine` - the engine of the policy being updated. Only affects how `-file` is read and sent
- `-file` - path to an updated policy source file. `-rego-file` is a deprecated alias for this flag
- `-category` - new category
- `-tags` - comma-separated tags (replaces existing)
- `-enabled` - toggle enabled (`true` or `false`)
- `-enforced` - toggle enforced (`true` or `false`)
- `-json` - output as JSON

## Deleting a Policy

The `cloud policy delete` command deletes a policy from Threatcl Cloud.

```bash title="terminal"
$ threatcl cloud policy delete -policy-id=<uuid>
```

#### Delete options

- `-policy-id` - **required**. The policy ID to delete
- `-force` - skip confirmation prompt

## Validating a Policy File

The `cloud policy validate` command validates a local policy source file against the Threatcl Cloud API without creating a policy.

```bash title="terminal"
$ threatcl cloud policy validate my-policy.rego

$ threatcl cloud policy validate -engine=invariant invariants.hcl
```

Invariant validation is organization-scoped. The server resolves the block's exemption references against the threat model identities your organization's models declare, so it can fail for reasons a local parse never sees.

#### Validate options

- `-engine` - the policy engine, either `rego` (the default) or `invariant`
- `-json` - output as JSON

## Importing an invariants file

The `cloud policy sync-invariants` command imports a whole [invariants](/specification/invariants/) file, creating one policy per `invariant` block.

```bash title="terminal"
$ threatcl cloud policy sync-invariants invariants.hcl
Parsed 3 invariants from invariants.hcl

  + no_public_unauth (created)
  ~ threats_have_controls (updated)

1 created | 1 updated
```

Policies are upserted by slug, and the slug is the block's name label, so re-running this after editing the file updates the same policies rather than piling up new ones. The import is all-or-nothing: if any block fails to parse or validate, nothing is imported and the error names the offending invariant. Cloud-side metadata that you manage in the UI (enabled, enforced, category and tags) survives an update, and new policies default to enabled and not enforced.

Two things to know before pushing a file up:

- **Exemptions resolve against HCL identities, not cloud display names.** A model shown as "Payments Service" in the cloud whose file declares `threatmodel "Payments"` is exempted as `threatmodel["Payments"]`, or by its dotted `id`. Exemptions are also segment-granular, so exempting a root segment leaves its children checked.
- **Validation is organization-scoped.** The cloud resolves every exemption against the models your organization holds, so this can reject a file that parses cleanly on your laptop.

#### Sync-invariants options

- `-org-id` - the organization to import into
- `-json` - output as JSON

## Evaluating Policies

The `cloud policy evaluate` command triggers policy evaluation against a threat model. This is designed for CI/CD integration - use `-fail-on-error` or `-fail-on-warning` to control exit codes based on evaluation results.

```bash title="terminal"
$ threatcl cloud policy evaluate -model-id=my-app
```

An invariant policy's violations are printed beneath its row, naming the offending item, the segment it came from, and the rendered message, along with any active exemptions and rule evaluation errors.

#### Evaluate options

- `-model-id` - **required**. The threat model ID to evaluate policies against
- `-fail-on-error` - exit with code 1 if any policy with severity `error` fails
- `-fail-on-warning` - exit with code 1 if any policy with severity `warning` or `error` fails
- `-json` - output as JSON

### CI/CD Usage

Use `-fail-on-error` or `-fail-on-warning` in your pipelines to gate deployments on policy compliance:

```bash title="terminal"
$ threatcl cloud policy evaluate -model-id=my-app -fail-on-error -json
```

## Viewing Past Evaluations

### Listing Evaluations

The `cloud policy evaluations` command lists past policy evaluations for a threat model.

```bash title="terminal"
$ threatcl cloud policy evaluations -model-id=my-app
```

#### Evaluations options

- `-model-id` - **required**. The threat model ID
- `-json` - output as JSON

### Viewing a Single Evaluation

The `cloud policy evaluation` command displays details of a specific past evaluation.

```bash title="terminal"
$ threatcl cloud policy evaluation -model-id=my-app -eval-id=<evalId>
```

#### Evaluation options

- `-model-id` - **required**. The threat model ID
- `-eval-id` - **required**. The evaluation ID to view
- `-json` - output as JSON

## Common Options

All policy commands support these options:

- `-org-id` - organization ID. If not provided, uses the `THREATCL_CLOUD_ORG` environment variable or the first organization from your user profile
- `-config` - path to an optional config file

See the [Cloud Overview](/cloud/overview/) for details on environment variables like `THREATCL_API_URL`, `THREATCL_CLOUD_ORG`, and `THREATCL_API_TOKEN`.
