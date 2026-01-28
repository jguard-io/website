---
sidebar_position: 8
---

# Multi-Module Tutorial

This tutorial walks through building a multi-module application with jGuard, demonstrating auto-discovery, module isolation, and the delegation pattern.

## Project Structure

We'll build an application with three modules:

```
myapp/
├── settings.gradle
├── core/                    # File access module
│   ├── build.gradle
│   └── src/main/java/
│       ├── module-info.java
│       └── module-info.jguard
├── network/                 # Network access module
│   ├── build.gradle
│   └── src/main/java/
│       ├── module-info.java
│       └── module-info.jguard
└── app/                     # Main application
    ├── build.gradle
    └── src/main/java/
        ├── module-info.java
        └── module-info.jguard
```

## Step 1: Configure the Root Project

### settings.gradle

```groovy
rootProject.name = 'myapp'

include 'core'
include 'network'
include 'app'
```

### build.gradle (root)

```groovy
plugins {
    id 'java'
}

subprojects {
    apply plugin: 'java'

    java {
        toolchain {
            languageVersion = JavaLanguageVersion.of(21)
        }
    }

    repositories {
        mavenCentral()
    }
}
```

## Step 2: Create the Core Module

The core module handles file access. Other modules delegate file operations to it.

### core/build.gradle

```groovy
plugins {
    id 'java-library'
    id 'io.jguard.policy' version '0.3.1'
}

jguardPolicy {
    allowUnsignedPolicies = true  // Development only
}
```

### core/src/main/java/module-info.java

```java
module com.example.core {
    exports com.example.core;
}
```

### core/src/main/java/module-info.jguard

```text
security module com.example.core {
    // Core module can read configuration files
    entitle module to fs.read("config", "**");

    // And text files in the current directory
    entitle module to fs.read(".", "*.txt");

    // Read system properties for configuration
    entitle module to system.property.read;
}
```

### core/src/main/java/com/example/core/ConfigReader.java

```java
package com.example.core;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

public class ConfigReader {

    public String readConfig(String filename) throws IOException {
        Path path = Path.of("config", filename);
        return Files.readString(path);
    }

    public String readTextFile(String filename) throws IOException {
        Path path = Path.of(filename);
        return Files.readString(path);
    }
}
```

## Step 3: Create the Network Module

The network module handles all outbound connections.

### network/build.gradle

```groovy
plugins {
    id 'java-library'
    id 'io.jguard.policy' version '0.3.1'
}

jguardPolicy {
    allowUnsignedPolicies = true
}
```

### network/src/main/java/module-info.java

```java
module com.example.network {
    exports com.example.network;
}
```

### network/src/main/java/module-info.jguard

```text
security module com.example.network {
    // Network module can connect to specific hosts
    entitle module to network.outbound("*.example.com", 443);
    entitle module to network.outbound("api.github.com", 443);

    // Localhost for development
    entitle module to network.outbound("localhost", "8080-8090");
    entitle module to network.outbound("127.0.0.1", "8080-8090");

    // May need threads for async operations
    entitle module to threads.create;

    // Read system properties for proxy configuration
    entitle module to system.property.read;
}
```

### network/src/main/java/com/example/network/ApiClient.java

```java
package com.example.network;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

public class ApiClient {
    private final HttpClient client = HttpClient.newHttpClient();
    private final String baseUrl;

    public ApiClient(String baseUrl) {
        this.baseUrl = baseUrl;
    }

    public String get(String path) throws IOException, InterruptedException {
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(baseUrl + path))
            .GET()
            .build();

        HttpResponse<String> response = client.send(
            request,
            HttpResponse.BodyHandlers.ofString()
        );

        return response.body();
    }
}
```

## Step 4: Create the App Module

The app module orchestrates core and network, but cannot directly access files or network.

### app/build.gradle

```groovy
plugins {
    id 'application'
    id 'io.jguard.policy' version '0.3.1'
}

application {
    mainClass = 'com.example.app.Main'
    mainModule = 'com.example.app'
}

dependencies {
    implementation project(':core')
    implementation project(':network')
}

jguardPolicy {
    discoveryMode = true           // Auto-discover module policies
    allowUnsignedPolicies = true   // Development only
}
```

### app/src/main/java/module-info.java

```java
module com.example.app {
    requires com.example.core;
    requires com.example.network;
}
```

### app/src/main/java/module-info.jguard

```text
security module com.example.app {
    // App can create threads for parallelism
    entitle module to threads.create;

    // Read environment for configuration
    entitle module to env.read("HOME");
    entitle module to env.read("USER");
    entitle module to env.read("APP_*");

    // Read system properties
    entitle module to system.property.read;

    // NOTE: No fs.read, no network.outbound
    // App delegates these to core and network modules
}
```

### app/src/main/java/com/example/app/Main.java

```java
package com.example.app;

import com.example.core.ConfigReader;
import com.example.network.ApiClient;

public class Main {
    public static void main(String[] args) throws Exception {
        // This works - delegating to core module
        ConfigReader config = new ConfigReader();
        String appConfig = config.readConfig("app.properties");
        System.out.println("Config: " + appConfig);

        // This works - delegating to network module
        ApiClient api = new ApiClient("https://api.github.com");
        String response = api.get("/zen");
        System.out.println("GitHub says: " + response);

        // This would FAIL - app module not entitled to fs.read
        // Files.readString(Path.of("config/secret.txt"));

        // This would FAIL - app module not entitled to network.outbound
        // new Socket("evil.com", 443);

        System.out.println("Application completed successfully!");
    }
}
```

## Step 5: Run with jGuard

### Development Mode

```bash
./gradlew :app:runWithAgent
```

Output:
```
[INFO] jGuard Agent initialized
[INFO] Discovered policies:
  - com.example.core (unsigned, allowed in dev mode)
  - com.example.network (unsigned, allowed in dev mode)
  - com.example.app (unsigned, allowed in dev mode)
Config: app.name=MyApp
GitHub says: Keep it logically awesome.
Application completed successfully!
```

### Audit Mode

Discover what capabilities your code actually needs:

```bash
./gradlew :app:runWithAgent -Pjguard.mode=audit
```

### Strict Mode

Enforce policies strictly (default):

```bash
./gradlew :app:runWithAgent -Pjguard.mode=strict
```

## Understanding Module Isolation

### What Works

| Caller | Operation | Result | Why |
|--------|-----------|--------|-----|
| `com.example.app` | `config.readConfig()` | Allowed | Delegates to `com.example.core` |
| `com.example.app` | `api.get()` | Allowed | Delegates to `com.example.network` |
| `com.example.core` | `Files.readString()` | Allowed | Has `fs.read` entitlement |
| `com.example.network` | `HttpClient.send()` | Allowed | Has `network.outbound` entitlement |

### What's Blocked

| Caller | Operation | Result | Why |
|--------|-----------|--------|-----|
| `com.example.app` | `Files.readString()` | Blocked | No `fs.read` entitlement |
| `com.example.app` | `new Socket()` | Blocked | No `network.outbound` entitlement |
| `com.example.core` | `new Socket()` | Blocked | No `network.outbound` entitlement |
| `com.example.network` | `Files.readString()` | Blocked | No `fs.read` entitlement |

### Error Messages

When a blocked operation is attempted:

```
SecurityException: Capability denied
  Module: com.example.app
  Package: com.example.app
  Attempted: fs.read
  Reason: not entitled (only com.example.core is entitled to fs.read)
```

## Auto-Discovery in Action

When the agent starts, it discovers policies from all modules:

```
[INFO] PolicyDiscovery - Scanning module path...
[INFO] PolicyDiscovery - Found: core-1.0.jar
[INFO] PolicyDiscovery - Extracted: META-INF/jguard/policy.bin
[INFO] PolicyDiscovery - Module: com.example.core
[INFO] PolicyDiscovery - Found: network-1.0.jar
[INFO] PolicyDiscovery - Extracted: META-INF/jguard/policy.bin
[INFO] PolicyDiscovery - Module: com.example.network
[INFO] PolicyDiscovery - Found: app-1.0.jar
[INFO] PolicyDiscovery - Extracted: META-INF/jguard/policy.bin
[INFO] PolicyDiscovery - Module: com.example.app
[INFO] PolicyDiscovery - Loaded 3 module policies
```

## Production: JAR Signing

For production, sign your JARs:

### Generate a Keystore

```bash
keytool -genkeypair \
  -alias myapp \
  -keyalg RSA \
  -keysize 2048 \
  -validity 365 \
  -keystore keystore.jks \
  -storepass changeit
```

### Sign JARs in Gradle

```groovy
// In each module's build.gradle
jar {
    doLast {
        ant.signjar(
            jar: archiveFile.get().asFile,
            keystore: rootProject.file("keystore.jks"),
            storepass: "changeit",
            alias: "myapp"
        )
    }
}
```

### Disable Unsigned Policies

```groovy
jguardPolicy {
    discoveryMode = true
    allowUnsignedPolicies = false  // Production!
}
```

## Adding External Policy Overrides

Restrict a module at deployment time without rebuilding:

### Create Override Directory

```
myapp/
└── policies-src/
    └── com.example.network.jguard
```

### Override Policy

```text
// policies-src/com.example.network.jguard
security module com.example.network {
    // Production: only allow specific hosts
    deny module to network.outbound;
    entitle module to network.outbound("api.github.com", 443);

    // No localhost in production
    // (localhost entitlements removed)
}
```

### Configure Hot Reload

```groovy
jguardPolicy {
    hotReload = true
    externalPoliciesSourceDir = file("policies-src")
    externalPoliciesOutputDir = file("policies")
}
```

## Summary

This tutorial demonstrated:

1. **Module isolation** - Each module has its own policy
2. **Delegation pattern** - App delegates sensitive operations to specialized modules
3. **Auto-discovery** - Agent finds policies in signed JARs
4. **External overrides** - Restrict modules at deployment time
5. **Hot reload** - Update policies without restart

## Next Steps

- [Hot Reload](./hot-reload) - Zero-downtime policy updates
- [External Policies](/docs/policy/external-policies) - Grant/deny semantics
- [CLI Tools](./cli-tools) - Policy management commands
