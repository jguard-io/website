---
sidebar_position: 7
---

# Policy Hot Reload

jGuard supports zero-downtime policy updates through hot reload. This allows security policies to be updated at runtime without restarting the JVM.

## Overview

Hot reload monitors external policy files and atomically swaps the active policy when changes are detected.

```
┌─────────────────────────────────────────────────────────────┐
│ Runtime                                                     │
│                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐   │
│  │ PolicyLoader │───▶│ FileWatcher  │───▶│   Atomic     │   │
│  │              │    │ (poll-based) │    │    Swap      │   │
│  └──────────────┘    └──────────────┘    └──────────────┘   │
│         │                   │                    │          │
│         ▼                   ▼                    ▼          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐   │
│  │ policies/    │    │  Detect      │    │ AtomicRef    │   │
│  │ *.bin files  │    │  Changes     │    │ <Enforcer>   │   │
│  └──────────────┘    └──────────────┘    └──────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## When to Use Hot Reload

### Enable Hot Reload When:

| Scenario | Reason |
|----------|--------|
| **Rapid incident response** | Block compromised capabilities without downtime |
| **A/B policy testing** | Test policy changes on production traffic |
| **Gradual rollouts** | Phase in restrictions incrementally |
| **Development/staging** | Iterate on policies without restarts |
| **Multi-tenant environments** | Update tenant policies independently |

### Disable Hot Reload When:

| Scenario | Reason |
|----------|--------|
| **High-security environments** | Prevent runtime policy tampering |
| **Immutable infrastructure** | Policies baked into container images |
| **Audit requirements** | Policy changes require restart/approval |
| **Air-gapped systems** | No external policy directory needed |
| **Performance-critical** | Eliminate file polling overhead |

## Configuration

### Gradle Plugin

```groovy
jguardPolicy {
    // Enable hot reload
    hotReload = true

    // Poll interval in seconds (default: 5)
    hotReloadInterval = 2

    // External policy directories
    externalPoliciesSourceDir = file("policies-src")
    externalPoliciesOutputDir = file("policies")
}
```

### System Properties

```bash
java -Djguard.reload=true \
     -Djguard.reload.interval=5 \
     -Djguard.policy.override=/etc/myapp/policies \
     -javaagent:jguard-agent.jar \
     -jar app.jar
```

| Property | Default | Description |
|----------|---------|-------------|
| `jguard.reload` | `false` | Enable hot reload |
| `jguard.reload.interval` | `5` | Poll interval in seconds |
| `jguard.policy.override` | — | Directory for external policies |

## Example: Incident Response

A vulnerability is discovered in a third-party library. Block its network access immediately without restarting.

### Initial State

The application is running with this external policy:

```text
// policies-src/com.vendor.library.jguard
security module com.vendor.library {
    entitle module to network.outbound("api.vendor.com", 443);
    entitle module to fs.read("config", "**");
}
```

### Incident Response

1. Edit the policy to deny network access:

```text
// policies-src/com.vendor.library.jguard
security module com.vendor.library {
    // INCIDENT: CVE-2024-XXXX - block all network
    deny module to network.outbound;

    entitle module to fs.read("config", "**");
}
```

2. Compile the updated policy:

```bash
./gradlew compileExternalPolicies
```

3. Within the poll interval, the agent detects the change:

```
[INFO] PolicyReloader - Change detected: com.vendor.library.bin
[INFO] PolicyReloader - Policy reloaded successfully
[INFO] PolicyReloader - Denied capabilities: network.outbound
```

4. The library is now blocked from network access - no restart required.

## Example: Gradual Restriction Rollout

Restrict a library's capabilities incrementally to avoid breaking changes.

### Week 1: Audit Mode

```text
security module legacy.library {
    // Audit what the library actually uses
    entitle module to network.outbound;
    entitle module to threads.create;
    entitle module to fs.read("data", "**");
}
```

### Week 2: Restrict Network

After audit shows the library only calls `api.internal.com`:

```text
security module legacy.library {
    // Restrict to observed usage
    entitle module to network.outbound("api.internal.com", 443);
    entitle module to threads.create;
    entitle module to fs.read("data", "**");
}
```

### Week 3: Restrict Threads

After confirming thread usage pattern:

```text
security module legacy.library {
    entitle module to network.outbound("api.internal.com", 443);
    // Remove thread creation - not actually needed
    // entitle module to threads.create;
    entitle module to fs.read("data", "**");
}
```

## Example: Multi-Tenant Policy Updates

Update policies for specific tenants without affecting others.

### Directory Structure

```
/etc/myapp/policies/
├── _global.bin                    # Shared restrictions
├── tenant.acme.bin                # Acme Corp policies
├── tenant.globex.bin              # Globex policies
└── tenant.initech.bin             # Initech policies
```

### Update Single Tenant

```text
// policies-src/tenant.acme.jguard
security module tenant.acme {
    // Acme requested additional network access
    entitle module to network.outbound("*.acme.com", 443);
    entitle module to network.outbound("api.partner.com", 443);  // NEW
    entitle module to fs.read("tenants/acme", "**");
}
```

Compile and the change affects only Acme's module.

## Error Handling

### Compile-Time Validation

Syntax errors are caught during compilation, before they can affect the running system:

```bash
$ ./gradlew compileExternalPolicies

> Task :compileExternalPolicies FAILED
Error: policies-src/com.vendor.library.jguard:5:12
  Unknown capability: network.inbound
  Did you mean: network.listen?
```

The agent continues using the previous valid policy.

### Runtime Error Handling

| Scenario | Behavior |
|----------|----------|
| Corrupted `.bin` file | Keep previous policy, log warning |
| Missing file | Keep previous policy, log warning |
| Invalid policy | Reject at compile time |
| File permission error | Keep previous policy, log error |

### Log Output

```
[INFO]  PolicyReloader - Watching: /etc/myapp/policies
[INFO]  PolicyReloader - Poll interval: 5 seconds
[INFO]  PolicyReloader - Change detected: com.vendor.library.bin
[INFO]  PolicyReloader - Validating new policy...
[INFO]  PolicyReloader - Policy reloaded successfully
[WARN]  PolicyReloader - File corrupted, keeping previous: tenant.acme.bin
```

## Atomic Swap Guarantee

Policy updates are atomic - there's no window where an incomplete policy is active:

```java
// Internal implementation uses AtomicReference
private final AtomicReference<PolicyEnforcer> enforcer = new AtomicReference<>();

void reload(PolicyEnforcer newEnforcer) {
    // Atomic swap - no partial state
    enforcer.set(newEnforcer);
}
```

In-flight operations complete with the old policy. New operations use the new policy.

## Security Considerations

### Protecting the Policy Directory

The external policy directory is a security-sensitive location:

```bash
# Restrict write access
chmod 750 /etc/myapp/policies
chown root:security /etc/myapp/policies

# Consider SELinux/AppArmor policies
# Only allow the deployment system to write
```

### Disabling Hot Reload in Production

For high-security environments, disable hot reload entirely:

```groovy
jguardPolicy {
    hotReload = false
    // Policies baked into signed JARs only
}
```

Or via system property:

```bash
java -Djguard.reload=false -javaagent:jguard-agent.jar -jar app.jar
```

### Immutable Container Deployments

For container deployments with immutable infrastructure:

```dockerfile
# Dockerfile
FROM eclipse-temurin:21-jre

# Bake policies into image
COPY policies/*.bin /app/policies/

# Disable hot reload - policies are immutable
ENV JAVA_OPTS="-Djguard.reload=false"

COPY app.jar /app/
ENTRYPOINT ["java", "-javaagent:jguard-agent.jar", "-jar", "/app/app.jar"]
```

### Audit Trail

For compliance, log all policy changes:

```bash
# Monitor policy directory for changes
inotifywait -m -e modify,create,delete /etc/myapp/policies/ | \
  while read event; do
    echo "$(date) POLICY_CHANGE: $event" >> /var/log/security/policy-audit.log
  done
```

## Performance Impact

| Configuration | Overhead |
|---------------|----------|
| Hot reload disabled | None |
| Hot reload enabled (5s interval) | ~1ms per interval (file stat) |
| Hot reload enabled (1s interval) | ~1ms per interval |

The overhead is minimal - just file modification time checks, not file reads.

## Best Practices

1. **Use short intervals for development** (1-2 seconds)
2. **Use longer intervals for production** (30-60 seconds) if enabled
3. **Disable in high-security environments** where policy changes require restart
4. **Protect the policy directory** with appropriate permissions
5. **Monitor policy changes** for audit and alerting
6. **Test policy changes in staging** before production hot reload
7. **Keep previous policy versions** for rollback

## Next Steps

- [External Policies](/docs/policy/external-policies) - Grant/deny semantics
- [Gradle Plugin](./gradle-plugin) - Build configuration
- [Multi-Module Applications](/docs/use-cases/multi-tenant) - Module isolation
