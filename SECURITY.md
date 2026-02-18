# Security Policy

## Scope

`agw-mcp` executes wallet actions via delegated AGW session keys. This is security-sensitive software.

## Principles

- Default-deny on permissions and policies.
- No secret/session material in logs.
- Local storage with restrictive permissions only.
- Clear separation between read-only and state-changing tool behaviors.

## Reporting

Please report vulnerabilities privately to the Abstract security channel before public disclosure.

## Hard requirements before production

- Threat model review completion.
- Session provisioning flow security review.
- E2E tests for session revoke/expiry enforcement.
- Mainnet rollout gates and runbooks.
