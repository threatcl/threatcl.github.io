---
title: Threatcl GraphQL API
---

The threatcl GraphQL API provides a powerful, flexible way to query and analyze your threat models. The API is served by the `threatcl server` command and exposes all threat model data through a type-safe GraphQL interface.

The same schema is available without a server: [`threatcl query`](/threatcl/usage/#query-graphql) runs a single query against a directory of threat models and prints the result, which suits scripts and CI jobs.

## Getting Started

### Starting the Server

```bash title="terminal"
# Basic usage
threatcl server -dir ./examples

# With custom port
threatcl server -dir ./examples -port 3000

# With file watching for auto-reload
threatcl server -dir ./examples -watch
```

The server binds to `127.0.0.1` by default. It serves every loaded threat model without authentication, so expose it on other interfaces (`-listen=0.0.0.0`) only deliberately.

### Accessing the API

- GraphQL Playground: `http://localhost:8080/`
- GraphQL Endpoint: `http://localhost:8080/graphql`
- Health Check: `http://localhost:8080/health`

## Schema Overview

The GraphQL schema is organized around the following main types:

- `ThreatModel` - Complete threat model with all associated data
- `Threat` - Individual threats within a threat model
- `Control` - Security controls (mitigations) for threats
- `InformationAsset` - Data assets being protected
- `RiskRating` - Optional risk rating attached to a threat, with inherent and residual scores
- `DataFlowDiagram` - Data flow diagrams (DFDs) for visualizing system architecture
- `MermaidDiagram` - Free-form mermaid diagrams embedded in a threat model
- `Statistics` - Aggregated statistics across all threat models

## Query Reference

### Root Queries

#### `threatModels`

Retrieve all threat models, optionally filtered by criteria.

**Signature:**
```graphql
threatModels(filter: ThreatModelFilter): [ThreatModel!]!
```

**Arguments:**
- `filter` (optional): Filter criteria
  - `author`: String - Filter by author
  - `internetFacing`: Boolean - Filter by internet-facing attribute
  - `newInitiative`: Boolean - Filter by new initiative attribute
  - `initiativeSize`: String - Filter by initiative size (e.g., "Small", "Medium", "Large")

**Example:**
```graphql
query {
  threatModels(filter: { internetFacing: true }) {
    name
    author
    attributes {
      internetFacing
      initiativeSize
    }
  }
}
```

#### `threatModel`

Retrieve a single threat model by name.

**Signature:**
```graphql
threatModel(name: String!): ThreatModel
```

**Arguments:**
- `name` (required): The exact name of the threat model

**Returns:** `ThreatModel` or `null` if not found

**Example:**
```graphql
query {
  threatModel(name: "Tower of London") {
    name
    author
    description
    threats {
      description
      impacts
    }
  }
}
```

#### `threats`

Search for threats across all threat models, optionally filtered.

**Signature:**
```graphql
threats(filter: ThreatFilter): [Threat!]!
```

**Arguments:**
- `filter` (optional): Filter criteria
  - `name`: String - Filter by threat name
  - `impacts`: [String!] - Filter by impact types (e.g., ["Confidentiality", "Integrity"])
  - `stride`: [String!] - Filter by STRIDE categories (e.g., ["Spoofing", "Tampering"])
  - `hasImplementedControls`: Boolean - Filter threats with/without implemented controls
  - `severity`: [String!] - Filter by resolved inherent severity (`info`, `low`, `medium`, `high`, `critical`)

**Example:**
```graphql
query {
  threats(filter: { stride: ["Spoofing", "Elevation Of Privilege"] }) {
    description
    stride
    impacts
    controls {
      name
      implemented
    }
  }
}
```

#### `informationAssets`

Retrieve all information assets, optionally filtered by classification.

**Signature:**
```graphql
informationAssets(classification: String): [InformationAsset!]!
```

**Arguments:**
- `classification` (optional): Filter by information classification (e.g., "Confidential", "Restricted", "Public")

**Example:**
```graphql
query {
  informationAssets(classification: "Confidential") {
    name
    description
    informationClassification
    threatModel {
      name
    }
  }
}
```

#### `stats`

Get aggregated statistics across all threat models.

**Signature:**
```graphql
stats: Statistics!
```

**Example:**
```graphql
query {
  stats {
    totalThreatModels
    totalThreats
    totalInformationAssets
    totalControls
    implementedControls
    averageRiskReduction
    threatsWithRisk
    severityCounts {
      severity
      count
    }
  }
}
```

## Type Reference

### ThreatModel

Represents a complete threat model.

**Fields:**
```graphql
type ThreatModel {
  name: String!
  author: String!
  description: String
  link: String
  diagramLink: String
  repository: [String!]
  createdAt: Int
  updatedAt: Int
  attributes: Attributes
  additionalAttributes: [AdditionalAttribute!]
  informationAssets: [InformationAsset!]!
  threats: [Threat!]!
  useCases: [UseCase!]!
  exclusions: [Exclusion!]!
  thirdPartyDependencies: [ThirdPartyDependency!]!
  dataFlowDiagrams: [DataFlowDiagram!]!
  mermaidDiagrams: [MermaidDiagram!]!
  sourceFile: String!
}
```

`repository` holds the model's [repository](/specification/threatmodel/#repository) URLs, and `sourceFile` is the file the model was loaded from.

### Attributes

Standard threat model attributes.

**Fields:**
```graphql
type Attributes {
  newInitiative: Boolean
  internetFacing: Boolean
  initiativeSize: String
}
```

### Threat

Represents a security threat.

**Fields:**
```graphql
type Threat {
  name: String!
  description: String!
  impacts: [String!]
  stride: [String!]
  controls: [Control!]!
  informationAssetRefs: [String!]
  risk: RiskRating
  threatModel: ThreatModel!
}
```

**Bidirectional Reference:**
- `threatModel` field provides reverse navigation to the parent threat model

### RiskRating

The optional [risk rating](/specification/threatmodel/#risk) attached to a threat. `risk` is `null` for threats with no `risk` block.

**Fields:**
```graphql
type RiskRating {
  likelihood: String!
  impact: String!
  severity: String!
  rationale: String
  inherentScore: Float!
  residualScore: Float!
  residualSeverity: String!
  residualRiskReduction: Float!
}
```

- `likelihood` and `impact` are the ordinal enums: `very_low`, `low`, `medium`, `high`, `very_high`
- `severity` is the resolved inherent band: the author's override if set, otherwise computed from the likelihood x impact matrix
- `inherentScore` is the pre-control score, on a 0-100 scale
- `residualScore` is that score after the risk reduction of every implemented control, with `residualSeverity` its band and `residualRiskReduction` the aggregate percentage reduction

**Example:**
```graphql
query {
  threats(filter: { severity: ["critical", "high"] }) {
    name
    risk {
      severity
      inherentScore
      residualScore
      residualSeverity
      residualRiskReduction
    }
    threatModel {
      name
    }
  }
}
```

### Control

Security control or mitigation for a threat.

**Fields:**
```graphql
type Control {
  name: String!
  description: String!
  implemented: Boolean!
  implementationNotes: String
  riskReduction: Int
  attributes: [ControlAttribute!]
}
```

### InformationAsset

Data or information being protected.

**Fields:**
```graphql
type InformationAsset {
  name: String!
  description: String
  informationClassification: String!
  source: String
  threatModel: ThreatModel!
}
```

**Bidirectional Reference:**
- `threatModel` field provides reverse navigation to the parent threat model

### DataFlowDiagram

Data flow diagram representing system architecture.

**Fields:**
```graphql
type DataFlowDiagram {
  name: String!
  processes: [Process!]!
  dataStores: [DataStore!]!
  externalElements: [ExternalElement!]!
  flows: [Flow!]!
  trustZones: [TrustZone!]!
}
```

The element lists include elements nested inside trust zones, and each element's `trustZone` field names the zone it sits in.

**Fields:**
```graphql
type Process {
  name: String!
  trustZone: String
}

type DataStore {
  name: String!
  trustZone: String
  informationAsset: String
}

type ExternalElement {
  name: String!
  trustZone: String
}

type Flow {
  name: String!
  from: String!
  to: String!
}

type TrustZone {
  name: String!
}
```

### MermaidDiagram

A free-form [mermaid diagram](/specification/threatmodel/#mermaid) embedded in a threat model. `content` is the raw mermaid source, exactly as authored.

**Fields:**
```graphql
type MermaidDiagram {
  name: String!
  description: String
  content: String!
}
```

### Statistics

Aggregated statistics across all threat models.

**Fields:**
```graphql
type Statistics {
  totalThreatModels: Int!
  totalThreats: Int!
  totalInformationAssets: Int!
  totalControls: Int!
  implementedControls: Int!
  averageRiskReduction: Float
  threatsWithRisk: Int!
  severityCounts: [SeverityCount!]!
}
```

**Calculations:**
- `averageRiskReduction` is only calculated when controls have risk reduction values > 0
- Returns `null` if no controls have risk reduction values
- `threatsWithRisk` counts the threats carrying a [risk](/specification/threatmodel/#risk) block
- `severityCounts` buckets those threats by resolved inherent severity, and always returns all five bands, including the empty ones

### SeverityCount

The number of threats whose resolved inherent severity falls in a given band.

**Fields:**
```graphql
type SeverityCount {
  severity: String!
  count: Int!
}
```

### Supporting Types

The remaining types on a threat model: its use cases, exclusions, third party dependencies, and the custom attributes on a model or a control.

**Fields:**
```graphql
type UseCase {
  description: String!
}

type Exclusion {
  description: String!
}

type ThirdPartyDependency {
  name: String!
  description: String!
  saas: Boolean
  payingCustomer: Boolean
  openSource: Boolean
  infrastructure: Boolean
  uptimeDependency: String!
  uptimeNotes: String
}

type AdditionalAttribute {
  key: String!
  value: String!
}

type ControlAttribute {
  name: String!
  value: String!
}
```

### Input Types

Filters accepted by the `threatModels` and `threats` queries.

**Fields:**
```graphql
input ThreatModelFilter {
  author: String
  internetFacing: Boolean
  newInitiative: Boolean
  initiativeSize: String
}

input ThreatFilter {
  name: String
  impacts: [String!]
  stride: [String!]
  hasImplementedControls: Boolean
  severity: [String!]
}
```

## Advanced Query Examples

### Complete Threat Model with All Nested Data

```graphql
query {
  threatModel(name: "My Application") {
    name
    author
    description
    repository
    createdAt
    updatedAt
    sourceFile

    attributes {
      newInitiative
      internetFacing
      initiativeSize
    }

    informationAssets {
      name
      informationClassification
      description
    }

    threats {
      name
      description
      impacts
      stride
      risk {
        likelihood
        impact
        severity
        inherentScore
        residualScore
        residualSeverity
      }
      controls {
        name
        description
        implemented
        implementationNotes
        riskReduction
      }
    }

    useCases {
      description
    }

    exclusions {
      description
    }

    thirdPartyDependencies {
      name
      description
      saas
      openSource
      uptimeDependency
    }

    dataFlowDiagrams {
      name
      processes {
        name
        trustZone
      }
      dataStores {
        name
        trustZone
        informationAsset
      }
      flows {
        name
        from
        to
      }
      trustZones {
        name
      }
    }

    mermaidDiagrams {
      name
      description
      content
    }
  }
}
```

### Filtering by Multiple Criteria

```graphql
query {
  # Internet-facing large initiatives
  largeFacingInternet: threatModels(filter: {
    internetFacing: true
    initiativeSize: "Large"
  }) {
    name
    author
  }

  # Threats with specific STRIDE categories
  authThreats: threats(filter: {
    stride: ["Spoofing", "Elevation Of Privilege"]
  }) {
    description
    threatModel {
      name
    }
  }

  # Confidential assets
  confidentialAssets: informationAssets(classification: "Confidential") {
    name
    threatModel {
      name
    }
  }
}
```

### Threat Models with Unimplemented Controls

```graphql
query {
  threatModels {
    name
    threats {
      description
      controls {
        name
        implemented
        riskReduction
      }
    }
  }
}
```

Then filter client-side for `implemented: false`.

### Statistics Dashboard

```graphql
query DashboardStats {
  stats {
    totalThreatModels
    totalThreats
    totalInformationAssets
    totalControls
    implementedControls
    averageRiskReduction
    threatsWithRisk
    severityCounts {
      severity
      count
    }
  }

  allModels: threatModels {
    name
    threats {
      description
      controls {
        implemented
      }
    }
  }
}
```

## Integration Examples

### cURL

```bash title="terminal"
# Query statistics
curl -X POST http://localhost:8080/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ stats { totalThreatModels totalThreats } }"}'

# Query specific threat model
curl -X POST http://localhost:8080/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ threatModel(name: \"Tower of London\") { name author } }"}'
```

### JavaScript/Node.js

```javascript
const fetch = require('node-fetch');

async function queryThreatModels() {
  const query = `
    query {
      threatModels {
        name
        author
        threats {
          description
        }
      }
    }
  `;

  const response = await fetch('http://localhost:8080/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query })
  });

  const data = await response.json();
  console.log(JSON.stringify(data, null, 2));
}

queryThreatModels();
```

### Python

```python
import requests

def query_stats():
    query = """
    query {
      stats {
        totalThreatModels
        totalThreats
        implementedControls
      }
    }
    """

    response = requests.post(
        'http://localhost:8080/graphql',
        json={'query': query}
    )

    print(response.json())

query_stats()
```

### Go

```go
package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
)

type GraphQLRequest struct {
	Query string `json:"query"`
}

func main() {
	query := `{ threatModels { name author } }`

	reqBody, _ := json.Marshal(GraphQLRequest{Query: query})

	resp, err := http.Post(
		"http://localhost:8080/graphql",
		"application/json",
		bytes.NewBuffer(reqBody),
	)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()

	var result map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&result)

	fmt.Println(result)
}
```

## File Watching

When the server is started with the `-watch` flag, it monitors the threat model directory for changes:

**Monitored Events:**
- File created (`.hcl`, `.json`)
- File modified (`.hcl`, `.json`)
- File deleted
- File renamed

**Behavior:**
- Changes are detected in real-time
- Cache is automatically updated
- No server restart required
- All active GraphQL connections continue to work
- Subsequent queries reflect the latest data

**Example Output:**
```
File modified: examples/tm1.hcl - reloading...
Successfully reloaded examples/tm1.hcl (6 threat models loaded)
```

## Best Practices

### Query Optimization

1. **Request Only What You Need**: GraphQL allows you to specify exactly which fields to return. Avoid over-fetching by requesting only the data you need.

2. **Use Filters**: Filter data at the server level rather than fetching everything and filtering client-side.

3. **Avoid Deep Nesting**: While the API supports deep nesting, excessive nesting can impact performance.

### Error Handling

GraphQL returns errors in a structured format:

```json
{
  "errors": [
    {
      "message": "Error message here",
      "path": ["fieldName"]
    }
  ],
  "data": null
}
```

Always check for the `errors` field in responses.

### CORS

The server is configured to allow requests from any origin (`*`). For production use, consider restricting CORS origins.

## Limitations

- **Read-Only**: The current API only supports queries. Mutations (create, update, delete) are not yet implemented.
- **No Subscriptions**: Real-time updates via GraphQL subscriptions are not supported. Use file watching (`-watch` flag) for auto-reload instead.
- **No Pagination**: Large result sets are returned in full. Consider filtering to reduce response size.
- **In-Memory Only**: All data is stored in memory. Server restart clears the cache and reloads from files.
- **Partial DFD Coverage**: A data flow's optional `protocol` attribute isn't exposed by the `Flow` type yet.

## Troubleshooting

### Server Won't Start

**Error**: Port already in use
```
Solution: Use a different port with -port flag
```

**Error**: Directory not found
```
Solution: Verify the -dir path exists and contains .hcl or .json files
```

### Query Returns Empty Results

- Verify threat models are loaded: Check server startup output for "Loaded X threat model(s)"
- Check the health endpoint: `http://localhost:8080/health`
- Verify filter criteria: Remove filters to see if data exists
- Check threat model names: Names are case-sensitive

### File Watching Not Working

- Ensure `-watch` flag is specified
- Verify file extensions are `.hcl` or `.json`
- Check file is in the watched directory or subdirectories
- Review server console output for error messages
