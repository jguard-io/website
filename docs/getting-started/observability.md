---
sidebar_position: 9
---

# Observability

jGuard provides built-in observability for denial events, making it easy to detect when operations are blocked — even when third-party libraries silently swallow `SecurityException`.

## The Problem: Swallowed Denials

When jGuard denies an operation in STRICT mode, it throws `SecurityException`. However, many legacy and third-party libraries catch `Exception` broadly:

```java
// Common pattern in third-party libraries
try {
    doSomething(); // jGuard throws SecurityException
} catch (Exception e) {
    // Silently swallowed — the library continues with degraded behavior
}
```

This causes silent degradation that's extremely difficult to diagnose. The application appears to work, but security-sensitive operations are failing silently.

## Mode-Aware Log Levels

jGuard logs every denial *before* throwing the exception, ensuring the log entry is visible regardless of what catches the exception.

| Mode | Log Level | Behavior |
|------|-----------|----------|
| **STRICT** | `ERROR` | Denials logged at ERROR, then `SecurityException` thrown |
| **PERMISSIVE** | `WARN` | Denials logged at WARN, then `SecurityException` thrown (errors allowed) |
| **AUDIT** | `WARN` | Denials logged at WARN, operation allowed |

In STRICT mode, denials appear as ERROR lines:

```
ERROR [jguard] DENIED network.outbound: package=com.vendor.lib.http, module=com.vendor.lib, args=[api.example.com:443]
```

This makes swallowed denials impossible to miss when monitoring ERROR-level logs — which most production logging configurations already alert on.

## JMX Denial Counters

jGuard registers an always-on JMX MBean at `io.jguard:type=DenialCounters` that tracks denial counts in real time. No configuration needed — it's active from the moment the agent starts.

### Available Metrics

| Attribute | Description |
|-----------|-------------|
| `TotalDenials` | Total denial count across all operations |
| `FsReadDenials` | File read denials |
| `FsWriteDenials` | File write denials |
| `FsHardlinkDenials` | Hard link creation denials |
| `NetConnectDenials` | Outbound network connection denials |
| `NetListenDenials` | Server socket binding denials |
| `ThreadCreateDenials` | Thread creation denials |
| `NativeLoadDenials` | Native library loading denials |
| `EnvReadDenials` | Environment variable read denials |
| `PropReadDenials` | System property read denials |
| `PropWriteDenials` | System property write denials |
| `ProcessExecDenials` | Process execution denials |
| `CryptoProviderDenials` | Crypto provider modification denials |
| `RuntimeExitDenials` | JVM exit denials |
| `RuntimeShutdownHookDenials` | Shutdown hook registration denials |

### Viewing with JConsole

1. Start your application with jGuard
2. Open JConsole: `jconsole`
3. Connect to your application
4. Navigate to **MBeans** → **io.jguard** → **DenialCounters**

### Viewing with VisualVM

1. Open VisualVM
2. Connect to your application
3. Open the **MBeans** tab
4. Expand `io.jguard` → `DenialCounters` → `Attributes`

### Programmatic Access

Access counters from your own code via the JMX API:

```java
import javax.management.*;
import java.lang.management.ManagementFactory;

MBeanServer server = ManagementFactory.getPlatformMBeanServer();
ObjectName name = new ObjectName("io.jguard:type=DenialCounters");

long total = (long) server.getAttribute(name, "TotalDenials");
long netDenials = (long) server.getAttribute(name, "NetConnectDenials");

if (total > 0) {
    log.warn("jGuard denied {} operations ({} network)", total, netDenials);
}
```

### Prometheus Integration

Use the [JMX Exporter](https://github.com/prometheus/jmx_exporter) to expose denial counters as Prometheus metrics:

```yaml
# jmx_exporter_config.yaml
rules:
  - pattern: 'io.jguard<type=DenialCounters><>(\w+)'
    name: jguard_denial_$1
    type: COUNTER
    help: "jGuard denial count for $1"
```

Then alert on non-zero denial counts:

```yaml
# prometheus alert rule
groups:
  - name: jguard
    rules:
      - alert: JGuardDenialsDetected
        expr: jguard_denial_TotalDenials > 0
        for: 1m
        labels:
          severity: warning
        annotations:
          summary: "jGuard denials detected on {{ $labels.instance }}"
```

### Datadog / Other APM

Most APM tools can collect JMX metrics. Configure your agent to collect from the `io.jguard` domain:

```yaml
# datadog jmx conf
instances:
  - jmx_url: "service:jmx:rmi:///jndi/rmi://localhost:9999/jmxrmi"
    conf:
      - include:
          domain: io.jguard
          attribute:
            TotalDenials:
              metric_type: counter
              alias: jguard.denials.total
```

## Policy Discovery Debug Logging

Enable debug logging to see exactly how policies are discovered:

```bash
java -Djguard.log.level=debug -javaagent:jguard-agent.jar -jar app.jar
```

Or via Gradle:

```bash
./gradlew runWithAgent -Pjguard.logLevel=debug
```

Debug output shows:
- Which JARs on the classpath contain policies
- External policy entries found in `META-INF/jguard/external/`
- The final assembled list of module policies
- Override directory scanning results

## Recommended Production Setup

1. **Run in STRICT mode** — denials log at ERROR and throw `SecurityException`
2. **Monitor ERROR logs** — most logging pipelines already alert on ERROR
3. **Expose JMX counters** — wire into your existing monitoring (Prometheus, Datadog, etc.)
4. **Alert on non-zero denials** — any denial in production likely indicates a missing entitlement or a library misbehaving
5. **Use debug logging for diagnostics** — temporarily enable when troubleshooting policy issues

## Next Steps

- [Your First Policy](./first-policy) - Write a policy using audit mode
- [Gradle Plugin](./gradle-plugin) - Build integration
- [Policy Reference](/docs/policy/overview) - All capabilities
