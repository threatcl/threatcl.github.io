---
title: Authentication & Tokens
---

Threatcl Cloud commands require authentication. The CLI supports device flow authentication, manually added tokens, and environment variable-based auth.

## Login

The `cloud login` command authenticates you with Threatcl Cloud using a device flow. You'll be given a URL and a code to enter in your browser.

```bash title="terminal"
$ threatcl cloud login
```

Tokens are scoped to a single organization and are saved to your OS keychain (or settings file) for subsequent commands. You choose which organization to authenticate against in the browser, not on the command line. To authenticate with more than one, run `cloud login` again and select a different organization.

The API endpoint used to authenticate is saved alongside the token, and later cloud commands use that endpoint for that organization. This means tokens for different deployments can live side by side in the token store.

### Login options

- `-target=<host>`: the Threatcl Cloud deployment to authenticate against, given as its web host (e.g. `beta.threatcl.com`). The API endpoint is derived from it automatically (e.g. `beta-api.threatcl.com`)
- `-api-url=<url>`: the exact API endpoint to authenticate against (e.g. `https://beta-api.threatcl.com`). Use this when the `-target` mapping doesn't fit. Cannot be combined with `-target`

## Logout

The `cloud logout` command removes stored authentication tokens.

```bash title="terminal"
$ threatcl cloud logout
```

#### Logout options

- `-org-id`: remove the token for a specific organization only
- `-all`: remove all stored tokens for all organizations

## Whoami

The `cloud whoami` command displays information about the currently authenticated user and organization.

```bash title="terminal"
$ threatcl cloud whoami
============================================================
  Threatcl Cloud - User Information
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

This displays each token's organization ID and name, the API endpoint it authenticates against, its expiry status, and which organization is currently the default.

### Token Add

Manually add an API token, for instance one generated via the web interface:

```bash title="terminal"
$ threatcl cloud token add -token=tcl_mytoken
```

The command auto-detects which organization the token belongs to by querying the API, so there is no organization flag. The API endpoint used to validate the token is saved with it.

#### Token Add options

- `-token`: the API token to add. If not provided, you will be prompted to enter it
- `-target=<host>`: the deployment the token belongs to, given as its web host (e.g. `beta.threatcl.com`). The API endpoint is derived automatically
- `-api-url=<url>`: the exact API endpoint the token belongs to. Cannot be combined with `-target`

### Token Default

Get or set the default organization. When no organization is specified in a command, the default is used.

```bash title="terminal"
# View current default
$ threatcl cloud token default

# Set a new default
$ threatcl cloud token default 550e8400-e29b-41d4-a716-446655440000
```

#### Token Default arguments

- `[org-id]`: the organization ID to set as the default, given as a positional argument. Without it, the current default is displayed

### Token Remove

Remove a stored token for a specific organization:

```bash title="terminal"
$ threatcl cloud token remove 550e8400-e29b-41d4-a716-446655440000
```

If the removed organization was set as the default, the default is cleared. If only one token remains after removal, it automatically becomes the new default.

#### Token Remove arguments

- `<org-id>`: the organization ID whose token should be removed, given as a positional argument (required)

## Token Resolution Priority

When a cloud command needs an authentication token, it first checks the `THREATCL_API_TOKEN` environment variable. If that is set, the token is used directly and the local token store is bypassed entirely. The organization then comes from the command's `-org-id` flag, falling back to the `THREATCL_CLOUD_ORG` environment variable.

Otherwise the token is read from the local token store, and the organization is selected in this order:

1. The command's `-org-id` flag
2. `THREATCL_CLOUD_ORG` environment variable
3. The default organization, set via `cloud token default`
4. The only stored token, if just one organization token exists

If none of these resolve to a valid token, the command will prompt you to run `cloud login`.
