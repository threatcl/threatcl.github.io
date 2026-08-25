---
title: Libraries
---

Threatcl Cloud provides three shared libraries at the organization level: **threats**, **controls** and **information assets**. Libraries let your team define reusable items once, then reference them from any threat model with a [`ref`](/specification/threatmodel/#ref) attribute, instead of copying the text into every model.

Every `cloud library` subcommand accepts `-org-id` to pick an organization and `-json` for machine-readable output. The subcommands that take an id or reference id take it as a positional argument, and any flags must come before it.

## Library file format

A library file is not a threat model. It uses its own format: a `library_metadata` block, followed by up to three library sections.

```hcl title="my-library.hcl"
library_metadata {
  version       = "1.0.0"
  organization  = "my-org-slug"
  export_date   = "2026-05-30T12:34:56Z"
  export_source = "threatcl-cli"
}

threat_library {
  folder "API Threats" {
    description = "Common threats targeting APIs and backend services"

    threat "API Key Leakage" {
      reference_id         = "TCL-T-APIS-KEYLEAK"
      status               = "published"
      version              = "1.0.0"
      description          = "API keys or tokens are exposed in client-side code, version control, URLs, logs, or error messages."
      impacts              = ["Confidentiality"]
      stride               = ["Information Disclosure"]
      severity             = "high"
      likelihood           = "high"
      cwe_ids              = ["CWE-200", "CWE-532"]
      mitre_attack_ids     = ["T1552"]
      tags                 = ["api", "secrets", "credentials"]
      recommended_controls = ["TCL-C-APIS-APIKEYMGMT"]
    }
  }
}

control_library {
  control "API Key Management" {
    reference_id            = "TCL-C-APIS-APIKEYMGMT"
    status                  = "published"
    description             = "Implement a secure API key lifecycle: generation, hashed storage, scoped permissions, expiration, rotation and revocation."
    control_type            = "preventive"
    control_category        = "technical"
    implementation_guidance = "Generate keys using a CSPRNG with 256 bits of entropy. Hash before storage. Provide instant revocation."
    effectiveness_rating    = 85
    nist_controls           = ["IA-5", "AC-3"]
    tags                    = ["api", "credentials"]
    mitigates_threats       = ["TCL-T-APIS-KEYLEAK"]
    default_risk_reduction  = 75
  }
}

information_asset_library {
  information_asset "User PII Records" {
    reference_id               = "IA-UDATA"
    status                     = "published"
    description                = "Email, name and phone collected at signup"
    information_classification = "Confidential"
    source                     = "user_signup_form"
  }
}
```

Items may sit directly in a library section, or inside a `folder` block, and folders can nest. The block label is the item's name.

A few things worth knowing:

- **`reference_id` is what makes an item updatable.** Without one, an item can't be matched on re-import, so `-mode=update` will create a duplicate rather than update it. It's also the value you put in a model's [`ref`](/specification/threatmodel/#ref) attribute.
- **`status`** is `draft` (the default), `published`, `archived` or `deprecated`.
- **`version`** is semver. Use `1.0.0` when creating an item; the server bumps it on update.
- **`description`** is required for threats and controls, but optional for information assets.
- **Cross-references use reference ids.** A threat's `recommended_controls` and a control's `mitigates_threats` name controls and threats by their `reference_id`.

The most reliable way to see the format your organization is running is to export what you already have:

```bash title="terminal"
$ threatcl cloud library export > my-library.hcl
```

## Importing a Library

The `cloud library import` command imports library items from a local HCL file into Threatcl Cloud. The file must have a `.hcl` extension and be no larger than 10MB, and uses the [library file format](#library-file-format) rather than the threat model spec.

```bash title="terminal"
$ threatcl cloud library import my-library.hcl
```

#### Import options

- `-mode` (or `-m`): controls how imports are handled:
  - `create-only`: only create new items, skip items that already exist (default)
  - `update`: create new items and update existing items
  - `replace`: replace all existing library items with the contents of the file
- `-org-id`: the organization to import into
- `-json`: output the import results as JSON

```bash title="terminal"
$ threatcl cloud library import -mode=update my-library.hcl
Imported 12 threats and 8 controls
  Created: 5 threats, 3 controls
  Updated: 7 threats, 5 controls
```

## Exporting a Library

The `cloud library export` command exports your organization's threat, control and information asset libraries as HCL.

```bash title="terminal"
$ threatcl cloud library export > my-library.hcl

$ threatcl cloud library export -type=threats -status=PUBLISHED -o threats.hcl
```

This is useful for backing up your library, sharing it across organizations, or version-controlling it in Git. Exporting and re-importing is also how you promote a library between organizations.

#### Export options

- `-output` (or `-o`): the file to write to. Defaults to STDOUT
- `-type`: limit to one library: `threats`, `controls` or `information-assets`. Defaults to all three
- `-status`: filter by status, such as `PUBLISHED` or `DRAFT`
- `-folder`: filter by folder path
- `-tags`: comma-separated tag filter, for example `-tags=owasp,injection`
- `-include-drafts`: include draft items
- `-include-deprecated`: include deprecated items
- `-org-id`: the organization to export from

## Listing Threats

The `cloud library threats` command lists all threat items in your organization's library.

```bash title="terminal"
$ threatcl cloud library threats
====================================================================================================
  Threat Library Items
====================================================================================================

Found 3 threat(s):

REF ID          NAME                                STATUS       SEVERITY     USAGE
----------------------------------------------------------------------------------------------------
T-SQLI          SQL Injection                       PUBLISHED    critical     3
T-TEST          Test                                PUBLISHED                 0
T-TESTER        Tester                              PUBLISHED                 0
```

#### Threats options

- `-folder`: filter by folder ID
- `-status`: filter by status: `DRAFT`, `PUBLISHED`, `ARCHIVED` or `DEPRECATED`
- `-severity`: filter by severity level
- `-stride`: filter by STRIDE categories, comma-separated
- `-tags`: filter by tags, comma-separated
- `-search`: free-text search

## Viewing a Threat

The `cloud library threat` command displays details for a specific threat library item, by its ID.

```bash title="terminal"
$ threatcl cloud library threat 9c0e24fe-bf12-42b6-b44a-2c5ce6484e61
```

### Querying by Reference ID

The `cloud library threat-ref` command looks up a threat by its reference ID instead. That's the human-readable identifier shown in the REF ID column, and the value you put in a threat's `ref` attribute.

```bash title="terminal"
$ threatcl cloud library threat-ref T-SQLI
```

## Listing Controls

The `cloud library controls` command lists all control items in your organization's library.

```bash title="terminal"
$ threatcl cloud library controls
====================================================================================================
  Control Library Items
====================================================================================================

Found 5 control(s):

REF ID          NAME                                STATUS       TYPE            USAGE
----------------------------------------------------------------------------------------------------
C-CDN           CDN                                 DRAFT        preventive      1
C-INPUTVALID    Input validation                    PUBLISHED    preventive      0
C-OUTPUT        Output Encoding                     PUBLISHED    corrective      1
C-PQUERY        Parameterized Queries               PUBLISHED    preventive      3
C-a5c9fe8a      Strong Auditing                     PUBLISHED    detective       1
```

#### Controls options

- `-folder`: filter by folder ID
- `-status`: filter by status: `DRAFT`, `PUBLISHED`, `ARCHIVED` or `DEPRECATED`
- `-type`: filter by control type, such as `Preventive`, `Detective` or `Corrective`
- `-category`: filter by control category
- `-tags`: filter by tags, comma-separated
- `-search`: free-text search

## Viewing a Control

The `cloud library control` command displays details for a specific control library item, by its ID.

```bash title="terminal"
$ threatcl cloud library control 4b6bdaf3-6a92-42f7-8edf-fe4e285151a6
```

### Querying by Reference ID

The `cloud library control-ref` command looks up a control by its reference ID.

```bash title="terminal"
$ threatcl cloud library control-ref C-PQUERY
```

## Information Assets

The information asset library works the same way as the threat and control libraries. `cloud library assets` lists the items, `cloud library asset <id>` displays one by ID, and `cloud library asset-ref <reference-id>` looks one up by its reference ID.

```bash title="terminal"
$ threatcl cloud library assets -status=PUBLISHED -classification=Confidential

$ threatcl cloud library asset-ref IA-UDATA
```

#### Assets options

- `-folder`: filter by folder ID
- `-status`: filter by status: `DRAFT`, `PUBLISHED`, `ARCHIVED` or `DEPRECATED`
- `-classification`: filter by information classification, such as `Confidential` or `Restricted`
- `-search`: free-text search across name and description

## Library Folders

Library items can be organized into folders for better structure.

Folders can be filtered by type with `-type=THREAT` or `-type=CONTROL`.

### Listing Folders

```bash title="terminal"
$ threatcl cloud library folders
================================================================================
  Library Folders
================================================================================

Found 2 folder(s):

ID                                   NAME
--------------------------------------------------------------------------------
eb1411f3-cf4e-4ddc-b2ff-56720b58437d Test Control Folder
4a70fc28-9bb7-414f-92c3-9507977b3062 Test Threat Folder
```

### Viewing a Folder

```bash title="terminal"
$ threatcl cloud library folder eb1411f3-cf4e-4ddc-b2ff-56720b58437d
```

## Library Statistics

The `cloud library stats` command displays statistics about your organization's library.

```bash title="terminal"
$ threatcl cloud library stats
============================================================
  Library Usage Statistics
============================================================

Overview:
  Total Threats:      3 (3 published)
  Total Controls:     5 (4 published)

Most Used Threats:
  1. SQL Injection                          - used in 3 model(s)

Most Used Controls:
  1. Parameterized Queries                  - used in 3 model(s)
  2. CDN                                    - used in 1 model(s)
  3. Strong Auditing                        - used in 1 model(s)
  4. Output Encoding                        - used in 1 model(s)
```
