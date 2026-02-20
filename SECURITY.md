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
