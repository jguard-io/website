---
sidebar_position: 1
slug: /
---

# Introduction to jGuard

**jGuard** is a capability-oriented security framework for JDK 21+ that enables JVM applications to execute untrusted code—such as plugins, extensions, and embedded automation—with explicit, least-privilege access controls.

## Why jGuard?

The Java Security Manager was deprecated in Java 17 (JEP 411) and **fully removed in JDK 24**. This leaves JVM applications without a standard way to:

- Sandbox untrusted code (plugins, scripts, user-provided code)
- Enforce fine-grained permissions (file access, network, reflection)
- Audit security-sensitive operations
- Isolate tenants in multi-tenant applications

**jGuard fills this gap** with a modern, capability-based approach designed for today's JVM workloads.

## Core Principles

jGuard is built on five foundational concepts:

1. **No ambient authority** - Code cannot implicitly access sensitive resources; all operations require explicit capabilities
2. **Modules as principals** - JPMS module identity serves as the root of trust, with packages providing fine-grained refinement
3. **Explicit capabilities** - Security decisions focus on what code is permitted to do, not on global permissions
4. **Deny by default** - Operations fail unless capabilities are explicitly granted
5. **Deterministic and reviewable policy** - Security policies compile to auditable metadata suitable for human review

## Quick Example

Define a policy using the module-inspired descriptor format (`module-info.jguard`):

```text
security module com.example.myplugin {
  entitle com.example.myplugin.http.. to network.outbound;
  entitle com.example.myplugin.io..   to fs.read(data, "models/**");
  entitle com.example.myplugin..      to threads.create;
  entitle module                      to fs.read(config, "**");
}
```

Or use the Java-backed descriptor:

```java
import static io.jguard.policy.Descriptor.*;

public final class security_policy {
  public static final Policy POLICY =
    module("com.example.myplugin",
      entitle("com.example.myplugin.http..", networkOutbound()),
      entitle("com.example.myplugin.io..",   fsRead(DATA, "models/**")),
      entitle("com.example.myplugin..",      threadsCreate()),
      entitle(MODULE,                        fsRead(CONFIG, "**"))
    );
}
```

## Supported Capabilities

jGuard supports fine-grained control over:

| Capability | Description |
|------------|-------------|
| `fs.read(root, glob)` | Read files matching glob patterns |
| `fs.write(root, glob)` | Write files matching glob patterns |
| `fs.hardlink(root, glob)` | Create hard links |
| `network.outbound(host?, port?)` | Open outbound connections |
| `network.listen(port?)` | Bind server sockets |
| `threads.create` | Create new threads |
| `native.load(pattern?)` | Load native libraries |
| `env.read(pattern?)` | Read environment variables |
| `system.property.read(pattern?)` | Read system properties |
| `system.property.write(pattern?)` | Write system properties |
| `process.exec(pattern?)` | Execute external processes |
| `crypto.provider` | Modify JCE crypto providers |

## Use Cases

jGuard is designed for:

- **Plugin Systems** - Safely execute third-party plugins
- **ML/AI Workloads** - Sandbox model execution (e.g., DJL)
- **Search Engines** - Secure custom scoring scripts
- **Multi-Tenant Applications** - Isolate tenant code
- **CI/CD Pipelines** - Harden test execution

## Getting Started

Ready to secure your JVM application?

1. [Install jGuard](/docs/getting-started/installation)
2. [Follow the Quickstart guide](/docs/getting-started/quickstart)
3. [Write your first policy](/docs/getting-started/first-policy)

## Project Status

jGuard is **production-ready** with:

- Comprehensive enforcement capabilities
- Multiple execution modes (STRICT, PERMISSIVE, AUDIT)
- Strong JPMS integration with module verification
- Command-line toolset (`jguardc` compiler, `jguard` inspector)

## Community

jGuard is open source under the Apache 2.0 license.

- [GitHub Repository](https://github.com/jguard-io/jguard)
- [Contributing Guide](/docs/community/contributing)
- [Code of Conduct](/docs/community/code-of-conduct)
