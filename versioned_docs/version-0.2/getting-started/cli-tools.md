---
sidebar_position: 5
---

# CLI Tools

jGuard provides command-line tools for compiling, inspecting, and validating policies.

## Installation

Download from Maven Central or use the Gradle plugin:

```bash
# Download CLI
curl -O https://repo1.maven.org/maven2/io/jguard/jguard-cli/0.2.0/jguard-cli-0.2.0.jar

# Create alias
alias jguard="java -jar jguard-cli-0.2.0.jar"
```

## jguardc - Policy Compiler

Compile `.jguard` source files to binary format.

### Usage

```bash
jguardc [OPTIONS] <source>
```

### Options

| Option | Description |
|--------|-------------|
| `-o, --output <path>` | (Required) Output binary path |
| `--json <path>` | Also output JSON representation |
| `--strict` | Treat warnings as errors |
| `-v, --verbose` | Enable verbose output |

### Examples

```bash
# Basic compilation
jguardc -o policy.bin module-info.jguard

# With JSON output for inspection
jguardc -o policy.bin --json policy.json module-info.jguard

# Strict mode for CI/CD (fail on warnings)
jguardc --strict -o policy.bin module-info.jguard

# Verbose output
jguardc -v -o policy.bin module-info.jguard
```

### Output

```
Compiling module-info.jguard...
  Module: com.example.app
  Entitlements: 5
  Denials: 0
Output: policy.bin (1.2 KB)
```

### Error Handling

```
Error: module-info.jguard:5:12
  Unknown capability: network.inbound
  Did you mean: network.listen?
```

## jguard inspect

Inspect policies in binary files or JARs.

### Usage

```bash
jguard inspect [OPTIONS] <path>
```

### Options

| Option | Description |
|--------|-------------|
| `-v, --verbose` | Show detailed information |
| `--json` | Output as JSON |

### Examples

```bash
# Inspect a JAR file
jguard inspect mymodule.jar

# Inspect binary policy
jguard inspect policy.bin

# Verbose mode
jguard inspect -v mymodule.jar

# JSON output for scripting
jguard inspect --json policy.bin
```

### Output

```
Module: com.example.mymodule
Entitlements: 3
  - module -> fs.read("data", "**")
  - module -> network.outbound("*.example.com", 443)
  - com.example.mymodule.worker.. -> threads.create
Denials: 1
  - module -> native.load (defensive)
```

## jguard list

List policies discovered in a directory.

### Usage

```bash
jguard list [OPTIONS] <directory>
```

### Options

| Option | Description |
|--------|-------------|
| `--include-unsigned` | Include unsigned JARs (development) |
| `-v, --verbose` | Show detailed information |

### Examples

```bash
# List policies in libs directory
jguard list libs/

# Include unsigned JARs (development mode)
jguard list --include-unsigned libs/

# Verbose mode
jguard list -v libs/
```

### Output

```
Discovered 3 policies:
  com.example.core        (signed)    core-1.0.jar
  com.example.network     (signed)    network-1.0.jar
  com.vendor.library      (unsigned)  vendor-lib.jar
```

## jguard diff

Compare two policies and show differences.

### Usage

```bash
jguard diff <base> <compare>
```

### Examples

```bash
# Compare embedded policy with override
jguard diff embedded.bin override.bin

# Compare two versions
jguard diff policy-v1.bin policy-v2.bin
```

### Output

```
Module: com.example.app

Added:
  + module -> fs.write("logs", "*.log")

Removed:
  - module -> network.outbound("evil.com", 443)

Changed:
  ~ module -> network.outbound
    was: network.outbound("*", "*")
    now: network.outbound("*.example.com", 443)
```

## jguard validate-override

Validate that an external policy is a valid override.

### Usage

```bash
jguard validate-override --override <path> (--jar <path> | --embedded <path>)
```

### Examples

```bash
# Validate override against JAR
jguard validate-override --jar vendor.jar --override policies/com.vendor.library.bin

# Validate against embedded policy
jguard validate-override --embedded embedded.bin --override override.bin
```

### Validation Rules

Valid overrides can:
- Deny capabilities that were granted
- Add new grants (additive)

Invalid overrides:
- Grant capabilities to packages outside the module
- Reference unknown capabilities

### Output

**Valid:**
```
Override is valid.
  Grants added: 0
  Denials added: 2
    - module -> native.load
    - module -> threads.create
```

**Invalid:**
```
Error: Invalid override
  Line 5: Cannot grant fs.write to com.other.module (not in target module)
```

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | General error |
| 2 | Parse error |
| 3 | Validation error |
| 4 | File not found |

## Integration with CI/CD

### GitHub Actions

```yaml
- name: Compile and validate policies
  run: |
    # Compile with strict mode
    jguardc --strict -o policy.bin module-info.jguard

    # Validate external overrides
    jguard validate-override --jar app.jar --override policies/vendor.bin
```

### Gradle Integration

The Gradle plugin wraps these CLI tools:

```groovy
tasks.named('compileJGuardPolicy') {
    // Runs jguardc under the hood
}

tasks.named('compileExternalPolicies') {
    // Compiles all .jguard files in externalPoliciesSourceDir
}
```

## Next Steps

- [Gradle Plugin](./gradle-plugin) - Build integration
- [Policy Reference](/docs/policy/overview) - Complete capability documentation
- [External Policies](/docs/policy/external-policies) - Grant/deny semantics
