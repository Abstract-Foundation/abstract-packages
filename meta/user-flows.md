# User Flows (v1)

## Flow 1: First-Time Setup
1. User installs `agw-mcp` and connects it to an MCP-compatible agent.
2. User runs `agw-mcp init`.
3. User opens the local companion app and selects a safe policy preset (or custom mode).
4. User previews the computed policy payload and risk assessment (custom mode preloads a safe default template).
5. If the policy is high risk, user explicitly confirms risk in companion UI before redirect.
6. User completes AGW session provisioning flow.
7. Companion receives callback payload, signs it with the one-time handoff secret, and forwards it to local MCP callback URL.
8. Session is persisted locally and validated.
9. User runs `agw-mcp serve` and confirms `get_session_status` is active.

Success criteria:
- Setup completes without manual file editing.
- Companion-to-MCP callback handoff is signed and validated locally before session import.
- Companion policy preset selection validates and surfaces preview payload before redirecting to wallet auth.
- Companion exposes safe workflow presets (`read_only`, `transfer`, `swap`, `contract_write`) with customizable payloads.
- High-risk policy payloads require explicit confirmation and are auditable via companion security audit log.
- Built-in preset templates are validated before preview generation so corrupted defaults fail closed.
- Built-in preset templates reject unknown top-level fields so metadata/config typos fail closed before preset listing/preview generation.
- Built-in preset metadata (`id`, `customMode`, `label`, `description`) must remain consistent; mismatches fail closed before preset listing/preview generation.
- Custom preset metadata (`id=custom`, `customMode=true`, non-empty label/description) is validated fail-closed before preset listing/preview generation.
- Custom preset metadata rejects unknown top-level fields fail-closed before preset listing/preview generation.
- Built-in preset registry key/id mismatches fail closed before preset listing/preview generation.
- Missing built-in preset registry entries fail closed before preset listing/preview generation.
- Default custom preset template is validated fail-closed before preset listing responses.
- Built-in presets ignore custom-policy payload inputs unless `preset=custom`, preventing accidental policy broadening.
- Custom policy mode rejects malformed or unknown JSON fields so typos cannot silently broaden permissions.
- Direct custom-template preview inputs reject unknown top-level fields fail-closed.
- Direct custom-template preview inputs reject non-object payloads fail-closed.
- Direct custom-template preview inputs reject mismatched custom metadata (`id`, `customMode`) fail-closed.
- Direct custom-template preview inputs reject empty `label`/`description` metadata fail-closed.
- Session status and wallet address tools return valid data.

## Flow 2: Wallet Read Workflow
1. User asks agent for wallet status.
2. Agent calls `get_wallet_address`, `get_balances`, and `get_token_list`.
3. Agent returns concise portfolio summary and links to explorer.

Success criteria:
- Responses are normalized, deterministic, and chain-aware.

## Flow 3: Signing Workflow
1. User asks agent to sign a message or transaction payload.
2. Agent calls `sign_message` or `sign_transaction`.
3. Agent returns signature/signed payload only (no broadcast).

Success criteria:
- Signing succeeds only for active session with valid policy.

## Flow 4: Send Transaction Workflow
1. User asks agent to execute a transaction.
2. Agent runs preview/preflight and policy checks.
3. Agent calls `send_transaction` with explicit execute intent.
4. Agent returns tx hash and explorer URL.

Success criteria:
- Writes are blocked when policy disallows action.
- Successful sends produce stable response schema.

## Flow 5: Swap Workflow (0x)
1. User requests token swap.
2. Agent fetches quote via 0x.
3. Agent presents quote, expected output, fees/slippage.
4. Agent executes swap when requested.

Success criteria:
- Quote-only and execute modes both supported.
- Approval requirements are surfaced clearly.

## Flow 6: Write + Batch Workflow
1. User asks agent to run contract writes, token transfers, deploys, or batched calls.
2. Agent runs policy checks and (on mainnet) policy-registry preflight checks.
3. Agent executes `transfer_token`, `write_contract`, `deploy_contract`, or `send_calls` only when execute mode is explicit.
4. Agent returns deterministic response schema + explorer metadata.

Success criteria:
- Mainnet write paths fail fast on registry `Unset`/`Denied`.
- Tool errors are machine-readable via stable `{code,message,details,raw}` contract.
