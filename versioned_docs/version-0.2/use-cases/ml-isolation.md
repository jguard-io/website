---
sidebar_position: 3
---

# ML/AI Isolation

Machine learning frameworks like DJL, TensorFlow Java, and ONNX Runtime execute model code that may be untrusted. jGuard provides isolation for AI workloads.

## The Problem

ML models can:

- Access arbitrary files (training data, credentials)
- Make network connections (data exfiltration)
- Load native libraries (native code execution)
- Create threads (resource exhaustion)

Models may come from untrusted sources or be adversarially crafted.

## The Solution

jGuard restricts ML execution to only necessary resources:

```text
security module ai.djl.pytorch {
    // Load models from designated directory
    entitle module to fs.read(models, "**/*.pt");
    entitle module to fs.read(models, "**/*.onnx");

    // Load PyTorch native libraries
    entitle module to native.load("torch*");
    entitle module to native.load("c10*");

    // Thread pool for inference
    entitle module to threads.create;

    // No network - models loaded from disk only
    // No file writes
}
```

## Architecture

```
┌──────────────────────────────────────────────────┐
│ ML Application                                   │
│                                                  │
│  ┌────────────────┐    ┌────────────────┐        │
│  │ Model Loader   │───▶│ /models/*.pt   │        │
│  │ (fs.read only) │    └────────────────┘        │
│  └────────┬───────┘                              │
│           │                                      │
│           ▼                                      │
│  ┌────────────────┐                              │
│  │ Inference      │                              │
│  │ (threads.create│                              │
│  │  native.load)  │                              │
│  └────────────────┘                              │
│           │                                      │
│           ▼                                      │
│  ┌────────────────┐                              │
│  │ Results        │  No network, no file write   │
│  └────────────────┘                              │
└──────────────────────────────────────────────────┘
```

## Example: DJL Application

### Policy

```text
security module com.example.mlapp {
    // System properties needed by DJL
    entitle module to system.property.read;

    // Model loading
    entitle com.example.mlapp.models.. to fs.read(models, "**");

    // Native libraries for PyTorch
    entitle ai.djl.pytorch.. to native.load("torch*");
    entitle ai.djl.pytorch.. to native.load("c10*");
    entitle ai.djl.pytorch.. to native.load("gomp*");

    // Inference thread pool
    entitle ai.djl.pytorch.. to threads.create;

    // Result output
    entitle com.example.mlapp.output.. to fs.write(results, "**/*.json");
}
```

### Gradle Configuration

```groovy
plugins {
    id "java"
    id "io.jguard.policy" version "0.2.0"
}

dependencies {
    implementation("io.jguard:jguard-core:0.2.0")
    implementation("ai.djl:api:0.25.0")
    implementation("ai.djl.pytorch:pytorch-engine:0.25.0")
}
```

## Airgapped Inference

For high-security environments, use a global policy to deny all network access:

```text
// policies/_global.jguard
security module _global {
    deny module to network.outbound;
    deny module to network.listen;
}
```

This ensures no ML framework can phone home, even if they try.

## Model Sandboxing Levels

### Level 1: Basic Isolation

```text
security module ml.models {
    entitle module to fs.read(models, "**");
    entitle module to native.load;
    entitle module to threads.create;
}
```

### Level 2: Restricted Native

```text
security module ml.models {
    entitle module to fs.read(models, "**");
    entitle module to native.load("torch*");  // Only specific libs
    entitle module to threads.create;
}
```

### Level 3: Full Lockdown

```text
security module ml.models {
    entitle module to fs.read(models, "**/*.onnx");  // Only ONNX
    // No native libraries (use pure Java runtime)
    // No threads (synchronous inference)
}
```

## Best Practices

1. **Separate model loading from inference** - Different capabilities for each
2. **Restrict native libraries** - Only allow specific libraries needed
3. **Deny network by default** - Models shouldn't need network access
4. **Audit model behavior** - Run in audit mode with new models
5. **Use airgapped policies** - Global denials for high-security environments
