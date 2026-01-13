---
sidebar_position: 1
---

# Contributing to jGuard

Thank you for your interest in contributing to jGuard! This guide explains how to get started.

## Ways to Contribute

- **Report bugs** - Open an issue describing the problem
- **Suggest features** - Open an issue with your idea
- **Improve documentation** - Submit a PR with doc improvements
- **Fix bugs** - Pick up an issue labeled `good first issue`
- **Add capabilities** - Follow the guide below

## Development Setup

### Prerequisites

- JDK 21+
- Gradle 8.5+
- Git

### Clone and Build

```bash
git clone https://github.com/jguard-io/jguard.git
cd jguard
./gradlew build
```

### Run Tests

```bash
./gradlew test
```

### Run Samples

```bash
# Without agent (no enforcement)
cd samples/sandbox-demo && ../../gradlew run

# With agent (enforcement enabled)
cd samples/sandbox-demo && ../../gradlew runWithAgent

# Audit mode (log violations)
cd samples/sandbox-demo && ../../gradlew runWithAgent -Pjguard.mode=audit
```

## Architecture Overview

jGuard uses a two-module architecture for classloader handling:

```
ByteBuddy Advice (interceptors)
       │
       ▼
BootstrapEnforcer.dispatch()  ← bootstrap classloader
       │
       ▼
EnforcementCallback.check()   ← agent classloader
       │
       ▼
PolicyEnforcer.check()        ← category-based dispatch
```

### Modules

| Module | Purpose | Classloader |
|--------|---------|-------------|
| `agent-bootstrap` | Bootstrap classloader classes | Bootstrap |
| `agent` | ByteBuddy instrumentation | System/App |
| `policy` | Policy model and compilation | System/App |
| `policy-java` | Java API for policies | System/App |
| `core` | Public API | System/App |
| `cli` | Command-line tools | System/App |
| `gradle-plugin` | Build integration | Build |

## Adding a New Capability

If your capability uses an existing category (SIMPLE, PORT, HOST_PORT, TARGET_PATTERN, FILESYSTEM), you only need 4 changes:

### Step 1: Add to Operation Enum

```java
// agent-bootstrap/src/main/java/io/jguard/bootstrap/Operation.java
public enum Operation {
  // ...existing operations...
  MY_NEW_OP("my.capability", Category.SIMPLE);
}
```

### Step 2: Add Entry Point

```java
// agent-bootstrap/src/main/java/io/jguard/bootstrap/BootstrapEnforcer.java
public static void onMyOperation(String description) {
  dispatch(Operation.MY_NEW_OP, description, 0);
}
```

### Step 3: Create Interceptor

```java
// agent/src/main/java/io/jguard/agent/MyInterceptor.java
public final class MyInterceptor {
  public static class MyAdvice {
    @Advice.OnMethodEnter
    public static void onEnter() {
      BootstrapEnforcer.onMyOperation("description");
    }
  }
}
```

### Step 4: Wire in AgentInitializer

```java
// agent/src/main/java/io/jguard/agent/AgentInitializer.java
.type(named("java.target.Class"))
.transform((builder, type, loader, module, domain) ->
    builder.visit(Advice.to(MyInterceptor.MyAdvice.class)
        .on(named("targetMethod"))))
```

## Code Style

- Follow existing code patterns
- Use meaningful variable names
- Add Javadoc for public APIs
- Include tests for new functionality

## Pull Request Process

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Run tests: `./gradlew test`
5. Commit with a clear message
6. Push and create a PR

## Questions?

Open an issue at [github.com/jguard-io/jguard/issues](https://github.com/jguard-io/jguard/issues)
