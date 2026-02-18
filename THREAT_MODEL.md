# Threat Model (Draft)

## Assets

- Session signer material and session config.
- Wallet address metadata and transaction intents.
- User trust boundaries around delegated wallet authority.

## Primary Threats

- Session signer exfiltration from local disk.
- Over-broad policies allowing unsafe agent actions.
- Prompt injection causing unintended state-changing calls.
- Misleading tool responses that hide execution risk.

## Controls

- Restrictive file permissions for persisted session state.
- Policy templates with explicit limits and expiry.
- Structured validation for all tool inputs.
- Explicit risk labeling for write actions.
- Session status checks before every write call.

## Deferred work

- Optional local encryption via OS keychain.
- Signed audit logs.
- Remote MCP auth model for hosted deployments.
