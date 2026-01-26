---
sidebar_position: 2
---

# External Policies

External policies allow you to control capabilities for modules you don't own - third-party libraries, legacy code, and overly permissive dependencies.

## Overview

jGuard supports three types of policies:

| Policy Type | Location | Purpose |
|-------------|----------|---------|
| **Embedded** | Inside JAR (`META-INF/jguard/policy.bin`) | Module author's policy |
| **External** | External directory (`policies/*.bin`) | Deployment-time overrides |
| **Global** | External directory (`policies/_global.bin`) | Applies to ALL modules |

## Grant/Deny Semantics

External policies can both **grant** and **deny** capabilities:

```text
security module com.vendor.library {
    // Grant capabilities the library needs
    entitle module to fs.read("config", "**");
    entitle module to system.property.read;

    // Deny dangerous capabilities
    deny module to network.outbound;
    deny module to native.load;
}
```

### Merge Formula

The effective policy is computed as:

```
effective = (embedded ∪ external_grants ∪ global_grants)
          - (external_denials ∪ global_denials)
```

**Key rules:**
- Denials always win over grants
- More specific subjects don't override less specific (both apply)
- Global policies merge with module-specific (not replace)

### Example: Restricting an Overly Permissive Library

**Embedded policy** (in library JAR):
```text
security module com.vendor.library {
    entitle module to network.outbound;
    entitle module to threads.create;
    entitle module to native.load;  // DANGEROUS!
    entitle module to fs.read("config", "**");
}
```

**External override** (`policies/com.vendor.library.jguard`):
```text
security module com.vendor.library {
    deny module to native.load;
    deny module to threads.create;
}
```

**Effective policy:**
- `network.outbound` - ALLOWED (embedded, not denied)
- `fs.read("config", "**")` - ALLOWED (embedded, not denied)
- `native.load` - BLOCKED (denied by external)
- `threads.create` - BLOCKED (denied by external)

## Legacy Library Support

For non-JPMS libraries without embedded policies, jGuard uses the **auto-module name** derived from the JAR filename.

### Auto-Module Name Derivation

| JAR Filename | Auto-Module Name |
|--------------|------------------|
| `legacy-library-1.2.3.jar` | `legacy.library` |
| `commons-io-2.11.0.jar` | `commons.io` |
| `guava-31.1-jre.jar` | `guava` |

### Example: Restricting a Legacy Library

Given `legacy-library.jar` with no embedded policy:

**External policy** (`policies/legacy.library.jguard`):
```text
security module legacy.library {
    // Grant only what's needed
    entitle module to fs.read("config", "**");
    entitle module to system.property.read;

    // Everything else denied by default
}
```

Since jGuard is deny-by-default, the library is automatically blocked from:
- Network access
- Thread creation
- Native code loading
- Environment variable access
- File writes

## Global Policies

Global policies apply to **all modules** in the JVM.

### File Location

Place global policies in `policies/_global.jguard`:

```text
security module _global {
    // Block native code loading for all modules
    deny module to native.load;

    // Block system property writes
    deny(defensive) module to system.property.write;
}
```

### Defensive Denials

Use `deny(defensive)` to suppress warnings when denying capabilities that weren't explicitly granted:

```text
security module _global {
    // Normal deny - warns if capability wasn't granted
    deny module to native.load;

    // Defensive deny - no warning even if not granted
    deny(defensive) module to system.property.write;
}
```

**Use cases for defensive denials:**
- Proactive security (deny even if not currently granted)
- Defense in depth
- Avoiding redundant warnings in logs

## Directory Structure

```
/etc/myapp/policies/
├── _global.bin                    # Applies to ALL modules
├── com.example.app.bin            # Your app's policy overrides
├── com.vendor.library.bin         # Third-party library restrictions
└── legacy.library.bin             # Legacy library policy
```

## Subject Pattern Matching

When using `deny` statements, subject patterns match entitlements:

| Denial Subject | Matches Entitlements |
|----------------|---------------------|
| `module` | Any subject in the module |
| `pkg..` | `pkg..`, `pkg.*`, `pkg`, or any descendant |
| `pkg.*` | `pkg.*` or direct children |
| `pkg` | Only exact `pkg` match |

### Example: Precise Denial Targeting

```text
// Embedded policy grants multiple subjects
security module com.example.app {
    entitle module to network.outbound;
    entitle com.example.app.http.. to network.outbound;
}

// External policy - deny at module level
security module com.example.app {
    deny module to network.outbound;  // Revokes BOTH grants!
}

// To keep the specific grant, re-grant it
security module com.example.app {
    deny module to network.outbound;
    entitle com.example.app.http.. to network.outbound;  // Re-grant specific
}
```

## Configuration

### Gradle Plugin

```groovy
jguardPolicy {
    externalPoliciesSourceDir = file("policies-src")
    externalPoliciesOutputDir = file("policies")
}
```

### Agent System Properties

| Property | Default | Description |
|----------|---------|-------------|
| `jguard.policy.override` | — | Directory for external policy files |

```bash
java -Djguard.policy.override=/etc/myapp/policies \
     -javaagent:jguard-agent.jar \
     -jar app.jar
```

## Hot Reload

External policies support zero-downtime updates:

```groovy
jguardPolicy {
    hotReload = true
    hotReloadInterval = 5  // seconds
    externalPoliciesSourceDir = file("policies-src")
    externalPoliciesOutputDir = file("policies")
}
```

Or via system properties:

```bash
java -Djguard.reload=true \
     -Djguard.reload.interval=5 \
     -Djguard.policy.override=/etc/myapp/policies \
     -javaagent:jguard-agent.jar \
     -jar app.jar
```

**Workflow:**
1. Edit policy source: `policies-src/com.vendor.library.jguard`
2. Compile: `./gradlew compileExternalPolicies`
3. Agent detects change and reloads atomically
4. New policy takes effect within poll interval

**Error handling:**
- Syntax errors caught at compile time
- Corrupted files keep old policy in effect
- Atomic swap via `AtomicReference<PolicyEnforcer>`

## Validation

Validate that external policies are valid overrides:

```bash
jguard validate-override --jar vendor.jar --override policies/com.vendor.library.bin
```

**Valid overrides can only:**
- Deny capabilities that were granted
- Grant capabilities (additive)

**Invalid overrides:**
- Grant capabilities outside the module's code
- Reference unknown capabilities

## Trusted Modules

For native libraries like PyTorch, TensorFlow, or other code that requires unrestricted system access, jGuard provides a **trusted module** mechanism.

### Declaring a Trusted Module

Trusted modules bypass ALL capability checks. This is only allowed in **external policy override files** — never in embedded policies:

```text
// File: policies-src/ai.djl.pytorch.jguard
security module ai.djl.pytorch {
    trusted;
}
```

### Enabling Trusted Modules

Trusted modules require explicit opt-in:

**Gradle:**
```groovy
jguardPolicy {
    allowTrusted = true
}
```

**System Property:**
```bash
java -Djguard.allow.trusted=true \
     -Djguard.policy.override=/etc/myapp/policies \
     -javaagent:jguard-agent.jar \
     -jar app.jar
```

### Security Warnings

When trusted modules are loaded, jGuard logs a security warning:

```
[WARN] [jguard] Module 'ai.djl.pytorch' is marked as TRUSTED - all capability checks bypassed
```

:::danger Security Warning
Trusted modules can perform **any operation** without restriction. Only use this for:
- Native ML libraries (PyTorch, TensorFlow, DJL)
- System libraries that genuinely need unrestricted access
- Code you fully trust

Never mark untrusted third-party code as trusted.
:::

### Why Override-Only?

The `trusted` keyword is restricted to external policy overrides for security:

1. **Prevents malicious libraries** from granting themselves unrestricted access
2. **Requires deployment-time decision** by administrators, not library authors
3. **Creates audit trail** — trusted modules are visible in external policy files

## Best Practices

1. **Start restrictive** - Grant only what's needed, add more if required
2. **Use global policies sparingly** - Prefer module-specific restrictions
3. **Prefer defensive denials** - Use `deny(defensive)` for proactive security
4. **Version control policies** - Track changes to security configuration
5. **Audit before enforce** - Use AUDIT mode to discover requirements
6. **Separate concerns** - One policy file per module

## Next Steps

- [Policy Reference](./overview) - Complete capability documentation
- [Multi-Module Applications](/docs/use-cases/multi-tenant) - Module isolation patterns
- [CLI Tools](/docs/getting-started/cli-tools) - Policy management commands
