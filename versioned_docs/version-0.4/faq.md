---
sidebar_position: 100
---

# Frequently Asked Questions

## General

### What is jGuard?

jGuard is a capability-based security framework for JDK 21+ that enables JVM applications to execute untrusted code with explicit, least-privilege access controls.

### Why do I need jGuard?

The Java Security Manager was deprecated in Java 17 (JEP 411) and fully removed in JDK 24. If your application needs to:

- Execute plugins or extensions safely
- Sandbox untrusted code
- Enforce least-privilege access
- Audit security-sensitive operations

Then jGuard provides a modern solution.

### How is jGuard different from the Java Security Manager?

| Aspect | Java Security Manager | jGuard |
|--------|----------------------|--------|
| Status | Removed in JDK 24 | Modern, actively developed |
| Model | Permission-based | Capability-based |
| Granularity | Stack inspection | Module + package |
| Configuration | Policy files | `module-info.jguard` DSL |
| Module awareness | Pre-JPMS | Native JPMS integration |

### What JDK versions are supported?

jGuard requires JDK 21 or later. It's tested on:

- OpenJDK 21
- OpenJDK 22
- OpenJDK 23
- OpenJDK 24+

### Is jGuard production ready?

Yes! jGuard 0.4.0 is production ready with:

- Comprehensive enforcement capabilities
- Multiple execution modes (STRICT, PERMISSIVE, AUDIT)
- Policy hot reload for zero-downtime updates
- Signed JAR verification

## Policy

### What capabilities are supported?

jGuard supports 14 capabilities:

- `fs.read`, `fs.write`, `fs.hardlink` - Filesystem access
- `network.outbound`, `network.listen` - Network access
- `threads.create` - Thread creation
- `native.load` - Native library loading
- `env.read` - Environment variables
- `system.property.read`, `system.property.write` - System properties
- `process.exec` - Process execution
- `crypto.provider` - JCE crypto provider modification
- `runtime.exit`, `runtime.shutdown_hook` - JVM lifecycle control

### Can I add custom capabilities?

Not currently. Capabilities are tied to JDK instrumentation points. However, the existing capabilities cover the most common security-sensitive operations.

### How do I know what capabilities my application needs?

Run in `audit` mode to discover what your application attempts:

```bash
./gradlew runWithAgent -Pjguard.mode=audit
```

The audit log shows every operation that would be blocked in strict mode.

### Can I override a library's embedded policy?

Yes! External policies can grant or deny capabilities:

```text
// Restrict a library's permissions
security module com.vendor.library {
    deny module to network.outbound;
    deny module to native.load;
}
```

## Deployment

### How do I deploy jGuard in production?

1. Compile your policy: `jguardc -o policy.bin module-info.jguard`
2. Sign your JARs (optional but recommended)
3. Run with the agent:

```bash
java -javaagent:jguard-agent.jar=policy.bin \
     -Djguard.mode=strict \
     -jar your-app.jar
```

### Can I update policies without restarting?

Yes! Enable hot reload:

```bash
java -javaagent:jguard-agent.jar=policy.bin \
     -Djguard.reload=true \
     -Djguard.reload.interval=5 \
     -jar your-app.jar
```

### What happens if a violation occurs?

In `strict` mode, a `SecurityException` is thrown with details:

```
SecurityException: Access denied - module 'com.example.app'
package 'com.example.app.untrusted' is not entitled to 'network.outbound'
```

In `audit` mode, violations are logged but not blocked.

## Performance

### What's the performance overhead?

jGuard is designed for minimal overhead:

- Single-dispatch architecture
- Decision caching
- Efficient bytecode instrumentation

Typical overhead is sub-millisecond per operation.

### Does jGuard affect startup time?

There's a small startup cost for agent initialization and bytecode transformation. This is typically a few hundred milliseconds.

## Troubleshooting

### My application doesn't start with the agent

Check that:

1. You're using JDK 21+
2. The policy file exists and is valid
3. System properties are correct

Run with debug logging:

```bash
java -Djguard.log.level=debug -javaagent:jguard-agent.jar ...
```

### Why is a capability being denied?

1. Check the subject pattern matches your package
2. Verify the capability syntax is correct
3. Run `jguard inspect` to see the compiled policy

### How do I report a bug?

Open an issue at [github.com/jguard-io/jguard/issues](https://github.com/jguard-io/jguard/issues)
