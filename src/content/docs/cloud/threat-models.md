---
title: Managing Threat Models
---

ThreatCL Cloud provides a full suite of commands for creating, uploading, viewing, and managing threat models in the cloud.

## Listing Threat Models

The `cloud threatmodels` command lists all threat models in your organization.

```bash title="terminal"
$ threatcl cloud threatmodels
====================================================================================================
  Threat Models
====================================================================================================

ID                                   Name                           Slug                 Status     Version
----------------------------------------------------------------------------------------------------
4b6bdaf3-6a92-42f7-8edf-fe4e285151a6 My App                         my-app               draft      1.0.3
9c0e24fe-bf12-42b6-b44a-2c5ce6484e61 Test Example                   test-example         draft      1.0.21
74ec8b30-a22e-4ec8-825a-56cae7f83c8c Testing Pre-canned             testing-pre-canned   in_review  1.0.5
```

## Viewing a Threat Model

The `cloud threatmodel` command retrieves and displays a single threat model from the cloud.

```bash title="terminal"
$ threatcl cloud threatmodel -model-id=tm_abc123
```

#### Threatmodel options

- `-model-id` — the ID of the threat model to view
- `-download` — download the threat model HCL to a local file
- `-overwrite` — overwrite the local file if it already exists (used with `-download`)

### Versions

The `cloud threatmodel versions` command lists or downloads previous versions of a threat model.

```bash title="terminal"
$ threatcl cloud threatmodel versions -model-id test-example

📋 Threat Model Versions
────────────────────────────────────────────────────────────────────────────────────────────────────
▶ CURRENT VERSION
  Version:    1.0.21
  Created:    2026-01-30 14:15:46
  Changed by: 4c576800-a557-4a7f-a00b-3acf6b86552b
  ID:         d35f1bba-809d-4404-bfbd-8f80650b8e91

  Version:    1.0.20
  Created:    2026-01-30 14:14:12
  Changed by: 4c576800-a557-4a7f-a00b-3acf6b86552b
  ID:         783ce76c-e0c9-424d-bb93-c1c5c7aa2c9f
```

#### Versions options

- `-model-id` — the ID of the threat model
- `-download` — download a specific version
- `-version` — the version number to download (used with `-download`)

### Delete

The `cloud threatmodel delete` command deletes a threat model from the cloud.

```bash title="terminal"
$ threatcl cloud threatmodel delete -model-id=tm_abc123
```

#### Delete options

- `-model-id` — the ID of the threat model to delete

### Update Status

The `cloud threatmodel update-status` command changes the status of a threat model.

```bash title="terminal"
$ threatcl cloud threatmodel update-status -model-id=tm_abc123 -status=active
```

#### Update Status options

- `-model-id` — the ID of the threat model
- `-status` — the new status to set

## Creating Threat Models

The `cloud create` command creates a new threat model in the cloud.

```bash title="terminal"
$ threatcl cloud create -name "My Application" -description "My app threat model"
```

#### Create options

- `-name` — the name of the new threat model
- `-description` — a description for the threat model
- `-upload` — path to an HCL file to upload as the initial content

## Uploading HCL

The `cloud upload` command uploads an HCL file to an existing threat model in the cloud.

```bash title="terminal"
$ threatcl cloud upload -model-id=tm_abc123 my-threatmodel.hcl
```

#### Upload options

- `-model-id` — the ID of the threat model to upload to

## Push

The `cloud push` command is the most common way to get local threat models into the cloud. It validates the HCL file, creates the threat model if needed, and uploads the content — all in one step.

```bash title="terminal"
$ threatcl cloud push model.hcl
Uploading new version to threat model 'my-app'...
✓ Successfully pushed threat model from model.hcl
```

#### Push options

- `-no-create` — skip creating a new threat model if it doesn't exist; only upload to existing models
- `-no-update-local` — don't update the local HCL file with cloud metadata after push
- `-ignore-linked-controls` — skip validation of linked control references

## Validate

The `cloud validate` command validates an HCL file for cloud compatibility without uploading it. This checks for the presence of a `backend "threatcl-cloud"` block, verifies organization membership, and validates any library references.

```bash title="terminal"
$ threatcl cloud validate model.hcl
✓ Local Threat model file matches the latest version of the cloud threat model
✓ 1 threat ref(s) validated (PUBLISHED)
```

This is useful for CI/CD pipelines or pre-push checks. See the [Cloud Overview](/cloud/overview/) for details on the `backend` block.

## View

The `cloud view` command renders a threat model with enriched data from ThreatCL Cloud, including resolved library references for threats and controls.

Controls that reference the cloud control library are enriched with their descriptions, implementation guidance, and risk reduction values. If the control has local values set (e.g., description, risk_reduction), those local values are preserved and the cloud data is not used to overwrite them.

By default, threats that reference the threat library will also include their recommended controls from the library.

```bash title="terminal"
$ threatcl cloud view my-threatmodel.hcl

  My Application

  Author: @me

  ## Threat Scenarios

  ### Data Breach

  Unauthorized access to sensitive data

  │ Library Ref: LIB-T-001
  │ STRIDE: Tampering, Info Disclosure

  #### Controls

  ##### Encryption at Rest (LIB-C-042)

  │ Implemented: ✅
  │ Risk Reduction: 80
```

### Viewing a cloud threat model directly

Use `-model-id` to fetch and view a threat model directly from ThreatCL Cloud without needing a local copy of the HCL file. You can pass either the model ID or its slug.

```bash title="terminal"
$ threatcl cloud view -model-id=my-threat-model
```

If you belong to multiple organizations, use `-org-id` to specify which one to fetch from:

```bash title="terminal"
$ threatcl cloud view -model-id=my-threat-model -org-id=<orgId>
```

#### View options

- `-model-id` — fetch and view a threat model from ThreatCL Cloud by ID or slug. When set, the `<file>` argument is not required.
- `-org-id` — organization ID to use with `-model-id`. If not provided, uses the `THREATCL_CLOUD_ORG` env var or the default from your token store.
- `-raw` — output raw markdown instead of the formatted display
- `-ignore-linked-controls` — skip resolving linked control references from the cloud library
