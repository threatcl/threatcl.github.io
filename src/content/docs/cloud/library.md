---
title: Threat & Control Libraries
---

Threatcl Cloud provides shared threat and control libraries at the organization level. Libraries let your team define reusable threats and controls that can be referenced across multiple threat models.

## Importing a Library

The `cloud library import` command imports threats and controls from a local HCL library file into Threatcl Cloud.

```bash title="terminal"
$ threatcl cloud library import my-library.hcl
```

#### Import options

- `-mode`: controls how imports are handled:
  - `create-only`: only create new items, skip items that already exist (default)
  - `update`: create new items and update existing items
  - `replace`: replace all existing library items with the contents of the file
- `-json`: output the import results as JSON

```bash title="terminal"
$ threatcl cloud library import -mode=update my-library.hcl
Imported 12 threats and 8 controls
  Created: 5 threats, 3 controls
  Updated: 7 threats, 5 controls
```

## Exporting a Library

The `cloud library export` command exports your organization's library as an HCL file.

```bash title="terminal"
$ threatcl cloud library export > my-library.hcl
```

This is useful for backing up your library, sharing it across organizations, or version-controlling it in Git.

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

## Viewing a Threat

The `cloud library threat` command displays details for a specific threat library item.

```bash title="terminal"
$ threatcl cloud library threat LIB-T-001
```

### Querying by Reference ID

The `cloud library threat-ref` command looks up a threat by its reference ID.

```bash title="terminal"
$ threatcl cloud library threat-ref LIB-T-001
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

## Viewing a Control

The `cloud library control` command displays details for a specific control library item.

```bash title="terminal"
$ threatcl cloud library control LIB-C-001
```

### Querying by Reference ID

The `cloud library control-ref` command looks up a control by its reference ID.

```bash title="terminal"
$ threatcl cloud library control-ref LIB-C-001
```

## Library Folders

Library items can be organized into folders for better structure.

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
