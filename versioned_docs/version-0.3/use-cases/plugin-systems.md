---
sidebar_position: 2
---

# Plugin Systems

Securing plugin execution is one of the most common use cases for jGuard.

## The Problem

Plugin systems allow third-party code to run inside your application. Without security controls, plugins can:

- Access any file on the system
- Make network connections to exfiltrate data
- Spawn threads that consume resources
- Load native code that bypasses JVM protections

## The Solution

jGuard lets you define exactly what each plugin can do:

```text
security module com.vendor.plugin {
    // Plugin can read its own data directory
    entitle module to fs.read(plugin-data, "**");

    // Plugin can write to its output directory
    entitle module to fs.write(plugin-output, "**");

    // No network access
    // No thread creation
    // No native code
}
```

## Architecture

```
┌─────────────────────────────────────────────────┐
│ Host Application                                │
│  ┌─────────────────────────────────────────────┐│
│  │ Plugin Manager                              ││
│  │  • Loads plugins from signed JARs           ││
│  │  • Policies embedded in JAR                 ││
│  └─────────────────────────────────────────────┘│
│  ┌──────────────┐ ┌──────────────┐              │
│  │ Plugin A     │ │ Plugin B     │              │
│  │ (Signed JAR) │ │ (Signed JAR) │              │
│  │ + policy.bin │ │ + policy.bin │              │
│  └──────────────┘ └──────────────┘              │
└─────────────────────────────────────────────────┘
```

## Implementation

### 1. Plugin Developer Creates Policy

Each plugin ships with a `module-info.jguard`:

```text
security module com.vendor.analytics {
    // Read configuration
    entitle module to fs.read(config, "analytics.properties");

    // Write reports
    entitle module to fs.write(reports, "**/*.csv");

    // System properties for version info
    entitle module to system.property.read("java.version");
}
```

### 2. Plugin is Signed and Packaged

```bash
# Compile policy
jguardc -o META-INF/jguard/policy.bin module-info.jguard

# Package JAR
jar cvf analytics-plugin.jar -C classes .

# Sign JAR
jarsigner -keystore keystore.jks analytics-plugin.jar plugin-key
```

### 3. Host Application Loads Plugins

```bash
# jGuard auto-discovers policies from signed JARs
java -javaagent:jguard-agent.jar \
     -Djguard.mode=strict \
     -jar host-app.jar
```

### 4. Violations Are Blocked

If the plugin tries to access something not in its policy:

```
SecurityException: Access denied - module 'com.vendor.analytics'
package 'com.vendor.analytics.export' is not entitled to 'network.outbound'
```

## External Policy Overrides

The host application can further restrict plugins:

```text
// policies/com.vendor.analytics.jguard
security module com.vendor.analytics {
    // Deny network even if plugin policy grants it
    deny module to network.outbound;

    // Deny thread creation
    deny module to threads.create;
}
```

## Legacy Plugins

For plugins without jGuard policies, create external policies:

```text
// policies/legacy.plugin.jguard
security module legacy.plugin {
    // Grant only what's needed
    entitle module to fs.read(data, "*.dat");

    // Everything else denied by default
}
```

## Best Practices

1. **Require signed JARs** - Don't set `allowUnsignedPolicies=true` in production
2. **Audit first** - Run plugins in audit mode to understand their needs
3. **Least privilege** - Grant only necessary capabilities
4. **Review embedded policies** - Use `jguard inspect` before loading plugins
5. **Global restrictions** - Use `_global.jguard` for environment-wide rules

## Example: Analytics Plugin

```text
security module com.example.analytics {
    // Read data files
    entitle module to fs.read(data, "**/*.csv");
    entitle module to fs.read(data, "**/*.json");

    // Write reports
    entitle module to fs.write(reports, "**/*.html");
    entitle module to fs.write(reports, "**/*.pdf");

    // System property access for configuration
    entitle module to system.property.read("analytics.**");

    // No network, no threads, no native code
}
```
