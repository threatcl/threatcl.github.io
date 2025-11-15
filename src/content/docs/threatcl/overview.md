---
title: Threatcl Overview
description: Threat modelling with hcl
---

## What happened to hcltm?

hcltm has been renamed to `threatcl`. Welcome!

## What is threatcl?

There are many different ways in which a threat model can be documented. From a simple text file, to more in-depth word documents, to fully instrumented threat models in a centralised solution. Two of the most valuable attributes of a threat model are:

1. Being able to clearly document the threats; and
2. To be able to drive valuable change. 

`threatcl` aims to provide a Git/Dev-Ops first approach to documenting a [system threat model](https://owasp.org/www-community/Threat_Modeling) by focusing on the following goals:

* Simple text-file format
* Simple cli-driven user experience
* Integration into version control systems (VCS)

There are two parts to `threatcl`:

1. The `threatcl` [cli software](https://github.com/threatcl/threatcl); and
2. The `threatcl` [spec](https://github.com/threatcl/threatcl/blob/main/spec.hcl), which is based on [HCL2](https://github.com/hashicorp/hcl/tree/hcl2), HashiCorp's Configuration Language.

The motivation behind HCL is to be

> pleasant to read and write for humans, and a JSON-based variant that is easier for machines to generate and parse.

The `threatcl` spec lives at [github.com/threatcl/spec](https://github.com/threatcl/spec).

Combining the `threatcl` cli software and the `threatcl` spec allows practitioners to define a system threat model in HCL, for example:

### Example threat model

```hcl
// threatmodel.hcl
threatmodel "Tower of London" {
  description = "A historic castle"
  author = "@xntrik"

  attributes {
    new_initiative = "true"
    internet_facing = "true"
    initiative_size = "Small"
  }

  information_asset "crown jewels" {
    description = "including the imperial state crown"
    information_classification = "Confidential"
  }

  usecase {
    description = "The Queen can fetch the crown"
  }

  third_party_dependency "community watch" {
    description = "The community watch helps guard the premise"
    uptime_dependency = "degraded"
  }

  threat {
    description = "Someone who isn't the Queen steals the crown"
    impacts = ["Confidentiality"]

    expanded_control "Guards" {
      description = "Trained guards patrol tower"
      risk_reduction = 75
    }
  }
}
```

Using `threatcl` we can then:

* Validate that this meets the spec
* List all the threat models within a set of folders
* View threat models
* Generate a dashboard and a set of HTML, Markdown, or arbitrary other files of all the threat models - for publishing
* Export this to JSON or [OTM](https://github.com/IriusRisk/OpenThreatModel).
* Enrich your information assets from [Terraform](https://www.terraform.io/).
* Run an MCP Server to help LLM Hosts to navigate how to generate, validate, and export DFDs from threat models
* Run a GraphQL API to interact with all your threat models in highly advanced ways.

## Further reading

The rest of this section will discuss the various sub-commands available with the `threatcl` software, while the next section focuses on the `threatcl spec`.
