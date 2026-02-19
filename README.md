# agw-mcp

Local MCP server for Abstract Global Wallet (AGW), designed around scoped session keys.

## Status

Core AGW MCP tooling is implemented for setup, read, sign, send, transfer, swap, contract write, batch calls, deploy, and revoke flows. Write paths use shared AGW action adapters, stable error contracts, and mainnet policy-registry preflight checks.

## Why this exists

- Enables agent-accessible wallet actions without moving to a custodial signing model.
- Uses local session storage and policy-bounded execution.
- Keeps AGW MCP development isolated from SDK internals while consuming AGW SDK via npm.

## Current MCP tools

- `get_wallet_address`
- `get_balances`
- `get_token_list`
- `get_session_status`
- `sign_message`
- `sign_transaction`
- `transfer_token`
- `swap_tokens`
- `preview_transaction`
- `send_transaction` (preview by default, broadcast on `execute: true`)
- `send_calls`
- `write_contract`
- `deploy_contract`
- `revoke_session`

`get_session_status` reads AGW on-chain session state and returns the canonical enum (`NotInitialized`, `Active`, `Closed`, `Expired`) with local expiry metadata.
`get_balances` returns native balance plus optional ERC-20 balances (`tokenAddresses`) with normalized raw/formatted amounts and chain-aware explorer references.
`get_token_list` returns wallet ERC-20 holdings discovered via network balance listing with normalized `value` fields (`raw`, `formatted`) and token `symbol`/`decimals`.
`sign_transaction` validates session policy, signs via AGW session client, and returns signed payload only (`broadcast: false`).
`preview_transaction` validates payload format, evaluates session-policy allowance, and returns human-readable impact/risk labels without signing or broadcasting.
`send_transaction` validates session policy, returns preview metadata by default, and broadcasts only with explicit `execute: true`, returning `txHash` and explorer transaction URL.
`transfer_token` handles native/ERC-20 transfer previews and execute mode with policy bounds checks.
`swap_tokens` fetches 0x quotes (quote mode) and executes via AGW sendTransaction when explicitly requested.
`send_calls` exposes AGW `sendCalls` for validated batch-call execution.
`write_contract` validates target/selector and value against session policy, executes via AGW session client `writeContract`, and returns transaction hash metadata.
`deploy_contract` exposes AGW `deployContract` with ABI/bytecode validation and explicit execute mode. Mainnet deploy execute is fail-closed until explicit deploy preflight support is added.
`revoke_session` executes AGW session-key revocation and marks the local session as `revoked` so write actions fail immediately.

## Usage

```bash
npm install
npm run build

# Bootstrap local session file from AGW callback/session bundle payload
node dist/index.js init

# Run local stdio MCP server
node dist/index.js serve

# Print a ready-to-paste MCP config snippet
node dist/index.js config
```

The `init` flow opens bootstrap instructions and the local companion app with secure handoff parameters. You can either wait for signed localhost callback handoff or paste callback/session payload manually. Session data is persisted to `~/.agw-mcp/session.json` with restrictive file permissions. Raw signer secrets are materialized into a local keyfile (`~/.agw-mcp/session-signer.key`) and are not written to `session.json`.

## Companion App (Scaffold)

Run the local companion app shell:

```bash
npm run companion:dev
```

This starts a local web app at `http://127.0.0.1:4173` with:
- safe policy presets at `/policy/presets`
- policy payload preview at `/policy/preview`
- high-risk confirmation controls + audit trail at `/security/audit`
- signed callback forwarding for MCP handoff at `/handoff/receive`
- wallet auth entrypoint at `/auth/start`

Users can choose a safe preset (or custom policy JSON), preview the exact computed policy payload, then redirect to AGW wallet login (`https://portal.abs.xyz/login`) with callback/bootstrap query params before pasting the callback payload into `agw-mcp init`.

Network defaults to Abstract testnet (`11124`). You can switch networks without code edits via CLI or env:

```bash
# Mainnet by env
AGW_MCP_CHAIN_ID=2741 node dist/index.js serve

# Explicit chain/rpc override
node dist/index.js serve --chain-id 2741 --rpc-url https://api.mainnet.abs.xyz
```

## Autonomous Agent Workflow

This repo now includes a markdown-first orchestration system for long-running Codex CLI loops.

Key files:

- `meta/product.md`
- `meta/prd.md`
- `meta/decisions.md`
- `meta/tasks.md`
- `meta/progress.md`
- `meta/risks.md`
- `meta/test-strategy.md`
- `meta/agw-protocol-reference.md`
- `meta/agw-session-key-best-practices.md`
- `meta/loop-config.yaml`
- `docs/prompts.md`

Run loop commands:

```bash
npm run loop:dry   # picks one task and logs without running Codex
npm run loop:once  # executes one autonomous task iteration
npm run loop       # runs multi-iteration loop
npm run loop:overnight # resilient 8h wrapper with restart + logs
npm run eval:nightly
```

To require live e2e during nightly runs, set:

```bash
AGW_E2E_REQUIRED=1 AGW_E2E_ENABLED=1 npm run eval:nightly
```

The loop uses `meta/tasks.md` as the task source of truth and appends every step to `meta/progress.md`.
It also synchronizes `meta/state.json` counters and `next_task` from the markdown task table on each iteration.
Tasks without meaningful `tests_required` criteria are blocked before execution, and successful tasks are committed and pushed after quality gates pass.
By default, pushes require a private-safe remote policy (`origin` must not be HTTPS GitHub URL form).
The runner auto-recovers stale lock files, waits for active locks, and retries transient Codex/quality-gate failures.

Overnight operation (recommended):

```bash
bash scripts/run-overnight.sh 8
tail -f logs/agent-loop-*.log
```

## Scripts

- `npm run build`
- `npm run dev`
- `npm run test`
- `npm run check-types`
- `npm run lint`
- `npm run loop`
- `npm run loop:overnight`
- `npm run eval:nightly`

## Security model (v1 direction)

- Local-only stdio MCP target.
- Session-key only flow (no full long-lived server signer).
- Restrictive file permissions for session bundle storage.
- Deny-by-default policy checks in write tools.
- Strict stderr-only logging for operational logs.

See `SECURITY.md` and `THREAT_MODEL.md` for details.
