# Security Policy

## Scope

The AGW platform executes wallet actions via delegated session keys and companion approval flows. This is security-sensitive software.

## Design Principles

- Default-deny on all write operations — no action executes without a matching policy.
- Preview-first on risky actions — state-changing commands require explicit execution intent.
- Session signer keys are stored locally with restrictive file permissions (`0o600`).
- Session state defaults to `~/.agw/`. Existing legacy state is imported into the new location on first load.
- No secret or session material in logs. All logging goes to stderr only.
- Clear separation between read-only and state-changing command behaviors.
- Companion callback payloads are signed and verified before local session materialization.
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
