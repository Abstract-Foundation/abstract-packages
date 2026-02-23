# Security Policy

## Scope

`@abstract-foundation/agw-mcp` executes wallet actions via delegated AGW session keys. This is security-sensitive software.

## Design Principles

- Default-deny on all write operations — no action executes without a matching policy.
- Session signer keys are stored locally with restrictive file permissions (`0o600`).
- No secret or session material in logs. All logging goes to stderr only.
- Clear separation between read-only and state-changing tool behaviors.
- Companion handoff payloads are signed with one-time local secrets.
- Mainnet write paths pass policy-registry preflight checks before execution.

## Reporting

Please report vulnerabilities privately to the Abstract security channel before public disclosure.

## Dependency Exceptions

Some upstream transitive vulnerabilities may remain when no patched version exists yet. These are tracked in
`SECURITY_EXCEPTIONS.md` with:

- package/advisory details
- impact assessment and scope
- explicit acceptance rationale
- review cadence and exit criteria

As of February 23, 2026, no high/critical dependency exceptions are permitted for release.
