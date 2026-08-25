---
title: Threatcl Cloud Overview
---

:::tip[Learn more]
Visit [threatcl.com](https://threatcl.com) for more information about Threatcl Cloud, pricing, and to sign up.
:::

## What is Threatcl Cloud?

Threatcl Cloud is a SaaS platform for collaborative threat modeling. It extends the local `threatcl` CLI experience by providing a centralized, multi-user environment where teams can share, manage, and collaborate on threat models together.

While the standard `threatcl` CLI works entirely with local HCL files, Threatcl Cloud adds:

- **Centralized storage:** threat models are stored in the cloud and accessible by your team
- **Collaboration:** multiple team members can work on threat models within the same organization
- **Versioning:** track changes to threat models over time
- **Threat, control & information asset libraries:** shared libraries that can be referenced across models
- **Search:** search across all threat models in your organization

## Organizations and Roles

Threatcl Cloud is organized around **organizations**. Each organization has members with one of the following roles:

- **Owner:** full administrative control over the organization
- **Admin:** can manage members and threat models
- **Member:** can create and edit threat models
- **Viewer:** read-only access to threat models

## Backend Block

To link a local HCL threat model file to Threatcl Cloud, add a `backend` block to your `threatmodel` block:

```hcl
backend "threatcl-cloud" {
  organization = "acme"
  threatmodel = "my-app"
}

threatmodel "My Application" {
  description = "My application threat model"
  author = "@me"

  threat "Data Breach" {
    description = "Unauthorized access to sensitive data"
    impacts = ["Confidentiality"]
  }
}
```

The `backend "threatcl-cloud"` block is placed outside (before) the `threatmodel` block. It signals to the CLI that this file is intended for use with Threatcl Cloud. Commands like `cloud push` and `cloud validate` check for this block. See [backend](/specification/threatmodel/#backend) in the spec reference for its attributes.

A cloud threat model can also be split across [several files](/cloud/threat-models/#multi-file-models), each with its own `backend` block addressing the same organization and threat model.

## Environment Variables

The following environment variables can be used to configure Threatcl Cloud commands:

- `THREATCL_API_URL` - the Threatcl Cloud API endpoint URL
- `THREATCL_API_TOKEN` - an API token for authentication (alternative to device flow login)
- `THREATCL_CLOUD_ORG` - the default organization ID to use for cloud commands

These environment variables can be used instead of (or in addition to) flags and stored tokens. See [Authentication](/cloud/authentication/) for the full token resolution priority.

## Quick Start

The typical flow for getting started with Threatcl Cloud is:

### 1. Log in

```bash title="terminal"
$ threatcl cloud login
```

This initiates a device flow authentication. Follow the prompts to authenticate in your browser. See [Authentication](/cloud/authentication/) for details.

### 2. Create a threat model

You can create a threat model directly from the CLI:

```bash title="terminal"
$ threatcl cloud create -name "My Application" -description "My app threat model"
```

Or, use `cloud push` to validate and upload a local HCL file in one step.

### 3. Push a local file

```bash title="terminal"
$ threatcl cloud push my-threatmodel.hcl
```

The `push` command validates your HCL file for cloud compatibility, creates the threat model in the cloud if it doesn't exist, and uploads the HCL content. See [Managing Threat Models](/cloud/threat-models/) for the full range of commands.

## Further Reading

- [Authentication & Tokens](/cloud/authentication/) - login, logout, token management
- [Managing Threat Models](/cloud/threat-models/) - create, upload, push, validate, and view
- [Searching Threat Models](/cloud/search/) - search threats and controls across your org
- [Libraries](/cloud/library/) - import, export, and manage shared threat, control and information asset libraries
- [Policies](/cloud/policies/) - create, validate, and evaluate policies, written in Rego or as threatcl invariants
