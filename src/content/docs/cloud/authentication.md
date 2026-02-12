---
title: Authentication & Tokens
---

ThreatCL Cloud commands require authentication. The CLI supports device flow authentication, manually added tokens, and environment variable-based auth.

## Login

The `cloud login` command authenticates you with ThreatCL Cloud using a device flow. You'll be given a URL and a code to enter in your browser.

```bash title="terminal"
$ threatcl cloud login
```

If you belong to multiple organizations, you will be prompted to select which organization to authenticate with. Tokens are stored locally for subsequent commands.

### Login options

- `-org-id` — specify the organization ID to log in to directly, skipping the selection prompt

## Logout

The `cloud logout` command removes stored authentication tokens.

```bash title="terminal"
$ threatcl cloud logout
```

#### Logout options

- `-org-id` — remove the token for a specific organization only
- `-all` — remove all stored tokens for all organizations

## Whoami

The `cloud whoami` command displays information about the currently authenticated user and organization.

```bash title="terminal"
$ threatcl cloud whoami
============================================================
  ThreatCL Cloud - User Information
============================================================

Current Organization: bba13a37-0d50-4470-a731-f57bf67ac6eb

User:
  ID:        121f2303-d80c-4c40-9598-5c72749eb0b6
  Email:     user@example.com ✓
  Name:     Example User

Organizations:
  Name:              My Org
  ID:                bba13a37-0d50-4470-a731-f57bf67ac6eb
  Slug:              my-org
  Role:              owner
  Subscription Tier: team
  Users:             1/100
  Threat Models:     0/-1
  Storage:           0 KB/0 KB
```

## Token Management

The `cloud token` subcommands provide fine-grained control over stored authentication tokens.

### Token List

List all stored tokens:

```bash title="terminal"
$ threatcl cloud token list
```

### Token Add

Manually add an API token for an organization:

```bash title="terminal"
$ threatcl cloud token add -org-id=org_abc123 -token=tcl_mytoken
```

#### Token Add options

- `-org-id` — the organization ID to associate the token with
- `-token` — the API token value

### Token Default

Get or set the default organization. When no organization is specified in a command, the default is used.

```bash title="terminal"
# View current default
$ threatcl cloud token default

# Set a new default
$ threatcl cloud token default -org-id=org_abc123
```

#### Token Default options

- `-org-id` — set this organization as the default

### Token Remove

Remove a stored token for a specific organization:

```bash title="terminal"
$ threatcl cloud token remove -org-id=org_abc123
```

#### Token Remove options

- `-org-id` — the organization ID whose token should be removed

## Token Resolution Priority

When a cloud command needs an authentication token, the CLI resolves it in the following order:

1. `THREATCL_API_TOKEN` environment variable
2. `-token` flag (if the command supports it)
3. `THREATCL_CLOUD_ORG` environment variable (to select a stored token)
4. Default organization token (set via `cloud token default`)
5. Single stored token (if only one organization token exists)

If none of these resolve to a valid token, the command will prompt you to run `cloud login`.
