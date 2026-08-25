---
title: Searching Threat Models
---

The `cloud search` command lets you search across all threat models in your organization. You can search for threats or controls, and filter results by various criteria.

## Basic Usage

```bash title="terminal"
$ threatcl cloud search -type=threats
```

## Searching Threats

Search for threats across all threat models in your organization:

```bash title="terminal"
$ threatcl cloud search -type=threats
============================================================
  Threatcl Cloud - Threat Search Results
  Filters: all
============================================================

Found 29 threat(s) over 11 threatmodel(s) in 5 org(s):

Threat: Crown Theft
  ID:          fff90c94-e5fd-4f86-8605-92209ff24286
  Description: Someone who isn't the Queen steals the crown
  Impacts:     Confidentiality

  Threat Model:
    Name:     New
    ID:       fad8d654-3090-4346-9474-51d3fa565ff9
    Status:   draft
    Version:  1.0.1
    Org Name: My Workspace
    Org ID:   fc4e97e4-e484-4b35-a9c3-1f8b9d0993b9
```

### Filtering threats

- `-impacts`: filter by impact types (comma-separated)

```bash title="terminal"
$ threatcl cloud search -type=threats -impacts=Confidentiality,Integrity
```

- `-stride`: filter by STRIDE categories (comma-separated)

```bash title="terminal"
$ threatcl cloud search -type=threats -stride=Spoofing,Tampering
```

- `-has-controls`: filter threats that have (or don't have) controls

```bash title="terminal"
# Threats with controls
$ threatcl cloud search -type=threats -has-controls

# Threats without controls
$ threatcl cloud search -type=threats -has-controls=false
```

## Searching Controls

Search for controls across all threat models:

```bash title="terminal"
$ threatcl cloud search -type=controls
============================================================
  Threatcl Cloud - Control Search Results
  Filters: all
============================================================

Found 55 control(s) over 11 threatmodel(s) in 5 org(s):

Control: AWS Orgs
  ID:          8b87eccc-dda6-4ba0-828a-f1bd4ae33e84
  Description: AWS accounts are managed with AWS Organisations
  Implemented: true

  Threat Model:
    Name:     Upload
    ID:       b064ec8e-9e94-4890-b46b-18cd059d132d
    Status:   draft
    Version:  1.0.0
    Org Name: My Workspace
    Org ID:   fc4e97e4-e484-4b35-a9c3-1f8b9d0993b9
```

### Filtering controls

- `-implemented`: filter by implementation status

```bash title="terminal"
# Only implemented controls
$ threatcl cloud search -type=controls -implemented

# Only unimplemented controls
$ threatcl cloud search -type=controls -implemented=false
```

### Free-text search

- `-term`: match on name and description, case-insensitive. Works for both threats and controls

```bash title="terminal"
$ threatcl cloud search -type=controls -term=encryption
```

## Scoping

By default, search operates across all threat models in your default organization. You can scope the search further:

- `-threatmodel-id`: search within a specific threat model

```bash title="terminal"
$ threatcl cloud search -type=threats -threatmodel-id=tm_abc123
```

- `-org-id`: search within a specific organization (if you belong to multiple)

```bash title="terminal"
$ threatcl cloud search -type=threats -org-id=org_xyz789
```

## Combining Filters

Filters can be combined to narrow results:

```bash title="terminal"
$ threatcl cloud search -type=threats \
    -stride=Spoofing \
    -impacts=Confidentiality \
    -has-controls=false
```

This searches for spoofing threats that impact confidentiality and have no controls defined.
