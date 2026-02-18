# agw-mcp

Local MCP server for Abstract Global Wallet (AGW), designed around scoped session keys.

## Status

Initial scaffold for architecture and security boundaries is implemented. Read/status tools are wired; AGW session-client execution wiring is intentionally stubbed behind policy gates.

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

# Bootstrap local session file (manual placeholder flow for now)
node dist/index.js init --chain-id 11124

# Run local stdio MCP server
node dist/index.js serve --chain-id 11124
```

The `init` flow currently asks for session details interactively and stores them in `~/.agw-mcp/session.json` with restrictive file permissions.

## Scripts

- `npm run build`
- `npm run dev`
- `npm run test`
- `npm run check-types`
- `npm run lint`

## Security model (v1 direction)

- Local-only stdio MCP target.
- Session-key only flow (no full long-lived server signer).
- Restrictive file permissions for session bundle storage.
- Deny-by-default policy checks in write tools.
- Strict stderr-only logging for operational logs.

See `SECURITY.md` and `THREAT_MODEL.md` for details.
