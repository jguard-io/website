---
sidebar_position: 1
---

# Policy Reference

jGuard uses a declarative policy language to define what code is permitted to do. Policies are defined in `module-info.jguard` files and compiled to binary format for runtime enforcement.

## Core Concepts

### Capabilities, Not Permissions

Unlike traditional permission systems, jGuard uses **capabilities**:

- **Permission**: "Does this code have permission X?"
- **Capability**: "This code can do X, Y, and Z"

Capabilities are explicit grants. If a capability isn't granted, the operation is denied.

### Deny by Default

jGuard operates on a **deny-by-default** model:

```
✗ Not entitled → BLOCKED
✓ Entitled     → ALLOWED
```

This is the safest default posture. You must explicitly grant every capability your code needs.

### Modules as Principals

jGuard uses JPMS module identity as the security boundary:

- Each module has its own policy
- Packages within a module can have different entitlements
- Module identity is verified through signed JARs in production

## Policy File Format

Policies are defined in `module-info.jguard`:

```text
security module com.example.myapp {
    entitle <subject> to <capability>;
    entitle <subject> to <capability>;
    ...
}
```

### Subject Patterns

| Pattern | Matches |
|---------|---------|
| `module` | Entire module |
| `com.example` | Exact package |
| `com.example.*` | Direct subpackages only |
| `com.example..` | Package and all descendants |

### Example Policy

```text
security module com.example.webapp {
    // Module-wide system property access
    entitle module to system.property.read;

    // Package-specific network access
    entitle com.example.webapp.http.. to network.outbound;

    // Server can bind ports
    entitle com.example.webapp.server to network.listen("8080-8443");

    // Workers can create threads
    entitle com.example.webapp.worker.. to threads.create;
}
```

## Supported Capabilities

jGuard v0.4.0 supports 14 capabilities across 9 categories.

### Filesystem

#### fs.read(root, glob)

Read files matching a glob pattern under a root directory.

```text
entitle module to fs.read("config", "**");        // Any file under config/
entitle module to fs.read("/data", "*.json");     // JSON files in /data
entitle module to fs.read(".", "*.txt");          // Text files in current dir
```

**Instrumented APIs:**
- `java.nio.file.Files`: newInputStream, newBufferedReader, readAllBytes, readAllLines, readString, lines, list, walk, find
- `java.io.FileInputStream`, `java.io.FileReader`
- `java.io.RandomAccessFile` (read mode)
- `java.nio.channels.FileChannel.open()`

#### fs.write(root, glob)

Write files matching a glob pattern under a root directory.

```text
entitle module to fs.write("build", "**");        // Any file under build/
entitle module to fs.write("logs", "*.log");      // Log files only
```

**Instrumented APIs:**
- `java.nio.file.Files`: newOutputStream, newBufferedWriter, write, writeString, copy, move, createFile, createDirectory, createDirectories, delete, deleteIfExists
- `java.io.FileOutputStream`, `java.io.FileWriter`

#### fs.hardlink(root, glob)

Create hard links to files under a root directory.

```text
entitle module to fs.hardlink("data/indices", "**");  // Allow hard links in indices
```

:::warning Security Note
Hard links can bypass filesystem boundaries by creating alternative paths to files. Only grant this capability when truly necessary.
:::

**Instrumented APIs:**
- `java.nio.file.Files.createLink()`

### Network

#### network.outbound(hostPattern?, portSpec?)

Make outbound network connections.

```text
// Any host, any port
entitle module to network.outbound;

// Host pattern, any port
entitle module to network.outbound("*.example.com");

// Any host, specific port
entitle module to network.outbound("*", 443);

// Host pattern + port range
entitle module to network.outbound("*.example.com", "80-443");
```

**Host Patterns:**

| Pattern | Matches | Example |
|---------|---------|---------|
| `*` | Exactly one DNS segment | `*.example.com` matches `api.example.com` |
| `**` | One or more DNS segments | `**.example.com` matches `a.b.c.example.com` |

Host matching is case-insensitive with IDN normalization.

**Port Specs:**

| Format | Example | Description |
|--------|---------|-------------|
| Integer | `443` | Single port |
| String range | `"80-443"` | Inclusive port range |

**Instrumented APIs:**
- `java.net.Socket`: constructors, connect()
- `java.nio.channels.SocketChannel.connect()`

#### network.listen(portSpec?)

Bind server sockets to listen for connections.

```text
entitle module to network.listen;              // Any port
entitle module to network.listen(8080);        // Specific port
entitle module to network.listen("8080-8090"); // Port range
```

**Instrumented APIs:**
- `java.net.ServerSocket`: constructors, bind()
- `java.nio.channels.ServerSocketChannel.bind()`

### Concurrency

#### threads.create

Create new threads.

```text
entitle com.example.app.worker.. to threads.create;
```

**Instrumented APIs:**
- `java.lang.Thread.start()`

### Native Code

#### native.load(pattern?)

Load native libraries via JNI.

```text
entitle module to native.load;           // Any library
entitle module to native.load("mylib*"); // Library name pattern
```

**Instrumented APIs:**
- `java.lang.System`: loadLibrary(), load()
- `java.lang.Runtime`: loadLibrary(), load()

### Environment

#### env.read(pattern?)

Read environment variables.

```text
entitle module to env.read;          // Any env var (including bulk access)
entitle module to env.read("HOME");  // Specific variable
entitle module to env.read("APP_*"); // Pattern match
```

:::note Bulk API Gating
`System.getenv()` with no arguments requires the no-arg form or explicit `*` pattern.
:::

**Instrumented APIs:**
- `java.lang.System`: getenv(), getenv(String)

### System Properties

#### system.property.read(pattern?)

Read system properties.

```text
entitle module to system.property.read;              // Any property
entitle module to system.property.read("java.home"); // Specific property
entitle module to system.property.read("app.**");    // All descendants
entitle module to system.property.read("app.*");     // Direct children only
```

:::note Bulk API Gating
`System.getProperties()` requires the no-arg form or explicit `*` pattern.
:::

**Instrumented APIs:**
- `java.lang.System`: getProperty(String), getProperty(String, String), getProperties()

#### system.property.write(pattern?)

Write system properties.

```text
entitle module to system.property.write;              // Any property
entitle module to system.property.write("app.config"); // Specific property
entitle module to system.property.write("app.**");    // All descendants
```

:::note Bulk API Gating
`System.setProperties()` requires the no-arg form or explicit `*` pattern.
:::

**Instrumented APIs:**
- `java.lang.System`: setProperty(), setProperties(), clearProperty()

### Process Execution

#### process.exec(pattern?)

Execute external processes.

```text
entitle module to process.exec;                    // Any process
entitle module to process.exec("/usr/bin/java");   // Specific command
entitle module to process.exec("/opt/app/bin/*");  // Pattern match
```

:::danger Security Warning
Process execution is one of the most dangerous capabilities. Only grant to trusted code that absolutely requires it.
:::

**Instrumented APIs:**
- `java.lang.Runtime`: exec(String), exec(String[])
- `java.lang.ProcessBuilder.start()`

### Cryptography

#### crypto.provider

Modify JCE cryptographic providers.

```text
entitle com.example.security.. to crypto.provider;
```

This capability guards installation and removal of JCE security providers, preventing rogue crypto implementations.

**Instrumented APIs:**
- `java.security.Security`: addProvider(), insertProviderAt(), removeProvider(), setProperty()

### Runtime Lifecycle

#### runtime.exit

Terminate the JVM. Prevents rogue libraries from calling `System.exit()` and killing your application.

```text
entitle com.example.main to runtime.exit;
```

:::danger Server Uptime
Without this restriction, any library (like embedded databases or ML frameworks) could terminate your server, destroying uptime SLAs.
:::

**Instrumented APIs:**
- `java.lang.System.exit(int)`
- `java.lang.Runtime`: exit(int), halt(int)

#### runtime.shutdown_hook

Register JVM shutdown hooks. Prevents libraries from installing hooks that could interfere with graceful shutdown.

```text
entitle com.example.lifecycle.. to runtime.shutdown_hook;
```

**Instrumented APIs:**
- `java.lang.Runtime`: addShutdownHook(Thread), removeShutdownHook(Thread)

## Capability Summary Table

| Capability | Arguments | Example |
|------------|-----------|---------|
| `fs.read` | root, glob | `fs.read("config", "**/*.json")` |
| `fs.write` | root, glob | `fs.write("logs", "*.log")` |
| `fs.hardlink` | root, glob | `fs.hardlink("data", "**")` |
| `network.outbound` | host?, port? | `network.outbound("*.example.com", 443)` |
| `network.listen` | port? | `network.listen("8080-8090")` |
| `threads.create` | none | `threads.create` |
| `native.load` | pattern? | `native.load("mylib*")` |
| `env.read` | pattern? | `env.read("HOME")` |
| `system.property.read` | pattern? | `system.property.read("java.*")` |
| `system.property.write` | pattern? | `system.property.write("app.**")` |
| `process.exec` | pattern? | `process.exec("/usr/bin/*")` |
| `crypto.provider` | none | `crypto.provider` |
| `runtime.exit` | none | `runtime.exit` |
| `runtime.shutdown_hook` | none | `runtime.shutdown_hook` |

## Enforcement Modes

| Mode | Behavior | Use Case |
|------|----------|----------|
| **STRICT** (default) | Block denied access, block on errors | Production - fail secure |
| **PERMISSIVE** | Block denied access, allow on errors | Migration - allow recovery |
| **AUDIT** | Log only, never block | Policy development |

Override at runtime:

```bash
./gradlew runWithAgent -Pjguard.mode=audit
```

Or via system property:

```bash
java -Djguard.mode=audit -javaagent:jguard-agent.jar -jar app.jar
```

## Policy Lifecycle

```
┌─────────────────┐
│ module-info     │
│   .jguard       │ ← Source (human-readable)
└────────┬────────┘
         │ jguardc / Gradle plugin
         ▼
┌─────────────────┐
│  policy.bin     │ ← Binary (runtime)
└────────┬────────┘
         │ Embedded in JAR
         ▼
┌─────────────────┐
│ META-INF/jguard │
│   /policy.bin   │ ← Shipped with application
└─────────────────┘
```

## Next Steps

- [External Policies](./external-policies) - Grant/deny semantics for third-party code
- [Getting Started](/docs/getting-started) - Installation and quickstart
- [Use Cases](/docs/use-cases/overview) - Real-world examples
