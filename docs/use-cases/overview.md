---
sidebar_position: 1
---

# Use Cases Overview

jGuard is designed for JVM applications that need to execute untrusted or semi-trusted code safely. Here are the primary use cases.

## Plugin Systems

**Problem**: Your application loads third-party plugins that could access sensitive resources.

**Solution**: jGuard sandboxes plugins with explicit capability grants.

```text
security module com.vendor.plugin {
    // Plugin can only read its own data directory
    entitle module to fs.read(plugin-data, "**");

    // No network access
    // No thread creation
    // No native code
}
```

[Learn more about securing plugin systems →](./plugin-systems)

## ML/AI Isolation

**Problem**: ML frameworks like DJL execute model code that could be malicious or buggy.

**Solution**: jGuard restricts ML execution to only necessary resources.

```text
security module ai.djl.pytorch {
    entitle module to fs.read(models, "**");
    entitle module to native.load("torch*");
    entitle module to threads.create;

    // No network access - models loaded from disk only
}
```

[Learn more about ML isolation →](./ml-isolation)

## Multi-Tenant JVMs

**Problem**: Multiple tenants share a JVM and need isolation.

**Solution**: Each tenant module gets its own policy.

```text
// Tenant A
security module tenant.a {
    entitle module to fs.read(tenant-a-data, "**");
    entitle module to fs.write(tenant-a-data, "**");
}

// Tenant B
security module tenant.b {
    entitle module to fs.read(tenant-b-data, "**");
    entitle module to fs.write(tenant-b-data, "**");
}
```

[Learn more about multi-tenant isolation →](./multi-tenant)

## Search Engines

**Problem**: Search engines like Lucene/OpenSearch execute custom scoring scripts.

**Solution**: jGuard sandboxes script execution.

```text
security module custom.scoring {
    // Scripts can only read the index
    entitle module to fs.read(index, "**");

    // No writes, no network, no threads
}
```

[Learn more about search engine security →](./search-engines)

## CI/CD Hardening

**Problem**: Build pipelines execute arbitrary code that could compromise the build server.

**Solution**: jGuard restricts build-time code execution.

```text
security module build.plugin {
    entitle module to fs.read(src, "**");
    entitle module to fs.write(build, "**");

    // No network access - builds are reproducible
    // No native code - portable builds
}
```

[Learn more about CI/CD hardening →](./plugin-systems)

## Legacy Library Restriction

**Problem**: Third-party libraries don't have jGuard policies and could do anything.

**Solution**: External policies grant minimal capabilities to legacy code.

```text
// External policy for legacy library
security module legacy.library {
    // Grant only what the library needs
    entitle module to fs.read(config, "*.xml");
    entitle module to system.property.read("java.version");

    // Everything else denied by default
}
```

[Learn more about legacy library support →](./plugin-systems)

## Common Patterns

### Principle of Least Privilege

Grant only what's needed, nothing more:

```text
// Bad: Too permissive
entitle module to network.outbound;

// Good: Specific to what's needed
entitle com.example.app.http to network.outbound("api.example.com", 443);
```

### Package Hierarchy Isolation

Use package structure for security boundaries:

```text
security module com.example.app {
    // HTTP layer - network access
    entitle com.example.app.http.. to network.outbound;

    // Storage layer - file access
    entitle com.example.app.storage.. to fs.read(data, "**");
    entitle com.example.app.storage.. to fs.write(data, "**");

    // Core layer - no dangerous capabilities
    // (inherits only system.property.read from module)
    entitle module to system.property.read;
}
```

### Audit Before Enforce

Start with `audit` mode to discover what your application needs:

```bash
./gradlew runWithAgent -Pjguard.mode=audit
```

Then build your policy based on the audit log.

## Next Steps

- [Plugin Systems](./plugin-systems) - Deep dive into plugin security
- [ML Isolation](./ml-isolation) - Securing AI workloads
- [Multi-Tenant](./multi-tenant) - Tenant isolation patterns
