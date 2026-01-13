---
sidebar_position: 5
---

# Search Engines

Search engines like Lucenia, OpenSearch, and Elasticsearch execute custom scoring scripts that need sandboxing.

## The Problem

Search engines allow users to provide custom scoring expressions or scripts:

- Scripts in Lucenia and OpenSearch/Elasticsearch
- Custom scorers in Lucene
- User-defined functions for ranking

Without sandboxing, these scripts can:

- Access arbitrary files
- Make network calls
- Execute malicious code

## The Solution

jGuard restricts script execution to safe operations:

```text
security module custom.scoring {
    // Read index data only
    entitle module to fs.read(index, "**");

    // System properties for numeric operations
    entitle module to system.property.read("java.lang.*");

    // No network
    // No file writes
    // No threads
    // No native code
}
```

## Architecture

```
┌────────────────────────────────────────────────────┐
│ Search Engine                                      │
│                                                    │
│  ┌────────────────┐                                │
│  │ Query Parser   │                                │
│  └───────┬────────┘                                │
│          │                                         │
│          ▼                                         │
│  ┌────────────────┐    ┌──────────────────┐        │
│  │ Script Engine  │───▶│ Custom Scorer    │        │
│  │                │    │ (sandboxed)      │        │
│  │ jGuard policy  │    │ • fs.read only   │        │
│  │ enforced       │    │ • no network     │        │
│  └────────────────┘    └──────────────────┘        │
│          │                                         │
│          ▼                                         │
│  ┌────────────────┐                                │
│  │ Results        │                                │
│  └────────────────┘                                │
└────────────────────────────────────────────────────┘
```

## Example: Lucene Custom Scorer

### Policy

```text
security module com.example.search.scoring {
    // Read index segments
    entitle module to fs.read(index, "**/_*.cfs");
    entitle module to fs.read(index, "**/_*.cfe");
    entitle module to fs.read(index, "**/segments_*");

    // System properties for math operations
    entitle module to system.property.read;

    // Strictly no:
    // - network.outbound
    // - fs.write
    // - threads.create
    // - native.load
}
```

### Java Code

```java
public class SecureScorer extends Scorer {
    @Override
    public float score() throws IOException {
        // Safe: reading from index (fs.read allowed)
        Document doc = reader.document(docId);
        float boost = parseBoost(doc);

        // BLOCKED: This would be denied
        // new URL("http://evil.com").openStream();

        return baseScore * boost;
    }
}
```

## Lucenia Integration

[Lucenia](https://lucenia.io) uses jGuard for its scripting sandbox:

```text
security module io.lucenia.script {
    // Script can read index and codec files
    entitle module to fs.read(data, "**");

    // Allow system properties for numeric types
    entitle module to system.property.read("java.**");

    // No dangerous operations
    deny module to network.outbound;
    deny module to fs.write;
    deny module to threads.create;
    deny module to native.load;
}
```

## OpenSearch/Elasticsearch Patterns

For search systems with plugin architectures:

```text
// Core search module
security module search.core {
    entitle module to fs.read(index, "**");
    entitle module to fs.write(index, "**");
    entitle module to network.listen(9200);
    entitle module to threads.create;
}

// Scripting plugin - restricted
security module search.scripting {
    entitle module to fs.read(index, "**");
    entitle module to system.property.read;
    // No writes, no network, no threads
}

// Network plugin - network only
security module search.network {
    entitle module to network.outbound("*.internal", 9300);
    entitle module to network.listen(9300);
}
```

## Query-Time Security

Different query types can have different restrictions:

```text
// Simple queries - minimal access
security module query.simple {
    entitle module to fs.read(index, "**");
}

// Aggregation queries - thread pool allowed
security module query.aggregation {
    entitle module to fs.read(index, "**");
    entitle module to threads.create;
}

// Admin queries - full access
security module query.admin {
    entitle module to fs.read(index, "**");
    entitle module to fs.write(index, "**");
    entitle module to threads.create;
}
```

## Best Practices

1. **Separate scoring from indexing** - Different security requirements
2. **Deny network for scripts** - Scripts shouldn't phone home
3. **Deny file writes** - Scripts read data, don't modify it
4. **Audit unknown scripts** - Run in audit mode first
5. **Use external policies** - Override script permissions at deployment
