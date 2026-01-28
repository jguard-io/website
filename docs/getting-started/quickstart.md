---
sidebar_position: 3
---

# Quickstart

This guide walks you through creating a secured application with jGuard in under 5 minutes.

## 1. Create a New Project

```bash
mkdir jguard-demo && cd jguard-demo
gradle init --type java-application
```

## 2. Add jGuard

Edit `build.gradle`:

```groovy
plugins {
    id "java"
    id "application"
    id "io.jguard.policy" version "0.3.1"
}

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(21)
    }
}

application {
    mainClass = "com.example.App"
}

dependencies {
    implementation("io.jguard:jguard-core:0.3.1")
}
```

## 3. Create a Policy

Create `src/main/java/module-info.jguard`:

```text
security module com.example.demo {
    // Allow the http package to make network connections
    entitle com.example.demo.http.. to network.outbound;

    // Allow reading configuration files
    entitle module to fs.read(config, "*.properties");

    // Allow reading system properties (needed by many JDK classes)
    entitle module to system.property.read;
}
```

## 4. Write Some Code

Create `src/main/java/com/example/App.java`:

```java
package com.example;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

public class App {
    public static void main(String[] args) throws Exception {
        // This will be BLOCKED - App class is in com.example, not com.example.demo.http
        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create("https://api.github.com"))
            .build();

        HttpResponse<String> response = client.send(request,
            HttpResponse.BodyHandlers.ofString());

        System.out.println("Response: " + response.statusCode());
    }
}
```

## 5. Run Without jGuard

```bash
./gradlew run
```

Output:
```
Response: 200
```

The request succeeds because no security is enforced.

## 6. Run With jGuard

```bash
./gradlew runWithAgent
```

Output:
```
SecurityException: Access denied - module 'com.example.demo'
package 'com.example' is not entitled to 'network.outbound'
```

The request is blocked because `com.example.App` is not in the `com.example.demo.http..` package hierarchy.

## 7. Fix the Policy

Move the code to an entitled package, or update the policy:

```text
security module com.example.demo {
    // Now allow the entire module to make network connections
    entitle module to network.outbound;

    entitle module to fs.read(config, "*.properties");
    entitle module to system.property.read;
}
```

Run again:

```bash
./gradlew runWithAgent
```

Output:
```
Response: 200
```

## Execution Modes

jGuard supports three enforcement modes:

| Mode | Behavior | Use Case |
|------|----------|----------|
| `strict` | Block violations, fail on errors | Production |
| `permissive` | Block violations, allow on errors | Migration |
| `audit` | Log violations without blocking | Development |

```bash
# Audit mode - see what would be blocked
./gradlew runWithAgent -Pjguard.mode=audit
```

## Next Steps

- [Write your first policy](./first-policy) - Learn the policy language in depth
- [Capabilities reference](/docs/policy/overview) - All available capabilities
- [Use cases](/docs/use-cases/overview) - Real-world examples
