---
sidebar_position: 2
---

# Roadmap

This page outlines the planned features and improvements for jGuard.

## Current Release: 0.3.0

The 0.3.0 release focuses on expanded capabilities and native library support:

- ✅ New capabilities: `process.exec`, `fs.hardlink`, `crypto.provider`
- ✅ Trusted module mechanism for native libraries (PyTorch, etc.)
- ✅ Contextual keywords for flexible package naming
- ✅ Bootstrap JAR caching with content-hash invalidation
- ✅ Improved Gradle plugin with incremental builds
- ✅ Global policy support for unnamed modules

## Previous Release: 0.2.0

The 0.2.0 release focused on production readiness:

- ✅ Multi-module support
- ✅ External policies with grant/deny
- ✅ Legacy library support
- ✅ CLI tools
- ✅ Policy hot reload
- ✅ Compiler enhancements

## Future Releases

### 0.4.0 (Planned)

**Focus**: Enhanced observability and ecosystem integration

- **Metrics and Monitoring**
  - Prometheus/Micrometer integration
  - Violation counters and histograms
  - Policy evaluation timing

- **Logging Improvements**
  - Structured logging (JSON format)
  - Log correlation IDs
  - Configurable log destinations

- **IDE Integration**
  - IntelliJ IDEA plugin for policy editing
  - Syntax highlighting and validation
  - Quick fixes for common issues

### 0.5.0 (Planned)

**Focus**: Advanced policy features

- **Policy Inheritance**
  - Base policies for common patterns
  - Policy composition and extension

- **Runtime Policy API**
  - Programmatic policy queries
  - Dynamic capability checks

- **Conditional Capabilities**
  - Time-based restrictions
  - Environment-based grants

- **Path Variables**
  - Runtime variable substitution (`${env:VAR}`, `${sys:prop}`)
  - Portable policies across environments

### 1.0.0 (Future)

**Focus**: Stability and long-term support

- API stability guarantees
- Long-term support commitment
- Comprehensive migration guides
- Performance optimizations

## Feature Requests

Have an idea for jGuard? We'd love to hear it!

- [Open a feature request](https://github.com/jguard-io/jguard/issues/new?labels=enhancement)
- [Join the discussion](https://github.com/jguard-io/jguard/discussions)

## Contributing

Interested in implementing a roadmap item? See our [Contributing Guide](/docs/community/contributing).
