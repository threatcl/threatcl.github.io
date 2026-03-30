---
title: Policies
---

ThreatCL Cloud policies let you define automated checks against your threat models using [Rego](https://www.openpolicyagent.org/docs/latest/policy-language/) (Open Policy Agent's policy language). Policies can enforce standards like requiring specific controls, minimum threat coverage, or naming conventions across your organization.

## Listing Policies

The `cloud policies` command lists all policies in your organization.

```bash title="terminal"
$ threatcl cloud policies
```

#### Policies options

- `-enabled-only` — filter to enabled policies only
- `-json` — output as JSON

## Viewing a Policy

The `cloud policy` command displays details for a single policy.

```bash title="terminal"
$ threatcl cloud policy -policy-id=<uuid>
```

#### Policy options

- `-policy-id` — **required**. The policy ID to display
- `-show-rego` — include the full Rego source in the output
- `-json` — output as JSON

## Creating a Policy

The `cloud policy create` command creates a new policy from a local `.rego` file.

```bash title="terminal"
$ threatcl cloud policy create -name="Require Controls" -severity=error -rego-file=./require-controls.rego
```

#### Create options

- `-name` — **required**. The policy name
- `-severity` — **required**. Policy severity: `error`, `warning`, or `info`
- `-rego-file` — **required**. Path to a local `.rego` file containing the policy source
- `-description` — optional description
- `-category` — optional category
- `-tags` — optional comma-separated tags
- `-enabled` — enable the policy on creation (default: `true`)
- `-json` — output as JSON

## Updating a Policy

The `cloud policy update` command updates an existing policy. Only specified fields will be updated.

```bash title="terminal"
$ threatcl cloud policy update -policy-id=<uuid> -severity=warning
```

#### Update options

- `-policy-id` — **required**. The policy ID to update
- `-name` — new policy name
- `-description` — new description
- `-severity` — new severity: `error`, `warning`, or `info`
- `-rego-file` — path to an updated `.rego` file
- `-category` — new category
- `-tags` — comma-separated tags (replaces existing)
- `-enabled` — toggle enabled (`true` or `false`)
- `-enforced` — toggle enforced (`true` or `false`)
- `-json` — output as JSON

## Deleting a Policy

The `cloud policy delete` command deletes a policy from ThreatCL Cloud.

```bash title="terminal"
$ threatcl cloud policy delete -policy-id=<uuid>
```

#### Delete options

- `-policy-id` — **required**. The policy ID to delete
- `-force` — skip confirmation prompt

## Validating a Rego File

The `cloud policy validate` command validates a local `.rego` file against the ThreatCL Cloud API without creating a policy.

```bash title="terminal"
$ threatcl cloud policy validate my-policy.rego
```

#### Validate options

- `-json` — output as JSON

## Evaluating Policies

The `cloud policy evaluate` command triggers policy evaluation against a threat model. This is designed for CI/CD integration — use `-fail-on-error` or `-fail-on-warning` to control exit codes based on evaluation results.

```bash title="terminal"
$ threatcl cloud policy evaluate -model-id=my-app
```

#### Evaluate options

- `-model-id` — **required**. The threat model ID to evaluate policies against
- `-fail-on-error` — exit with code 1 if any policy with severity `error` fails
- `-fail-on-warning` — exit with code 1 if any policy with severity `warning` or `error` fails
- `-json` — output as JSON

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

- `-model-id` — **required**. The threat model ID
- `-json` — output as JSON

### Viewing a Single Evaluation

The `cloud policy evaluation` command displays details of a specific past evaluation.

```bash title="terminal"
$ threatcl cloud policy evaluation -model-id=my-app -eval-id=<evalId>
```

#### Evaluation options

- `-model-id` — **required**. The threat model ID
- `-eval-id` — **required**. The evaluation ID to view
- `-json` — output as JSON

## Common Options

All policy commands support these options:

- `-org-id` — organization ID. If not provided, uses the `THREATCL_CLOUD_ORG` environment variable or the first organization from your user profile
- `-config` — path to an optional config file

See the [Cloud Overview](/cloud/overview/) for details on environment variables like `THREATCL_API_URL`, `THREATCL_CLOUD_ORG`, and `THREATCL_API_TOKEN`.
