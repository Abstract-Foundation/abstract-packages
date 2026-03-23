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
- Write operations are validated against session policy at execution time.

## Reporting

Please report vulnerabilities privately to the Abstract security channel before public disclosure.
