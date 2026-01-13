---
sidebar_position: 1
---

# Getting Started

Welcome to jGuard! This guide will help you get started with capability-based security for your JVM applications.

## What is jGuard?

jGuard is a capability-oriented security framework for JDK 21+ that enables JVM applications to execute untrusted code—such as plugins, extensions, and embedded automation—with explicit, least-privilege access controls.

Rather than relying on ambient authority (where code can implicitly access any resource), jGuard requires all sensitive operations to be explicitly granted through capabilities.

## Why jGuard?

The Java Security Manager was deprecated in Java 17 (JEP 411) and **fully removed in JDK 24**. jGuard fills this gap with a modern approach built on five core principles:

1. **No ambient authority** - Code cannot implicitly access sensitive resources
2. **Modules as principals** - JPMS module identity serves as the root of trust
3. **Explicit capabilities** - Security decisions focus on what code is permitted to do
4. **Deny by default** - Operations fail unless capabilities are explicitly granted
5. **Deterministic and reviewable policy** - Policies compile to auditable metadata

## Quick Example

Define a policy in `module-info.jguard`:

```text
security module com.example.myapp {
    entitle com.example.myapp.http.. to network.outbound;
    entitle com.example.myapp.io..   to fs.read(data, "**");
    entitle com.example.myapp..      to threads.create;
}
```

Run with the jGuard agent:

```bash
./gradlew runWithAgent
```

Any code not entitled to a capability will be blocked:

```
SecurityException: Access denied - module 'com.example.myapp'
package 'com.example.myapp.untrusted' is not entitled to 'network.outbound'
```

## Next Steps

1. [Install jGuard](/docs/getting-started/installation) - Add jGuard to your project
2. [Quickstart](/docs/getting-started/quickstart) - Run your first secured application
3. [Write your first policy](/docs/getting-started/first-policy) - Learn the policy language
