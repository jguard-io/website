---
sidebar_position: 2
---

# Installation

jGuard requires JDK 21 or later. This guide covers installation via Gradle (recommended) and Maven.

## Prerequisites

- **JDK 21+** - jGuard uses modern JVM features
- **Gradle 8.5+** or **Maven 3.8+**

## Gradle (Recommended)

### Add the Plugin

Add the jGuard Gradle plugin to your `build.gradle`:

```groovy
plugins {
    id "java"
    id "application"
    id "io.jguard.policy" version "0.3.0"
}

dependencies {
    implementation("io.jguard:jguard-core:0.3.0")
}
```

### Configure the Plugin

```groovy
jguardPolicy {
    // Policy source file (default: src/main/java/module-info.jguard)
    sourceFile = file("src/main/java/module-info.jguard")

    // Enforcement mode: strict, permissive, or audit
    mode = "strict"

    // Log level: error, warn, info, debug, trace
    logLevel = "info"
}
```

### Create Your Policy

Create `src/main/java/module-info.jguard`:

```text
security module com.example.myapp {
    entitle module to fs.read(config, "**");
}
```

### Run with Enforcement

```bash
# Run with the jGuard agent attached
./gradlew runWithAgent

# Run in audit mode (log violations, don't block)
./gradlew runWithAgent -Pjguard.mode=audit
```

## Maven

### Add Dependencies

Add to your `pom.xml`:

```xml
<dependencies>
    <dependency>
        <groupId>io.jguard</groupId>
        <artifactId>jguard-core</artifactId>
        <version>0.3.0</version>
    </dependency>
</dependencies>
```

### Manual Agent Configuration

Download the agent JAR and run manually:

```bash
# Download agent
curl -O https://repo1.maven.org/maven2/io/jguard/jguard-agent/0.3.0/jguard-agent-0.3.0.jar

# Compile policy
java -jar jguard-cli-0.3.0.jar compile -o policy.bin module-info.jguard

# Run with agent
java -javaagent:jguard-agent-0.3.0.jar=policy.bin \
     -Djguard.mode=strict \
     -jar your-app.jar
```

## Artifacts

jGuard publishes the following artifacts:

| Artifact | Description | Link |
|----------|-------------|------|
| `io.jguard:jguard-core` | Public API for applications | [Maven Central](https://central.sonatype.com/artifact/io.jguard/jguard-core) |
| `io.jguard:jguard-policy` | Policy model and compilation | [Maven Central](https://central.sonatype.com/artifact/io.jguard/jguard-policy) |
| `io.jguard:jguard-agent` | Runtime enforcement agent | [Maven Central](https://central.sonatype.com/artifact/io.jguard/jguard-agent) |
| `io.jguard:jguard-cli` | Command-line tools | [Maven Central](https://central.sonatype.com/artifact/io.jguard/jguard-cli) |
| `io.jguard.policy` | Gradle plugin | [Gradle Plugin Portal](https://plugins.gradle.org/plugin/io.jguard.policy) |

## Next Steps

- [Quickstart](./quickstart) - Run your first secured application
- [Write your first policy](./first-policy) - Learn the policy language
