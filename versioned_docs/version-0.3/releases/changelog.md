---
sidebar_position: 1
---

# Changelog

All notable changes to jGuard are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0] - 2026-01-25

### Added

#### New Capabilities
- **`process.exec(pattern?)`** — Control process execution (`Runtime.exec()`, `ProcessBuilder.start()`)
  - Optional pattern argument to restrict allowed commands (e.g., `/usr/bin/java`, `/opt/app/bin/*`)
  - Prevents shell escapes and command injection attacks
- **`fs.hardlink(root, glob)`** — Control hard link creation (`Files.createLink()`)
  - Prevents filesystem boundary bypass attacks via hard links
  - Requires root directory and glob pattern arguments
- **`crypto.provider`** — Control JCE crypto provider modifications
  - Guards `Security.addProvider()`, `Security.insertProviderAt()`, `Security.removeProvider()`, `Security.setProperty()`
  - Prevents installation of rogue cryptographic providers
- **`runtime.exit`** — Control JVM termination (`System.exit()`, `Runtime.exit()`, `Runtime.halt()`)
  - Prevents rogue libraries from killing server applications
  - Critical for maintaining uptime SLAs
- **`runtime.shutdown_hook`** — Control shutdown hook registration (`Runtime.addShutdownHook()`, `Runtime.removeShutdownHook()`)
  - Prevents libraries from interfering with graceful shutdown

#### Trusted Module Mechanism
- `trusted;` keyword for modules that need unrestricted access (e.g., native ML libraries)
- Override-only: trusted keyword only allowed in external policy override files, not embedded policies
- Requires explicit opt-in via `-Djguard.allow.trusted=true` system property
- Security warning logged when trusted modules are loaded
- Gradle plugin `allowTrusted` configuration property

#### Gradle Plugin Improvements
- Automatic incremental builds for `compileExternalPolicies` task with proper file change detection
- Test tasks automatically depend on `compileExternalPolicies` when external policies are configured
- Global policies (`_global.jguard`) now apply to unnamed module (classpath code)

#### Agent Improvements
- Bootstrap JAR caching with content-hash based invalidation
  - Configurable cache directory via `jguard.bootstrap.cache.dir` system property
  - Automatic cache invalidation when agent JAR changes (including SNAPSHOT builds)
- AUDIT mode now respects explicit `jguard.log.allowed=false` setting
- Contextual keywords: all keywords (`security`, `module`, `entitle`, `deny`, `to`, `trusted`) are now contextual, allowing package names like `io.example.security.module`

### Changed

- Binary policy format version bumped to v3 (supports trusted flag)
- Bootstrap cache filename includes content hash for reliable cache invalidation

### Fixed

- `jguard.log.allowed=false` now properly suppresses ALLOWED logs in AUDIT mode
- `compileExternalPolicies` task now correctly detects file content changes
- Bootstrap JAR cache no longer uses stale cached versions after rebuilds

---

## [0.2.0] - 2026-01-13

### Added

#### Multi-Module Support
- Auto-discovery of policies embedded in signed JARs (`META-INF/jguard/policy.bin`)
- Per-module policy enforcement with module isolation
- Support for JPMS modular applications with multiple security domains
- `jguard.allowUnsignedPolicies` flag for development mode

#### External Policies with Grant/Deny
- External policy files for deployment-time customization
- `deny` statement to remove capabilities from embedded policies
- `deny(defensive)` to suppress warnings for intentional defensive denials
- `_global.jguard` for environment-wide restrictions (e.g., airgapped networks)
- Merge logic: `effective = (embedded ∪ external_grants ∪ global_grants) - (external_denials ∪ global_denials)`

#### Legacy Library Support
- External policies for third-party libraries without jGuard policies
- MODULE pattern matching for automatic modules (JAR-derived module names)
- Restrictive by default: unentitled operations are blocked

#### CLI Tools
- `jguardc` - Standalone compiler for `.jguard` policy files
- `jguard inspect` - Inspect policies in JARs or binary files
- `jguard list` - List all policies found in JARs on a path
- `jguard diff` - Compare two policy files
- `jguard validate-override` - Validate override policies

#### Policy Hot Reload
- Zero-downtime policy updates via file watching
- Configurable poll interval (`jguard.reload.interval`)
- Support for both explicit path and discovery mode
- External policy directory watching

#### Compiler Enhancements
- `--strict` flag treats warnings as errors (useful for CI)
- Redundant deny warnings when denying capabilities not in granted set
- Improved error messages with file:line:column format

### Changed

- Gradle plugin now configures tests to run on classpath (not module path) for JUnit/AssertJ compatibility
- Binary policy format version 2 includes denial support

### Fixed

- JPMS test isolation issue where test frameworks couldn't be found on module path

---

## [0.1.0] - 2026-01-07

### Added

- Initial release with core capability-based security model
- Policy descriptor format (`module-info.jguard`)
- Capabilities:
  - `fs.read` - Read files matching glob patterns
  - `fs.write` - Write files matching glob patterns
  - `network.outbound` - Outbound network connections
  - `network.listen` - Server socket binding
  - `threads.create` - Thread creation
  - `native.load` - Native library loading
  - `env.read` - Environment variable access
  - `system.property.read` - System property reading
  - `system.property.write` - System property writing
- ByteBuddy-based JDK instrumentation
- Gradle plugin (`io.jguard.policy`)
- Three enforcement modes: STRICT, PERMISSIVE, AUDIT
- Package-level entitlements with glob patterns
