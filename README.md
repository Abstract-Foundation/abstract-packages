# agw-mcp

Local MCP server for Abstract Global Wallet (AGW), designed around scoped session keys.

## Status

Initial scaffold for architecture and security boundaries is implemented. Read/status tools are wired, and an AGW session-client factory adapter is now available; write-tool execution wiring remains stubbed behind policy gates. A local companion app scaffold is also available for wallet-login bootstrap.

## Why this exists

- Enables agent-accessible wallet actions without moving to a custodial signing model.
- Uses local session storage and policy-bounded execution.
- Keeps AGW MCP development isolated from SDK internals while consuming AGW SDK via npm.

## Current MCP tools

- `get_wallet_address`
- `get_session_status`
- `sign_message` (scaffolded)
- `send_transaction` (scaffolded + policy checks)
- `write_contract` (scaffolded + policy checks)

## Usage

```bash
npm install
npm run build

# Bootstrap local session file from AGW callback/session bundle payload
node dist/index.js init

# Run local stdio MCP server
node dist/index.js serve
```

The `init` flow opens bootstrap instructions, then prompts for a callback URL or session bundle payload. It validates the payload and stores a persisted session bundle in `~/.agw-mcp/session.json` with restrictive file permissions. Raw signer secrets are materialized into a local keyfile (`~/.agw-mcp/session-signer.key`) and are not written to `session.json`.

## Companion App (Scaffold)

Run the local companion app shell:

```bash
npm run companion:dev
```

This starts a local web app at `http://127.0.0.1:4173` with an auth entrypoint at `/auth/start`.
The scaffold redirects to AGW wallet login (`https://portal.abs.xyz/login`) with callback/bootstrap query params so users can initiate session approval before pasting the callback payload into `agw-mcp init`.

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
- `meta/loop-config.yaml`

Run loop commands:

```bash
npm run loop:dry   # picks one task and logs without running Codex
npm run loop:once  # executes one autonomous task iteration
npm run loop       # runs multi-iteration loop
npm run eval:nightly
```

The loop uses `meta/tasks.md` as the task source of truth and appends every step to `meta/progress.md`.
It also synchronizes `meta/state.json` counters and `next_task` from the markdown task table on each iteration.
Tasks without meaningful `tests_required` criteria are blocked before execution, and successful tasks are committed and pushed after quality gates pass.
By default, pushes require a private-safe remote policy (`origin` must not be HTTPS GitHub URL form).

## Scripts

- `npm run build`
- `npm run dev`
- `npm run test`
- `npm run check-types`
- `npm run lint`
- `npm run loop`
- `npm run eval:nightly`

## Security model (v1 direction)

- Local-only stdio MCP target.
- Session-key only flow (no full long-lived server signer).
- Restrictive file permissions for session bundle storage.
- Deny-by-default policy checks in write tools.
- Strict stderr-only logging for operational logs.

See `SECURITY.md` and `THREAT_MODEL.md` for details.
