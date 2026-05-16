---
sidebar_position: 4
---

# Multi-Module Applications

jGuard provides module-based isolation for applications with multiple JPMS modules, each with independent security policies.

## Architecture

jGuard's security model is **module-based**, not classloader-based:

| Scenario | Support | Notes |
|----------|---------|-------|
| Single app, multiple JPMS modules | Fully supported | Designed use case |
| Multiple apps with different module names | Fully supported | Each module gets its own policy |
| Same module name across classloaders | Shared policy | Modules with same name share policy |

:::note Design Choice
jGuard uses JPMS modules as the security boundary. This is simpler and more predictable than classloader-based isolation. If you need per-classloader isolation, consider running separate JVMs or containers.
:::

## Auto-Discovery

jGuard automatically discovers policies from signed JARs on the module path:

```
┌─────────────────────────────────────────────────────────┐
│ JVM Startup with jGuard Agent                           │
│                                                         │
│  1. Scan module path for JAR files                      │
│  2. Verify JAR signatures (production mode)             │
│  3. Extract META-INF/jguard/policy.bin from each JAR    │
│  4. Load and merge policies per module                  │
│  5. Enforce based on caller's module identity           │
└─────────────────────────────────────────────────────────┘
```

### Development Mode

For development without JAR signing:

```groovy
jguardPolicy {
    allowUnsignedPolicies = true  // Only for development!
    discoveryMode = true
}
```

Or via system property:

```bash
java -Djguard.allowUnsignedPolicies=true \
     -Djguard.discovery=true \
     -javaagent:jguard-agent.jar \
     -jar app.jar
```

### JAR Signing for Production

Sign JARs using a keystore:

```bash
jarsigner -keystore keystore.jks -storepass changeit mymodule.jar mykey
```

The agent verifies signatures before loading policies. Unsigned or tampered JARs are rejected.

## Module-Based Isolation

Each module has its own policy file:

```
app/
├── core/
│   ├── src/main/java/
│   │   ├── module-info.java
│   │   └── module-info.jguard     # Core module policy
│   └── build.gradle
├── network/
│   ├── src/main/java/
│   │   ├── module-info.java
│   │   └── module-info.jguard     # Network module policy
│   └── build.gradle
└── app/
    ├── src/main/java/
    │   ├── module-info.java
    │   └── module-info.jguard     # App module policy
    └── build.gradle
```

### Module Isolation Guarantee

- Module A can only use Module A's entitlements
- Module B cannot use Module A's entitlements
- Each module's policy is enforced independently
- No capability inheritance across module boundaries

## Delegation Pattern

Modules can delegate sensitive operations to trusted modules:

### Core Module (File Access)

```text
security module com.example.core {
    entitle module to fs.read("config", "**");
    entitle module to fs.read(".", "*.txt");
}
```

### Network Module (Network Access)

```text
security module com.example.network {
    entitle module to network.outbound("*.example.com", 443);
    entitle module to network.outbound("httpbin.org", "80-443");
    entitle module to threads.create;
}
```

### App Module (Orchestration)

```text
security module com.example.app {
    entitle module to threads.create;
    entitle module to env.read("HOME");
    entitle module to env.read("USER");
    entitle module to system.property.read;
}
```

### Usage Pattern

```java
// In app module - cannot read files directly
// Files.readString(Path.of("config/app.conf"));  // ✗ BLOCKED

// But app delegates to core module
ConfigReader reader = new ConfigReader();  // ✓ ALLOWED
String config = reader.readConfig("app.conf");  // ✓ ALLOWED (core module)

// App cannot make network calls directly
// new Socket("api.example.com", 443);  // ✗ BLOCKED

// But app delegates to network module
ApiClient client = new ApiClient();  // ✓ ALLOWED
client.fetch("/data");  // ✓ ALLOWED (network module)
```

## Use Case: Application with Plugins

```
┌──────────────────────────────────────────────────────┐
│ JVM                                                  │
│                                                      │
│  ┌─────────────────────────────────────────────────┐ │
│  │ com.example.app (trusted)                       │ │
│  │  • Full filesystem access                       │ │
│  │  • Network access                               │ │
│  │  • Thread creation                              │ │
│  └─────────────────────────────────────────────────┘ │
│                                                      │
│  ┌─────────────────┐   ┌─────────────────┐           │
│  │ com.vendor.a    │   │ com.vendor.b    │           │
│  │ (plugin)        │   │ (plugin)        │           │
│  │ • fs.read only  │   │ • fs.read only  │           │
│  │ • No network    │   │ • No network    │           │
│  └─────────────────┘   └─────────────────┘           │
│                                                      │
│  jGuard Agent - Enforces per-module policies         │
└──────────────────────────────────────────────────────┘
```

## Resource Isolation by Module

Different modules can have different access levels:

```text
// Premium module - more capabilities
security module premium.features {
    entitle module to network.outbound;
    entitle module to threads.create;
    entitle module to fs.read("data", "**");
    entitle module to fs.write("output", "**");
}

// Basic module - restricted
security module basic.features {
    entitle module to fs.read("data", "**");
    // No network, no threads, no writes
}
```

## Network Isolation by Module

```text
// Internal module - internal network only
security module internal.services {
    entitle module to network.outbound("*.internal.example.com", 443);
}

// External module - public network allowed
security module external.services {
    entitle module to network.outbound;
}

// Isolated module - no network
security module isolated.processor {
    // No network.outbound granted
}
```

## External Policy Overrides

Override module policies at deployment without rebuilding:

```text
// policies/com.vendor.plugin.jguard
security module com.vendor.plugin {
    // Deny capabilities the plugin requested
    deny module to network.outbound;
    deny module to threads.create;
}
```

See [External Policies](/docs/policy/external-policies) for details on grant/deny semantics.

## Best Practices

1. **Use distinct module names** - Each module gets its own policy
2. **Separate concerns by module** - Network module, storage module, etc.
3. **Apply least privilege per module** - Only grant what each module needs
4. **Use delegation** - Let trusted modules handle sensitive operations
5. **Sign JARs in production** - Verify policy authenticity
6. **Use external policies** - Override vendor policies at deployment
7. **Consider containers** - For true tenant isolation, use separate JVMs/containers

## Comparison with SecurityManager

| Aspect | Java SecurityManager | jGuard |
|--------|---------------------|--------|
| Isolation boundary | CodeSource + ProtectionDomain | JPMS Module |
| Granularity | Per-class, stack-based | Per-module, package-based |
| Configuration | Policy files | module-info.jguard |
| Complexity | High (stack inspection) | Lower (module identity) |
| Performance | Higher overhead | Lower overhead |
| Status | Removed in JDK 24 | Active development |
