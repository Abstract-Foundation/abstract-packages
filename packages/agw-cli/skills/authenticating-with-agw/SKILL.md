---
name: authenticating-with-agw
description: Bootstrap, inspect, troubleshoot, and revoke AGW sessions through the companion approval flow. Use when a user needs to connect this machine to an AGW wallet, check session readiness, diagnose missing signer or delegated-access issues, inspect local session state, or explicitly revoke access. Trigger for requests mentioning `agw auth init`, `agw session status`, `agw session doctor`, onboarding, companion approval, or session revoke.
---

# AGW Auth And Session

Use the CLI as the source of truth for session state.

## Operating Rules

- Inspect current state before opening the companion flow.
- Use `agw auth init` as the only bootstrap path.
- Treat bootstrap and revoke as explicit-intent actions. Preview with `--dry-run`; add `--execute` only after user confirmation.
- Keep runtime wiring in `AGW_*` env vars or top-level flags, not JSON payloads.
- Parse machine-readable JSON from stdout only.
- Inspect `agw schema auth.init`, `agw schema auth.revoke`, `agw schema session.status`, or `agw schema session.doctor` when a request or response shape is unclear.

## Task Map

- Check readiness with `agw session status --json '{"fields":["status","readiness","accountAddress","policyPreset"]}'`.
- Diagnose local health with `agw session doctor --json '{}'`.
- Preview onboarding with `agw auth init --json '{"chainId":2741}' --dry-run`.
- Execute onboarding after confirmation with `agw auth init --json '{"chainId":2741}' --execute`.
- Execute revocation only after confirmation with `agw auth revoke --json '{}' --execute`.

## Recovery Hints

- Re-run `agw auth init` when the session is missing a write signer, signer binding, or completed approval.
- Keep `session.status` reads narrow. Request only the fields needed for the current reasoning step.
