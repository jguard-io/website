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
    id "io.jguard.policy" version "0.2.0"
}
```

Or using the plugins DSL in `build.gradle.kts`:

```kotlin
plugins {
    java
    application
    id("io.jguard.policy") version "0.2.0"
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

### External Policies

```groovy
jguardPolicy {
    // Source directory for external .jguard files
    externalPoliciesSourceDir = file("policies-src")

    // Output directory for compiled .bin files
    externalPoliciesOutputDir = file("policies")
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
| `hotReload` | boolean | `false` | Enable hot reload |
| `hotReloadInterval` | int | `5` | Reload interval (seconds) |
| `externalPoliciesSourceDir` | File | — | External policy sources |
| `externalPoliciesOutputDir` | File | — | External policy output |

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
    id "io.jguard.policy" version "0.2.0"
}
```

Run the app with all policies:

```groovy
// app/build.gradle
plugins {
    id "application"
    id "io.jguard.policy" version "0.2.0"
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
