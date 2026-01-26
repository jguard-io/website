---
sidebar_position: 3
---

# Policy Language Specification

This document specifies the syntax and semantics of the jGuard policy descriptor, a declarative format used to define security entitlements for Java modules.

## Overview

A jGuard policy descriptor declares which **capabilities** are granted to a Java module and, optionally, to specific packages within that module.

A jGuard policy descriptor:

- is **not executable code**
- has no side effects
- is evaluated at build or installation time
- is enforced at runtime by the jGuard agent

## Design Goals

The policy descriptor is designed to:

- support **least-privilege execution**
- be **deterministic and reviewable**
- integrate naturally with the Java Platform Module System (JPMS)
- remain stable across Java versions

## Lexical Structure

### Whitespace

Whitespace consists of spaces, tabs, carriage returns, line terminators, and comments. Whitespace may appear between any lexical tokens.

### Comments

```text
// Line comment - extends to end of line

/* Block comment
   can span multiple lines */
```

Comments are treated as whitespace.

### Identifiers

An **identifier** consists of:

- a letter (`A–Z`, `a–z`) or underscore (`_`) as the first character
- followed by any number of letters, digits (`0–9`), or underscores

Identifiers are case-sensitive.

### String Literals

A **string literal** is enclosed in double quotes (`"`).

Escape sequences follow JSON-style conventions:

- `\"`, `\\`, `\n`, `\t`
- Unicode escapes: `\uXXXX`

String literals are fully resolved at policy compile time.

## Grammar (EBNF)

The grammar is expressed in Extended Backus–Naur Form (EBNF), compatible with the [JLS lexical structure](https://docs.oracle.com/javase/specs/jls/se21/html/jls-3.html).

### Policy File

A policy file consists of exactly one security module declaration.

```ebnf
PolicyFile:
    SecurityModuleDeclaration
```

### Security Module Declaration

```ebnf
SecurityModuleDeclaration:
    'security' 'module' ModuleName '{' PolicyDeclaration* '}'
```

```ebnf
PolicyDeclaration:
    EntitlementDeclaration
    DenyDeclaration
    TrustedDeclaration
```

### Contextual Keywords

All keywords in jGuard are **contextual**, meaning they are only treated as keywords in specific syntactic positions. This allows package names like `io.example.security.module` to be used without escaping.

**Keywords:** `security`, `module`, `entitle`, `deny`, `to`, `trusted`, `defensive`

These identifiers are parsed as keywords only where the grammar expects them. In all other positions (such as within package names), they are treated as ordinary identifiers.

### Module Name

```ebnf
ModuleName:
    Identifier ( '.' Identifier )*
```

The module name identifies the Java module to which the policy applies.

### Entitlement Declarations

```ebnf
EntitlementDeclaration:
    'entitle' Subject 'to' Capability ';'
```

Each entitlement declaration grants a capability to a subject.

### Deny Declarations

```ebnf
DenyDeclaration:
    'deny' Subject 'to' Capability ';'
    'deny' '(' 'defensive' ')' Subject 'to' Capability ';'
```

Each deny declaration removes a capability from a subject. Denials take precedence over grants.

The `defensive` modifier suppresses warnings when denying a capability that was never granted.

### Trusted Declarations

```ebnf
TrustedDeclaration:
    'trusted' ';'
```

A trusted declaration marks the entire module as trusted, bypassing all capability checks. This is intended for native libraries that require unrestricted system access.

:::danger Override-Only
The `trusted` keyword is only permitted in **external policy override files**. It cannot appear in embedded policies (policies shipped inside JARs). This prevents malicious libraries from granting themselves unrestricted access.
:::

```text
// File: policies-src/ai.djl.pytorch.jguard (external override)
security module ai.djl.pytorch {
    trusted;
}
```

Trusted modules also require the `-Djguard.allow.trusted=true` system property or `allowTrusted = true` in the Gradle plugin configuration.

### Subject

```ebnf
Subject:
    'module'
    PackagePattern
```

- The keyword `module` refers to the entire module
- A package pattern refers to code within matching packages

### Package Patterns

```ebnf
PackagePattern:
    PackageName
    PackageName '.*'
    PackageName '..'
```

```ebnf
PackageName:
    Identifier ( '.' Identifier )*
```

| Pattern | Meaning |
|---------|---------|
| `p` | Exactly package `p` |
| `p.*` | Direct subpackages of `p` |
| `p..` | Package `p` and all descendants |

### Capabilities

```ebnf
Capability:
    CapabilityName
    CapabilityName '(' CapabilityArguments? ')'
```

```ebnf
CapabilityName:
    Identifier ( '.' Identifier )*
```

```ebnf
CapabilityArguments:
    Argument ( ',' Argument )*
```

```ebnf
Argument:
    Identifier
    StringLiteral
    IntegerLiteral
```

The meaning and validity of arguments depend on the capability.

## Well-Formedness Rules

A policy file is **ill-formed** if any of the following conditions hold.

### Structural Constraints

1. The policy file contains zero or more than one security module declaration
2. An entitlement declaration omits a subject, capability, or terminating semicolon
3. An entitlement declaration appears outside a security module declaration

### Module Constraints

4. The declared module name is not a syntactically valid Java module name
5. The declared module name does not match the module to which the policy is applied

### Package Constraints

6. A package pattern contains empty or malformed segments
7. A package wildcard appears anywhere other than the end of the pattern
8. The pattern `..` or `.*` is used without a package name prefix

### Capability Constraints

9. A capability name is unknown to the implementation
10. A capability is invoked with an invalid number or type of arguments
11. A capability argument fails validation (e.g., invalid glob syntax)

## Static Semantics

### Capability Signatures

Each capability has a fixed signature:

| Capability | Signature | Description |
|------------|-----------|-------------|
| `fs.read` | `(root, glob)` | Read files matching glob under root |
| `fs.write` | `(root, glob)` | Write files matching glob under root |
| `fs.hardlink` | `(root, glob)` | Create hard links under root |
| `network.outbound` | `(hostPattern?, portSpec?)` | Open outbound connections |
| `network.listen` | `(portSpec?)` | Bind server sockets |
| `threads.create` | (no arguments) | Create new threads |
| `native.load` | `(pattern?)` | Load native libraries |
| `env.read` | `(pattern?)` | Read environment variables |
| `system.property.read` | `(pattern?)` | Read system properties |
| `system.property.write` | `(pattern?)` | Write system properties |
| `process.exec` | `(pattern?)` | Execute external processes |
| `crypto.provider` | (no arguments) | Modify JCE providers |

### Argument Details

#### fs.read / fs.write

- `root` — base directory path (string)
- `glob` — glob pattern for matching files (string)

```text
entitle module to fs.read("config", "**/*.json");
entitle module to fs.write("logs", "*.log");
```

#### network.outbound

- `hostPattern` — optional host glob pattern (string)
- `portSpec` — optional port or port range (integer or string)

**Host pattern syntax:**
- `*` — matches exactly one DNS segment
- `**` — matches one or more DNS segments
- Literal segments for exact matching

**Port spec:**
- Integer: `443` — specific port
- String range: `"80-443"` — inclusive range

```text
entitle module to network.outbound;                              // Any
entitle module to network.outbound("*.example.com");             // Host only
entitle module to network.outbound("*", 443);                    // Port only
entitle module to network.outbound("*.example.com", "80-443");   // Both
```

#### network.listen

- `portSpec` — optional port or port range

```text
entitle module to network.listen;              // Any port
entitle module to network.listen(8080);        // Specific port
entitle module to network.listen("8080-8090"); // Port range
```

#### env.read

- `pattern` — optional variable name pattern

```text
entitle module to env.read;          // Any, including bulk access
entitle module to env.read("HOME");  // Specific variable
```

#### system.property.read / write

- `pattern` — optional property key pattern

**Pattern syntax:**
- No argument or `*` — any property (grants bulk access)
- `java.home` — exact match
- `app.**` — matches `app` and all descendants
- `app.*` — matches direct children only

```text
entitle module to system.property.read;
entitle module to system.property.read("java.home");
entitle module to system.property.write("app.**");
```

#### process.exec

- `pattern` — optional command pattern

**Pattern syntax:**
- No argument — any process execution allowed
- `/usr/bin/java` — exact command match
- `/opt/app/bin/*` — wildcard match

```text
entitle module to process.exec;
entitle module to process.exec("/usr/bin/java");
entitle module to process.exec("/opt/app/bin/*");
```

#### crypto.provider

No arguments. Guards all JCE provider modification operations.

```text
entitle com.example.security.. to crypto.provider;
```

### Accumulation of Entitlements

- Multiple entitlements for the same subject are cumulative
- Duplicate entitlements are permitted but deduplicated internally

### Denial Semantics

- Denials remove capabilities from the effective policy
- Denials always take precedence over grants
- A denial matches an entitlement if the capability is equal and the denial's subject encompasses the entitlement's subject

**Subject encompassing rules:**

| Denial Subject | Encompasses |
|----------------|-------------|
| `module` | All subjects |
| `pkg..` | `pkg`, `pkg.sub`, `pkg.sub.child`, etc. |
| `pkg.*` | Direct child packages |
| `pkg` | Only exact package |

### Defensive Denials

When a denial targets a capability that was never granted:

- Without `defensive`: A warning is emitted
- With `defensive`: No warning is emitted

Use `deny(defensive)` for proactive security policies.

### Default Behavior

If no entitlement grants a capability to a subject, that capability is denied.

## Execution Semantics

At runtime, when a guarded operation is attempted:

1. The operation is classified as a capability
2. The calling code is attributed to a `(module, package)`
3. The policy is consulted to determine whether the capability is granted
4. If granted, execution proceeds
5. If not granted, execution fails with `SecurityException`

An implementation fails deterministically when a capability is denied.

## Error Handling

### Policy Violations

When a policy violation occurs, the error includes:

- The attempted capability
- The calling module
- The calling package
- The reason for denial

```
SecurityException: Capability denied
  Module: com.example.myapp
  Package: com.example.myapp.cli
  Attempted: network.outbound
  Reason: not entitled (only com.example.myapp.http is entitled)
```

### Parse Errors

Policy parsing errors identify:

- The error location (line and column)
- The nature of the error

```
Error: module-info.jguard:5:12
  Unknown capability: network.inbound
  Did you mean: network.listen?
```

## Versioning

This specification defines **policy format version 1**.

Future versions may:
- Introduce new capabilities
- Extend capability argument forms
- Add optional policy constructs

Future versions will not change the meaning of valid version-1 policies.

## Relationship to Java Modules

A jGuard policy descriptor is analogous to `module-info.java`:

- Both declare metadata about a module
- Both are non-executable
- Both define boundaries enforced by the runtime

However, a jGuard policy descriptor:

- Does not participate in Java compilation
- Does not affect module resolution
- Is enforced solely by the jGuard agent
