---
sidebar_position: 6
---

# Gradle Plugin

The jGuard Gradle plugin integrates policy compilation and agent execution into your build.

## Installation

Add the plugin to your `build.gradle`:

```groovy
plugins {
    id "java"
    id "application"
    id "io.jguard.policy" version "0.4.0"
}
```

Or using the plugins DSL in `build.gradle.kts`:

```kotlin
plugins {
    java
    application
    id("io.jguard.policy") version "0.4.0"
}
```

## Configuration

### Basic Configuration

```groovy
jguardPolicy {
    // Policy source file
    sourceFile = file("src/main/java/module-info.jguard")

    // Output directory for compiled policies
    outputDir = layout.buildDirectory.dir("generated/jguard")

    // Also generate JSON for inspection
    includeJson = true

    // Path inside JAR for policy
    jarPath = "META-INF/jguard"

    // Enforcement mode: strict, permissive, or audit
    mode = "strict"

    // Log level: error, warn, info, debug, trace
    logLevel = "info"
}
```

### Multi-Module Configuration

```groovy
jguardPolicy {
    // Enable auto-discovery of policies from signed JARs
    discoveryMode = true

    // Allow unsigned policies (development only!)
    allowUnsignedPolicies = true
}
```

### External Policies (Override Directory)

For deployment-time policy overrides (grant/deny for third-party libraries):

```groovy
jguardPolicy {
    // Source directory for external .jguard files
    externalPoliciesSourceDir = file("policies-src")

    // Output directory for compiled .bin files
    externalPoliciesOutputDir = file("policies")
}
```

### Embedded External Policies (v0.4+)

Ship policies for your runtime dependencies (Netty, Reactor, etc.) directly in your JAR:

```groovy
jguardPolicy {
    // Source directory for embedded external policies
    // Default: src/main/jguard
    externalPoliciesSourceDir = file("src/main/jguard")
}
```

Place `.jguard` files named after the target module:

```
src/main/jguard/
├── io.netty.common.jguard      # Policy for io.netty.common
├── com.google.api.client.jguard # Policy for com.google.api.client
└── reactor.core.jguard          # Policy for reactor.core
```

These are compiled to `META-INF/jguard/external/*.bin` and automatically discovered by the agent.

### Test Policies (v0.4+)

Test-specific policies extend embedded policies with additional permissions for testing:

```groovy
jguardPolicy {
    // Source directory for test policies (default: src/test/jguard)
    testPoliciesSourceDir = file("src/test/jguard")

    // Output directory for compiled test policies
    testPoliciesOutputDir = layout.buildDirectory.dir("test-policies")
}
```

Example test policy:

```
src/test/jguard/
└── com.example.app.jguard
```

```text
// src/test/jguard/com.example.app.jguard
security module com.example.app {
    // Additional permissions for testing
    entitle com.example.app.. to fs.write("/tmp", "**");
    entitle com.example.app.. to threads.create;
}
```

### Hot Reload

```groovy
jguardPolicy {
    // Enable runtime policy hot reload
    hotReload = true

    // Poll interval in seconds
    hotReloadInterval = 5

    // External policies directory
    externalPoliciesSourceDir = file("policies-src")
    externalPoliciesOutputDir = file("policies")
}
```

### Trusted Modules

```groovy
jguardPolicy {
    // Allow trusted modules (for native libraries like PyTorch)
    allowTrusted = true

    // External policies with trusted declarations
    externalPoliciesSourceDir = file("policies-src")
    externalPoliciesOutputDir = file("policies")
}
```

:::warning
Only enable `allowTrusted` when you have modules that genuinely require unrestricted access, such as native ML libraries. Trusted modules bypass all capability checks.
:::

## Configuration Reference

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `sourceFile` | File | `src/main/java/module-info.jguard` | Policy source file |
| `outputDir` | Directory | `build/generated/jguard` | Output directory |
| `includeJson` | boolean | `false` | Also output JSON |
| `jarPath` | String | `META-INF/jguard` | Path inside JAR |
| `mode` | String | `strict` | Enforcement mode |
| `logLevel` | String | `info` | Log verbosity |
| `discoveryMode` | boolean | `true` | Auto-discover policies |
| `allowUnsignedPolicies` | boolean | `false` | Allow unsigned (dev only) |
| `allowTrusted` | boolean | `false` | Allow trusted modules |
| `hotReload` | boolean | `false` | Enable hot reload |
| `hotReloadInterval` | int | `5` | Reload interval (seconds) |
| `externalPoliciesSourceDir` | File | `src/main/jguard` | External policy sources |
| `externalPoliciesOutputDir` | File | — | External policy output |
| `testPoliciesSourceDir` | File | `src/test/jguard` | Test policy sources |
| `testPoliciesOutputDir` | File | `build/test-policies` | Test policy output |

## Tasks

### compileJGuardPolicy

Compiles `module-info.jguard` to binary format.

```bash
./gradlew compileJGuardPolicy
```

**Inputs:**
- `sourceFile` (default: `src/main/java/module-info.jguard`)

**Outputs:**
- `policy.bin` in `outputDir`
- `policy.json` if `includeJson = true`

### compileExternalPolicies

Compiles all `.jguard` files in `externalPoliciesSourceDir`.

```bash
./gradlew compileExternalPolicies
```

**Inputs:**
- All `*.jguard` files in `externalPoliciesSourceDir`

**Outputs:**
- Corresponding `.bin` files in `externalPoliciesOutputDir`

**Incremental Builds**

The task uses content-based change detection. It only recompiles when `.jguard` file contents actually change, not just timestamps.

**Automatic Test Dependency**

When `externalPoliciesSourceDir` is configured, all `Test` tasks automatically depend on `compileExternalPolicies`. This ensures tests always run with up-to-date compiled policies.

### compileTestPolicies

Compiles test-specific `.jguard` files in `testPoliciesSourceDir`.

```bash
./gradlew compileTestPolicies
```

**Inputs:**
- All `*.jguard` files in `testPoliciesSourceDir` (default: `src/test/jguard`)

**Outputs:**
- Corresponding `.bin` files in `testPoliciesOutputDir` (default: `build/test-policies`)

**Automatic Test Integration**

Test policies are automatically passed to the agent during test execution via `-Djguard.policy.override`.

### runWithAgent

Runs the application with the jGuard agent attached.

```bash
# Run with default settings
./gradlew runWithAgent

# Override enforcement mode
./gradlew runWithAgent -Pjguard.mode=audit

# Override log level
./gradlew runWithAgent -Pjguard.logLevel=debug
```

**Properties:**

| Property | Description |
|----------|-------------|
| `-Pjguard.mode=<mode>` | Override enforcement mode |
| `-Pjguard.logLevel=<level>` | Override log level |

## JAR Packaging

The plugin automatically packages compiled policies into your JAR:

```
your-app.jar
├── META-INF/
│   └── jguard/
│       ├── policy.bin     # Binary policy
│       └── policy.json    # JSON (if includeJson = true)
├── module-info.class
└── com/
    └── example/
        └── ...
```

## JAR Signing

For production, sign your JARs to enable policy verification:

```groovy
// build.gradle
jar {
    doLast {
        ant.signjar(
            jar: archiveFile.get().asFile,
            keystore: "keystore.jks",
            storepass: "changeit",
            alias: "mykey"
        )
    }
}
```

Or using the `signing` plugin:

```groovy
plugins {
    id 'signing'
}

signing {
    sign jar
}
```

## Multi-Project Setup

For multi-module Gradle projects:

```
root/
├── build.gradle
├── settings.gradle
├── core/
│   ├── build.gradle
│   └── src/main/java/
│       ├── module-info.java
│       └── module-info.jguard
├── network/
│   ├── build.gradle
│   └── src/main/java/
│       ├── module-info.java
│       └── module-info.jguard
└── app/
    ├── build.gradle
    └── src/main/java/
        ├── module-info.java
        └── module-info.jguard
```

Each subproject applies the plugin independently:

```groovy
// core/build.gradle
plugins {
    id "java-library"
    id "io.jguard.policy" version "0.4.0"
}
```

Run the app with all policies:

```groovy
// app/build.gradle
plugins {
    id "application"
    id "io.jguard.policy" version "0.4.0"
}

jguardPolicy {
    discoveryMode = true
    allowUnsignedPolicies = true  // dev only
}

dependencies {
    implementation project(':core')
    implementation project(':network')
}
```

## Integration with CI/CD

### GitHub Actions

```yaml
name: Build and Test

on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up JDK 21
        uses: actions/setup-java@v4
        with:
          java-version: '21'
          distribution: 'temurin'

      - name: Build and compile policies
        run: ./gradlew build compileJGuardPolicy

      - name: Run with enforcement
        run: ./gradlew runWithAgent -Pjguard.mode=strict
```

### Strict Mode for CI

Use strict mode in CI to catch policy violations:

```groovy
// build.gradle
jguardPolicy {
    mode = System.getenv('CI') ? 'strict' : 'permissive'
}
```

## Troubleshooting

### Policy Not Found

```
Error: No policy found for module com.example.app
```

**Solution:** Ensure `module-info.jguard` exists and the module name matches `module-info.java`.

### Unsigned Policy Rejected

```
Error: Policy rejected - JAR is not signed
```

**Solution:** Either sign your JARs or set `allowUnsignedPolicies = true` for development.

### Capability Denied at Runtime

```
SecurityException: Capability denied
  Module: com.example.app
  Attempted: network.outbound
```

**Solution:** Add the required entitlement to your policy or run in audit mode to discover needs:

```bash
./gradlew runWithAgent -Pjguard.mode=audit
```

## Next Steps

- [CLI Tools](./cli-tools) - Command-line policy management
- [Policy Reference](/docs/policy/overview) - Complete capability documentation
- [Multi-Module Applications](/docs/use-cases/multi-tenant) - Module isolation patterns
