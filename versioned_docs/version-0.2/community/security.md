---
sidebar_position: 4
---

# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in jGuard, please report it responsibly.

**Do NOT open a public GitHub issue for security vulnerabilities.**

### How to Report

Email security concerns to: **security@jguard.io**

Please include:

- Description of the vulnerability
- Steps to reproduce
- Affected versions
- Potential impact
- Any suggested fixes (optional)

### What to Expect

| Timeframe | Action |
|-----------|--------|
| 24-48 hours | Initial acknowledgment |
| 7 days | Assessment and severity classification |
| 30-90 days | Fix development and testing |
| After fix | Coordinated disclosure |

### Disclosure Policy

We follow coordinated disclosure:

1. Reporter contacts us privately
2. We assess and develop a fix
3. We release a patched version
4. We publish a security advisory
5. Reporter may publish details after advisory

### Security Advisories

Security advisories are published on:

- [GitHub Security Advisories](https://github.com/jguard-io/jguard/security/advisories)
- Release notes

### Scope

The following are in scope:

- jGuard agent (`jguard-agent`)
- Policy compiler (`jguard-policy`)
- CLI tools (`jguard-cli`)
- Gradle plugin (`io.jguard.policy`)

Out of scope:

- This documentation website
- Third-party dependencies (report to their maintainers)

### Recognition

We appreciate security researchers who help keep jGuard secure. With your permission, we'll acknowledge your contribution in the security advisory.

## Security Best Practices

When using jGuard in production:

1. **Sign your JARs** - Enable policy verification
2. **Disable unsigned policies** - Set `allowUnsignedPolicies = false`
3. **Use strict mode** - Set `mode = "strict"`
4. **Review policies** - Audit all entitlements before deployment
5. **Protect policy directories** - Restrict write access to external policies
6. **Monitor violations** - Enable logging with `jguard.log.denied=true`
