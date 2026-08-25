---
title: Using threatcl
---

## Help

For help on any subcommands, use the `-h` flag.

```bash title="terminal"
$ threatcl
Usage: threatcl [--version] [--help] <command> [<args>]

Available commands are:
    cloud        Interact with ThreatCL Cloud services
    dashboard    Generate markdown files from existing HCL threatmodel file(s)
    dfd          Generate Data Flow Diagram PNG or DOT files from existing HCL threatmodel file(s)
    export       Export threat models into other formats
    generate     Generate an HCL Threat Model
    list         List Threatmodels found in HCL file(s)
    lsp          Run a Language Server (LSP) over stdio
    mcp          Model Context Protocol (MCP) server for threatcl
    mermaid      Output raw mermaid source from 'mermaid' blocks in existing HCL threatmodel file(s)
    query        Execute GraphQL queries against threat model data
    server       Start a GraphQL API server for threat models
    terraform    Parse output from 'terraform show -json'
    validate     Validate existing HCL Threatmodel file(s)
    view         View existing HCL Threatmodel file(s)
```

### Arguments

`threatcl` uses the typical argument style used by Hashicorp tools, that is a single `-` (instead of `--`). 

Most arguments can accept a value, in the style of `-argument=value` or `-argument value`.

For boolean arguments, you typically set them by simply adding the `-argument` to the command.

### Optional Config File

Most of the `threatcl` commands have a `-config` flag that allows you to specify a `config.hcl` file. HCL within this file may be used to overwrite some of `threatcl`'s default attributes. These are listed below:

* **Initiative Sizes** - defaults to "Undefined", "Small", "Medium", "Large"
* **Default Initiative Size** - defaults to "Undefined
* **Information Classifications** - defaults to "Restricted", "Confidential", "Public"
* **Default Information Classification** - defaults to "Confidential"
* **Impact Types** - defaults to "Confidentiality", "Integrity", "Availability"
* **STRIDE Elements** - defaults to "Spoofing", "Tampering", "Info Disclosure", "Denial Of Service", "Elevation Of Privilege"
* **Uptime Dependency Classifications** - defaults to "none", "degraded", "hard", "operational"
* **Default Uptime Depency Classification** - defaults to "none"

For example:

```hcl
initiative_sizes = ["S", "M", "L"]
default_initiative_size = "M"
info_classifications = ["1", "2"]
default_info_classification = "1"
impact_types = ["big", "small"]
strides = ["S", "T"]
uptime_dep_classifications = ["N", "D"]
default_uptime_dep_classification = "N"
```

If you modify these attributes, you'll need to remember to provide the config file for other operations, as this may impact validation or dashboard creation.

The config file also carries `allow_remote_imports`, which controls whether a threat model's `imports` and `including` attributes may fetch remote sources. It defaults to `false`.

```hcl
allow_remote_imports = true
```

See [External HCL Files](/specification/external-files/) for what this permits, and the restrictions that still apply when it's enabled.

## Commands

These are the main sub-commands available to `threatcl`

### Validate

The `threatcl validate` command is used to validate a `threatcl` spec HCL file.

```bash title="terminal"
$ threatcl validate examples/*
Validated 3 threatmodels in 3 files
```

#### Validate options

If you want to pipe input into `validate` you can do so with with `-stdin` or `-stdinjson` flag. This is useful for pipelining commands together.

The `-invariants=<file>` flag additionally evaluates a file of [invariants](/specification/invariants/) (org-wide rules such as "every threat must have at least one implemented control") against every model that validated. Violations name the offending item, and an `error`-severity violation fails the run.

```bash title="terminal"
$ threatcl validate -invariants=invariants.hcl ./models/
Validated 4 threatmodels in 3 files
Invariant violation [error] 'threats_have_implemented_controls': threat 'Credential theft' in threatmodel 'Payments' (models/payments.hcl): Every threat must have at least one implemented control
Checked 3 invariants against 4 threatmodels: 1 errors, 0 warnings, 1 exemptions
```

This works with `-stdin` and `-stdinjson` too, where violations are attributed to `STDIN`. See [Invariants](/specification/invariants/) for the rule language, exit codes, and how to roll a rule out from `warning` to `error`.

### List

The `threatcl list` command can be used to list threat models from a selection of hcl files.

```bash title="terminal"
$ threatcl list examples/*
#  File              Threatmodel      Author
1  examples/tm1.hcl  Tower of London  @xntrik
2  examples/tm1.hcl  Fort Knox        @xntrik
3  examples/tm2.hcl  Modelly model    @xntrik
```

#### List options

If you don't want to display the header, use the `-noheader` flag.

You can also adjust the available columns with `-fields` flag. For example, by providing a comma-separated list of fields:
* `number`
* `file`
* `threatmodel`
* `assetcount`
* `threatcount`
* `usecasecount`
* `tpdcount`
* `exclusioncount`
* `size`
* `internetfacing`
* `newinitiative`
* `dfd`
* `repository`
* `riskcount`
* `highestseverity`
* `author`

By default it'll be as if you provided `-fields=number,file,threatmodel,author`

`riskcount` counts the threats carrying a [risk](/specification/threatmodel/#risk) block, and `highestseverity` is the most severe inherent rating among them, which makes this a quick way to triage a folder of models:

```bash title="terminal"
$ threatcl list -fields=number,file,threatmodel,riskcount,highestseverity,repository ./models/*.hcl
#  File           Threatmodel  Risk Count  Highest Severity  Repository
1  payments.hcl   Payments     2           critical          https://github.com/example/payments
2  reporting.hcl  Reporting    0           -                 -
```

### View

The `threatcl view` command can be used to view threat models from a selection of hcl files.

```bash title="terminal"
$ threatcl view examples/tm2.hcl

  Modelly model

  Author: @xntrik

  ## Threat Scenarios

  ### Threat

  threaty threat

  │ STRIDE: Spoofing, Elevation Of Privilege

  #### Controls

  ##### Important Control

  │ Implemented: ❌

  This is a description of the control.

                   │
  ─────────────────┼─────
    Risk Reduction │ 50
```

#### View options

If you provide the `-raw` flag, then raw markdown will be returned.

### Export

The `threatcl export` command is used to export a threat model (or models) into the native JSON representation, by default. You can also export into the [OpenThreatModel](https://github.com/IriusRisk/OpenThreatModel) JSON representation.

```bash title="terminal"
$ threatcl export -format=otm examples/tm1.hcl
[{"assets":[{"description":"including the imperial state crown","id":"crown-jewels","name":"crown jewels","risk":{"availability":0,"confidentiality":0,"integrity":0}}],"mitigations":[{"attributes":{"implementation_notes":"They are trained to be guards as well","implemented":true},"description":"Lots of guards patrol the area","id":"lots-of-guards","name":"Lots of Guards","riskReduction":80}],"otmVersion":"0.2.0","project":{"attributes":{"initiative_size":"Small","internet_facing":true,"network_segment":"dmz","new_initiative":true},"description":"A historic castle","id":"tower-of-london","name":"Tower of London","owner":"@xntrik"},"threats":[{"categories":["Confidentiality"],"description":"Someone who isn't the Queen steals the crown","id":"threat-1","name":"Threat 1","risk":{"impact":0,"likelihood":null}}]},{"assets":[{"description":"Lots of gold", "id":"gold","name":"Gold","risk":{"availability":0,"confidentiality":0,"integrity":0}}],"mitigations":[{"attributes":{"implemented":true},"description":"A large wall surrounds the fort","id":"big-wall","name":"Big Wall","riskReduction":80}],"otmVersion":"0.2.0","project":{"attributes":{"initiative_size":"Small","internet_facing":true,"new_initiative": false},"description":"A .. fort?","id":"fort-knox","name":"Fort Knox","owner":"@xntrik"},"threats":[{"categories":["Confidentiality"],"description":"Someone steals the gold","id":"threat-1","name":"Threat 1","risk":{"impact":0,"likelihood":null}}]}]
```

If you set the `-format` to `hcl` this is useful if you want to return a re-formatted HCL output from a dynamic threat model.

#### Export options

- You can specify the output of the export with the `-format` flag. By default this is set to `json`, but you can also set it to `otm` or `hcl`.

- If you want to write to a file instead of `stdout` use the `-output` flag, for example `threatcl export -output=filename.json`. If you want to overwrite the output file, supply the `-overwrite` flag.

### Dashboard

The `threatcl dashboard` command takes `threatcl` HCL files, and generates a number of output files, and optionally PNG files, dropping them into the selected folder.

```bash title="terminal"
$ threatcl dashboard -overwrite -outdir=dashboard-example examples/*
Created the 'dashboard-example' directory
Writing dashboard markdown files to 'dashboard-example' and overwriting existing files
Successfully wrote to 'dashboard-example/tm1-toweroflondon.md'
Successfully wrote to 'dashboard-example/tm1-fortknox.md'
Successfully wrote to 'dashboard-example/tm2-modellymodel.png'
Successfully wrote to 'dashboard-example/tm2-modellymodel.md'
Successfully wrote to 'dashboard-example/dashboard.md'
```

#### Dashboard options

The `dashboard` command takes a number of options, and allows for you to customise the templates used for both the individual threat model generated files, and the associated index file.

- You must set the output folder using the `-outdir` flag. For example, `-outdir dashboard`

- By default the index file generated is `dashboard.md`. You can change the name of the file, but not its extension, with the `-dashboard-filename` flag. For example, `-dashboard-filename=index`

- If you don't want to generate and include rendered DFD files provide the `-nodfd` flag.

- By default the extension of generated files is `.md`. If you want to change this, use the `-out-ext` flag. For example, `-out-ext=html`. Don't include the leading `.`.

- If you want to overwrite the target folder provide the `-overwrite` flag.

Any [mermaid](/specification/threatmodel/#mermaid) blocks in your threat models are rendered into the generated markdown, alongside data flow diagrams.

#### Dashboard templates

You can fully customise the templates used to generate `dashboard` output. By default this uses Golang's [text/template](https://pkg.go.dev/text/template) package.

- To specify a dashboard template file, use the `-dashboard-template` flag. For an example, see [dashboard-template.tpl](https://github.com/threatcl/threatcl/blob/main/examples/dashboard-template.tpl).

- To specify a threatmodel template file, use the `-threatmodel-template` flag. For an example, see [threatmodel-template.tpl](https://github.com/threatcl/threatcl/blob/main/examples/threatmodel-template.tpl).

- You can generate HTML output instead of plaintext. To do that, ensure you use appropriate templates, and also enable (by setting) `-dashboard-html`. Don't forget to set `-out-ext=html`. This will then use Golang's [html/template](https://pkg.go.dev/html/template) package.

### Data Flow Diagram

As per the [spec](/specification/overview/), a `threatmodel` may include `data_flow_diagram_v2` blocks. An example of a simple DFD is available [here](/specification/overview/). The legacy `data_flow_diagram` blog will be deprecated at some point.

The `threatcl dfd` command takes `threatcl` HCL files, and generates a number of png files, dropping them into a selected folder.

If the HCL file doesn't include a `threatmodel` block with a `data_flow_diagram` or `data_flow_diagram_v2` block, then nothing is output.

The command is similar to the `dashboard` command.

```bash title="terminal"
$ threatcl dfd -overwrite -outdir testout examples/*
Successfully created 'testout/tm2-modellymodel.png'
```

#### Data Flow Diagram options

- You can specify the output format with the `-format` flag. By default this is set to `png`, but you can also set it to `dot`, `svg`, `mermaid`, or `d2`.

- If the format is textual (dot, mermaid, d2), you can output directly to STDOUT with the `-stdout` flag.

- `-outdir` is the directory where files are written. This folder will be created if it doesn't exist. Either this, or `-out` must be set.

- `-out` is the name of a single output file. Only the first discovered DFD in all the parsed HCL files will be created. Either this or `-outdir` must be set.

- `-overwrite` flag can optionally be added to overwrite any output content.

- `-protocol-style` controls how to render the optional data flow `protocol` attribute. By default this will be `label`, but can optionally be set to `color` to color each flow's edge by protocol and emit a legend. `-protocol-style` can also be `none` or `both`. Both allows you to label the flow and color-code.

### Mermaid

As well as data flow diagrams, a `threatmodel` may include [mermaid](/specification/threatmodel/#mermaid) blocks holding raw [mermaid](https://mermaid.js.org/) source. The `threatcl mermaid` command pulls that source back out.

Unlike `threatcl dfd`, it doesn't render anything, it emits the verbatim mermaid content, so you can pipe it into a renderer such as [mermaid-cli](https://github.com/mermaid-js/mermaid-cli):

```bash title="terminal"
$ threatcl mermaid my-threatmodel.hcl
sequenceDiagram
  User->>App: credentials
  App->>Auth: verify
  Auth-->>App: token

$ threatcl mermaid my-threatmodel.hcl | mmdc -o login.png
```

#### Mermaid options

- By default the source is printed to STDOUT. That's the same as setting `-stdout` explicitly.

- `-outdir=<directory>` writes one `.mmd` file per mermaid block, creating the directory if it doesn't exist.

- `-out=<filename>` writes a single mermaid block to one file.

- When a file holds several mermaid blocks and you're writing to STDOUT or a single `-out` file, select one with `-index=<n>`, counting from 1.

- `-overwrite` will overwrite existing output files.

### Terraform

The `threatcl terraform` command is able to extract data resources from the `terraform show -json` output, you can read more about that [here](https://www.terraform.io/docs/cli/commands/show.html). This includes output of plan files, or active state files. The `threatcl terraform` command will then convert these into drafted `information_asset` blocks for inclusion in a `threatcl` HCL file.

If you're in a folder with existing state, you can execute the following:

```bash title="terminal"
terraform show -json | threatcl terraform -stdin
```

This will output something similar to this:

```bash title="terminal"
information_asset "aws_rds_cluster default" {
  description                = "cluster_identifier: aurora-cluster-demo, database_name: mydb"
  information_classification = ""
  source                     = "terraform state"
}
information_asset "aws_s3_bucket example" {
  description                = "bucket: terraform-20211107232017071500000001"
  information_classification = ""
  source                     = "terraform state"
}
```

You can also see similar output from a plan file that hasn't yet been applied with Terraform by running:

```bash
terraform show -json <plan-file> | threatcl terraform -stdin
```

If you want to update an existing `threatcl` threat model file ("threatmodel.hcl") you can with:

```bash title="terminal"
terraform show -json <plan> | threatcl terraform -stdin -add-to-existing=threatmodel.hcl > new-threatmodel.hcl
```

With the `-add-to-existing` flag, you can also specify a `-tm-name=<string>` if you need to specify a particular threat model from the source file, if there are multiple. And you can also apply a default classification with the `-default-classification=Confidential` flag.

#### Terraform options

- You specify the input either as a file argument, or via the STDIN with the `-stdin` flag. 

- Specify the default information classification of generated `information_asset` blocks with the `-default-classification` flag.

- If you want to output a modified HCL `threatcl` file, you can use the `-add-to-existing=<hcl file>` flag. If set, will add the generated information_assets into the provided file. This will not overwrite the provided file, instead it'll output an adjusted HCL file to STDOUT.

- If the provided HCL file contains multiple `threatmodel` blocks, you can use the `-tm-name=<string>` flag in addition to the `-add-to-existing` flag, to specify a particular threat model.

- The terraform resources that `threatcl terraform` is aware of are hard coded in [pkg/terraform.go](https://github.com/threatcl/threatcl/blob/main/pkg/terraform/terraform.go). If you want the `threatcl terraform` command to output other `information_asset` resources that aren't provided, you can supply your own version of this json via the `-tf-collection=<json file>` flag.

### Generate

The `threatcl generate` command is used to either output a generic `boilterplate` `threatcl` spec HCL file, or, interactively ask the user questions to then output a `threatcl` spec HCL file.

#### Generate Interactive

See the following example of:

```bash title="terminal"
threatcl generate interactive
```

![A walk through of generate interactive](../../../assets/hcltm.svg)

#### Generate Interactive Editor

If you prefer to work directly in your `$EDITOR` then run:

```bash title="terminal"
threatcl generate interactive editor
```

This will open your editor with a barebones HCL threat model. If you want to validate the model after creation, then use the `-validate` flag.

### MCP

The `threatcl mcp` command exposes a local [MCP](https://modelcontextprotocol.io/introduction) server so that you can interact with threatcl hcl files via an MCP Host, for instance AI/LLM applications such as [Claude Desktop](https://claude.ai/download), [Cursor](https://www.cursor.com/), or any other applications that support MCP. 

You don't typically start this in an interactive terminal, instead, you would add this to your MCP Host application's configuration.

#### MCP options

- You may specify an optional `-dir=<path>` flag that will expose additional MCP Tools into your environment. 

#### Claude Example Configuration

```json
{
    "mcpServers": {
        "threatcl": {
            "command": "/path/to/threatcl",
            "args": [
                "mcp",
                "-dir=/path/to/hcl-files"
            ]
        }
    }
}
```

### LSP

The `threatcl lsp` command runs a [Language Server](https://microsoft.github.io/language-server-protocol/) over stdio, giving any LSP-capable editor live intelligence for threatcl HCL files:

- **Diagnostics**: syntax errors, unknown blocks and attributes, missing required attributes, and invalid enum values (an unrecognised risk `likelihood`, say), pushed on every edit
- **Completion**: context-aware blocks, attributes and enum values, with block completions expanding to a snippet scaffold
- **Hover**: documentation for the block or attribute under the cursor
- **Document symbols**: an outline of the threat models, threats, controls, information assets and data flow diagrams in the file
- **Formatting**: canonical `hclwrite` formatting, suitable for format-on-save

Like the `mcp` command, you don't run this in a terminal yourself, your editor's LSP client launches it. The protocol travels over stdin/stdout, and logs go to stderr, or to a file with `-log=<file>`.

#### A note on `.hcl` files

The `.hcl` extension is shared with Terraform, Packer and other HCL dialects, so a plain `*.hcl` match will start both their language server and this one on the same buffer. The cleanest fix is to name threatcl files `*.tm.hcl` and match on that suffix, as the examples below do. Alternatively, scope the threatcl client so it only starts in your threat model projects.

#### Neovim (0.8+)

```lua
vim.api.nvim_create_autocmd({ "BufRead", "BufNewFile" }, {
  pattern = "*.tm.hcl",
  callback = function(args)
    vim.lsp.start({
      name = "threatcl",
      cmd = { "threatcl", "lsp" },
      root_dir = vim.fs.dirname(args.file),
    })
  end,
})
```

#### Helix

In `languages.toml`:

```toml
[language-server.threatcl]
command = "threatcl"
args = ["lsp"]

[[language]]
name = "threatcl"
scope = "source.hcl"
file-types = [{ glob = "*.tm.hcl" }]
roots = []
language-servers = ["threatcl"]
```

#### VS Code and Zed

Neither has a published extension yet. In the meantime, VS Code can use a generic LSP bridge extension pointed at `threatcl lsp` and scoped to `*.tm.hcl`; an early development version lives in the [editors folder](https://github.com/threatcl/threatcl/tree/main/editors) of the threatcl repo. A small Zed extension is the planned path there.

#### Known limitations

These are scoping decisions rather than bugs:

- `-config` doesn't affect the language server yet. The flag is accepted and validated, but diagnostics and completion use the built-in spec enum defaults rather than your overrides.
- Validations keyed on names rather than source positions (duplicate names, `information_asset_refs` existence, data flow diagram wiring) aren't surfaced as diagnostics. `threatcl validate` still catches them.
- The whole document is re-read on each change, which is comfortably fast at threat model sizes.
- No go-to-definition, references, rename or semantic tokens yet.

### Server (GraphQL API)

The `threatcl server` command starts a GraphQL API server that exposes your threat models via HTTP for programmatic querying and integration.

Once running, you can visit the GraphQL API Endpoint at `http://localhost:port/graphql`. Or, the GraphQL Playground at `http://localhost:port/`

For more detailed information, refer to:

- [GraphQL Overview](/graphql/overview/)
- [GraphQL Example Queries](/graphql/example-queries/)

#### Server options

- You must specify a directory path containing HCL (or JSON) threat model files with the `-dir=<path>` flag

- Optionally you can set the listening TCP port with `-port=<number>`. By default it will listen on `8080`

- The server binds to `127.0.0.1` by default. It exposes every loaded threat model without authentication, so only change this deliberately. `-listen=0.0.0.0` will serve that data on all interfaces.

- Optionally you can also enable Watching for file changes, and reloading the cache. This is not enabled by default, to enable it, set the `-watch` flag.

### Query (GraphQL)

The `threatcl query` command runs a GraphQL query against your threat models and prints the result, without starting a server. It loads the same data `threatcl server` does, so anything you can ask the API you can ask here. This is useful in a script or a CI job.

```bash title="terminal"
$ threatcl query -dir ./models -query '{ stats { totalThreatModels totalThreats threatsWithRisk } }'
{
  "data": {
    "stats": {
      "threatsWithRisk": 2,
      "totalThreatModels": 2,
      "totalThreats": 3
    }
  },
  "errors": null
}
```

The query itself can come from three places, in order of precedence: the `-query` flag, a file named with `-file`, or STDIN when neither is set.

```bash title="terminal"
$ echo '{ threatModels { name author } }' | threatcl query -dir ./models -output compact
{"data":{"threatModels":[{"name":"Payments","author":"@xntrik"}]},"errors":null}
```

Variables are passed as JSON:

```bash title="terminal"
$ threatcl query -dir ./models -output compact \
    -query 'query TM($name: String!) { threatModel(name: $name) { name author } }' \
    -vars '{"name":"Payments"}'
{"data":{"threatModel":{"author":"@xntrik","name":"Payments"}},"errors":null}
```

#### Query options

- You must specify a directory of HCL (or JSON) threat model files with `-dir=<path>`

- `-query=<string>` is an inline GraphQL query. Mutually exclusive with `-file`

- `-file=<path>` reads the query from a file. Mutually exclusive with `-query`

- `-vars=<json>` supplies JSON-encoded variables for the query

- `-output=<format>` is one of `pretty` (the default), `json`, or `compact`

- `-examples` prints a set of example invocations

For the schema itself, the types, fields and filters you can query, see the [GraphQL Overview](/graphql/overview/) and [Example Queries](/graphql/example-queries/).
