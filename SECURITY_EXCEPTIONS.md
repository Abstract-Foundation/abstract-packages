# Security Exceptions Register

Last updated: February 23, 2026

This register documents accepted dependency security exceptions that are currently unpatchable upstream.

## Active Exceptions

### 1) `elliptic` low advisory (`GHSA-848j-6mx2-7j84`)

- Severity: Low
- Advisory: [`GHSA-848j-6mx2-7j84`](https://github.com/advisories/GHSA-848j-6mx2-7j84)
- Affected path:
  - `@abstract-foundation/agw-react -> @privy-io/react-auth -> @privy-io/js-sdk-core -> @ethersproject/transactions -> @ethersproject/signing-key -> elliptic`
- Why accepted today:
  - Upstream chain currently has no patched replacement available through `@abstract-foundation/agw-react@1.10.0`.
  - No known direct exploit path in this repository's server-side runtime.
- Exit criteria:
  - Upgrade to a dependency chain that removes `elliptic`, or upstream ships a patched alternative.
- Review cadence:
  - Re-check weekly via CI audit logs.
  - Re-evaluate before every release cut.

## Policy

- High or critical exceptions are not allowed for release.
- Any exception must include advisory ID, scope, rationale, and exit criteria.
