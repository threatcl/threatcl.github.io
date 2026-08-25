---
title: Claude Code Plugin
---

The [threatcl/claude-plugin](https://github.com/threatcl/claude-plugin) marketplace brings Threatcl into [Claude Code](https://claude.com/claude-code). It publishes two plugins:

- **`threatcl-cloud`**: a skill, five workflow slash commands, and the Threatcl Cloud MCP server.
- **`threatcl-lsp`**: an opt-in language server plugin, giving Claude live diagnostics while it edits HCL threat models.

## Install

```bash title="terminal"
$ claude plugin marketplace add threatcl/claude-plugin
$ claude plugin install threatcl-cloud@threatcl
```

You can also install from inside Claude Code with the `/plugin` command.

The first time you use a Threatcl Cloud feature, Claude Code opens a browser to complete OAuth. Pick your organization and you're done, with no tokens to copy around.

### Prerequisites

- **Claude Code.** These plugins are Claude Code specific. For Codex and other agents, follow the [agent setup guide](https://threatcl.com/agent-setup.md) instead.
- **The `threatcl` CLI**, for write operations and local file work. See [Installing threatcl](/threatcl/installation/).
- **A Threatcl Cloud account**, at [threatcl.com](https://threatcl.com).

## Slash commands

| Command | Argument | Purpose |
|---|---|---|
| `/threat-review` | `<model-slug-or-id>` | A structured security review of a cloud model: unmitigated threats, STRIDE coverage, policy evaluation, library-fit suggestions and prioritized next actions |
| `/threat-for-code` | `<path-or-diff-range>` | Analyze code and suggest threats from your org library, plus novel threats worth modeling, with HCL snippets |
| `/threat-drift` | `[diff-range]` | Check the model's claims against current code. Defaults to `main...HEAD` |
| `/threat-ci` | `<github-actions\|gitlab-ci\|pre-commit>` | Scaffold CI integration, with `cloud validate` on PR and `cloud policy evaluate` on merge |
| `/threat-hcl-new` | `<model-name>` | Scaffold a new HCL threat model with the `backend` block pre-populated |

`/threat-for-code` is the discovery command, asking what threats apply to this code. `/threat-drift` is the diagnostic one, checking whether what the model already claims is still true. For drift on every pull request rather than on demand, see the [drift action](/cicd/drift/).

## The skill

The bundled `threatcl` skill auto-triggers when Claude detects threat-modeling intent, and steers it toward the right tool for the job: the MCP server for reads, the CLI for writes and local files.

## MCP server

The plugin declares the hosted Threatcl Cloud MCP server, which gives Claude read access to your organization:

- `list_threat_models` and `get_threat_model`, for models and their HCL
- `search`, across threat models and the threat, control and information asset libraries
- `list_library_items` and `get_library_item`, for library lookups with version detail
- `get_usage_analytics`, for library usage statistics
- `update_threat_model_status`, to move a model between statuses

Authentication is handled by Claude Code over OAuth. For everything else, push, validate, library import and policy edits, the skill falls back to the `threatcl` CLI, which uses your [stored token](/cloud/authentication/).

:::caution[Two different MCP servers]
This is not the same thing as the [`threatcl mcp`](/threatcl/usage/#mcp) command. That one runs locally over stdio and exposes the HCL files in a directory you point it at, with no account required. This one is hosted, reaches your Threatcl Cloud organization, and authenticates with OAuth. Local files, or cloud data: pick the one that matches the work.
:::

### Endpoint

The server's endpoint is declared in the plugin's `.mcp.json`. If your organization is on a different deployment, edit that file after install. The CLI's endpoint is separate, and is saved with each token or overridden with `THREATCL_API_URL`. See [Authentication](/cloud/authentication/).

## The threatcl-lsp plugin

`threatcl-lsp` is a separate, opt-in plugin that wires the [`threatcl lsp`](/threatcl/usage/#lsp) language server into Claude Code. Claude then gets diagnostics pushed into its context each time it edits an HCL threat model: syntax errors, unknown blocks and attributes, missing required attributes and invalid enum values. It can catch and fix invalid HCL in the same turn it writes it.

```bash title="terminal"
$ claude plugin install threatcl-lsp@threatcl
```

It requires `threatcl` 0.5.0 or newer on your `PATH`. The plugin only tells Claude Code how to launch the server, it doesn't bundle it.

### The `*.hcl` caveat

Claude Code matches language servers on a file's final extension segment only. A file named `model.tm.hcl` resolves to `.hcl`, so this plugin necessarily claims **all** `*.hcl` files. Two consequences:

- It also attaches to Terraform, Packer and Nomad HCL, where it may report spurious "unknown block" diagnostics.
- Only one server can own `.hcl`. If you also install a Terraform or HCL language server plugin, whichever Claude Code loads first wins, and the other is dropped.

That's why it isn't bundled into `threatcl-cloud`. Install it if you mostly work in threatcl HCL, and skip it if your repos are mostly Terraform.

Note that this differs from the advice for editors with finer-grained matching, where naming your files `*.tm.hcl` and scoping the server to that suffix avoids the collision entirely. See [LSP](/threatcl/usage/#lsp).
