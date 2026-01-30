---
sidebar_position: 4
---

# Your First Policy

This guide teaches you the jGuard policy language through practical examples.

## Policy Structure

A jGuard policy defines which packages can perform which operations:

```text
security module <module-name> {
    entitle <subject> to <capability>;
    entitle <subject> to <capability>;
    ...
}
```

## Subject Patterns

Subjects determine *who* receives a capability:

| Pattern | Matches | Example |
|---------|---------|---------|
| `module` | All packages in the module | Any code in the module |
| `com.example` | Exactly that package | Only classes in `com.example` |
| `com.example.*` | Direct subpackages only | `com.example.foo`, not `com.example.foo.bar` |
| `com.example..` | Package and all descendants | `com.example.foo.bar.baz` and deeper |

### Examples

```text
security module com.example.app {
    // Entire module can read system properties
    entitle module to system.property.read;

    // Only the http package can make network connections
    entitle com.example.app.http to network.outbound;

    // The http package and all subpackages can create threads
    entitle com.example.app.http.. to threads.create;

    // Direct children of worker package can read files
    entitle com.example.app.worker.* to fs.read(data, "**");
}
```

## Capabilities

### Filesystem

```text
// Read files matching a glob pattern under a root
entitle module to fs.read(config, "*.properties");
entitle module to fs.read(data, "**/*.json");

// Write files
entitle module to fs.write(logs, "*.log");
entitle module to fs.write(output, "**");
```

### Network

```text
// Any outbound connection
entitle module to network.outbound;

// Filtered by host pattern
entitle module to network.outbound("*.example.com");

// Filtered by host and port
entitle module to network.outbound("api.example.com", 443);

// Filtered by host pattern and port range
entitle module to network.outbound("*.example.com", "80-443");

// Listen on any port
entitle module to network.listen;

// Listen on specific port
entitle module to network.listen(8080);

// Listen on port range
entitle module to network.listen("8080-8090");
```

### Threads

```text
// Create new threads
entitle module to threads.create;
```

### Native Libraries

```text
// Load any native library
entitle module to native.load;

// Load specific library
entitle module to native.load("mylib");
```

### Environment Variables

```text
// Read any environment variable
entitle module to env.read;

// Read specific variable
entitle module to env.read("HOME");
```

### System Properties

```text
// Read any system property
entitle module to system.property.read;

// Read specific property
entitle module to system.property.read("java.home");

// Read properties matching pattern
entitle module to system.property.read("app.**");

// Write properties
entitle module to system.property.write("app.**");
```

## Complete Example

Here's a realistic policy for a web application:

```text
security module com.example.webapp {
    // JDK initialization needs system property access
    entitle module to system.property.read;

    // Configuration layer can read config files
    entitle com.example.webapp.config.. to fs.read(config, "**");
    entitle com.example.webapp.config.. to env.read;

    // HTTP client layer can make outbound connections
    entitle com.example.webapp.http.. to network.outbound;

    // Server layer can bind ports
    entitle com.example.webapp.server.. to network.listen("8080-8443");

    // Worker threads need thread creation
    entitle com.example.webapp.worker.. to threads.create;

    // Logging layer can write logs
    entitle com.example.webapp.logging.. to fs.write(logs, "**/*.log");
}
```

## Deny Statements

External policies can deny capabilities to restrict overly permissive libraries:

```text
security module com.vendor.library {
    // Remove network access from embedded policy
    deny module to network.outbound;

    // Defensive deny - suppress warning if not granted
    deny(defensive) module to native.load;
}
```

## Audit Mode Workflow (v0.4+)

The fastest way to write your first policy is to use **audit mode**. It runs your application, logs all denied operations, and generates copy-paste-ready policy at shutdown.

### Step 1: Run in Audit Mode

```bash
./gradlew runWithAgent -Pjguard.mode=audit
```

Or directly:

```bash
java -javaagent:jguard-agent.jar \
     -Djguard.mode=audit \
     -Djguard.allowUnsignedPolicies=true \
     -jar myapp.jar
```

### Step 2: Exercise Your Application

Run through all the code paths you want to cover - API calls, file operations, etc.

### Step 3: Copy the Suggested Policy

At shutdown, jGuard prints suggested policy:

```
// ============================================================
// jGuard Audit Mode - Suggested Policy
// Based on 5 denied operation(s)
// ============================================================

// Suggested policy for module 'com.example.app':
security module com.example.app {
    entitle com.example.app.. to fs.read("/", "**");
    entitle com.example.app.. to network.outbound;
    entitle com.example.app.. to system.property.read("*");
    entitle com.example.app.. to threads.create;
}
```

### Step 4: Refine the Policy

The suggested policy uses wildcards for safety. Tighten them:

```text
security module com.example.app {
    // Narrow filesystem access to specific paths
    entitle com.example.app.config.. to fs.read("/etc/myapp", "**/*.yaml");

    // Narrow network to specific hosts
    entitle com.example.app.http.. to network.outbound("api.example.com", 443);

    // Keep specific property patterns
    entitle module to system.property.read("java.**");
    entitle module to system.property.read("app.**");

    // Worker packages need threads
    entitle com.example.app.worker.. to threads.create;
}
```

### Step 5: Switch to Strict Mode

```bash
./gradlew runWithAgent -Pjguard.mode=strict
```

Your application now runs with least-privilege enforcement.

## Best Practices

1. **Start with `audit` mode** - See what your application actually needs
2. **Use specific packages** - Don't grant capabilities to `module` unless necessary
3. **Use the `..` pattern carefully** - It grants to all descendant packages
4. **Review third-party policies** - Use `jguard inspect` to see embedded policies
5. **Tighten wildcards** - The suggested policy uses `*` - narrow to specific values

## Next Steps

- [Policy Overview](/docs/policy/overview) - All capabilities in detail
- [Use Cases](/docs/use-cases/overview) - Real-world examples
