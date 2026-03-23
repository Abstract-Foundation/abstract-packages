# Threat Model

## Assets

- Session signer material and session config stored at `~/.agw/`.
- Wallet address metadata and transaction intents.
- User trust boundaries around delegated wallet authority.

## Threats

| Threat | Mitigation |
|--------|------------|
| Session signer exfiltration from local disk | Restrictive file permissions (`0o700` dir, `0o600` files). Key stored in separate file from session metadata. |
| Over-broad policies allowing unsafe agent actions | Default-deny policy validation. Policy templates with explicit target, selector, and value limits. |
| Prompt injection causing unintended state-changing calls | Structured input validation on all command handlers. Risky commands require explicit `execute: true` confirmation. |
| Misleading tool responses that hide execution risk | Explicit risk/impact labeling on `preview_transaction`. Preview-by-default on `send_transaction`. |
| Stale session used after revocation/expiry | Session status checked before every write call. On-chain state validation via `get_session_status`. |
