# @abstract-foundation/agw-mcp

[![npm version](https://img.shields.io/npm/v/@abstract-foundation/agw-mcp.svg)](https://www.npmjs.com/package/@abstract-foundation/agw-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![CI](https://github.com/Abstract-Foundation/agw-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/Abstract-Foundation/agw-mcp/actions/workflows/ci.yml)

MCP server for Abstract wallet, chain, and Portal API data.

## Quick Start

```bash
npx -y @abstract-foundation/agw-mcp init --chain-id 2741
npx -y @abstract-foundation/agw-mcp serve --chain-id 2741
```

`init` opens the hosted onboarding app (`https://mcp.abs.xyz` by default), links your wallet address for local context, and writes `~/.agw-mcp/session.json`.

## Client Configuration

### Claude Code

```bash
claude mcp add agw -- npx -y @abstract-foundation/agw-mcp serve --chain-id 2741
```

### Generate config snippet

```bash
npx -y @abstract-foundation/agw-mcp config --npx --chain-id 2741
```

## Tools

| Tool | Description |
|------|-------------|
| `get_wallet_address` | Returns the linked AGW account address from local session storage |
| `get_balances` | Returns native and ERC-20 balances |
| `get_token_list` | Returns wallet ERC-20 holdings |
| `portal_list_apps` | Lists Portal apps (`/api/v1/app/`) |
| `portal_get_app` | Fetches Portal app detail (`/api/v1/app/{id}/`) |
| `portal_list_streams` | Lists streams for a Portal app (`/api/v1/streams/{app}/`) |
| `portal_get_user_profile` | Fetches Portal user profile (`/api/v1/user/profile/{address}/`) |
| `abstract_rpc_call` | Calls supported Abstract JSON-RPC methods |

### `abstract_rpc_call` constraints

Blocked by design in v0:
- `eth_sendRawTransaction`
- `zks_sendRawTransactionWithDetailedOutput`
- `debug_*`
- `eth_subscribe`, `eth_unsubscribe`
- filter lifecycle methods (`eth_newFilter`, `eth_getFilterChanges`, etc.)

## Network Configuration

Defaults to Abstract mainnet (`2741`).

```bash
# Mainnet
npx -y @abstract-foundation/agw-mcp serve --chain-id 2741

# Custom RPC
npx -y @abstract-foundation/agw-mcp serve --chain-id 2741 --rpc-url https://api.mainnet.abs.xyz
```

Environment variables:

```bash
AGW_MCP_CHAIN_ID=2741 npx -y @abstract-foundation/agw-mcp serve
AGW_MCP_RPC_URL=https://api.mainnet.abs.xyz npx -y @abstract-foundation/agw-mcp serve
AGW_MCP_APP_URL=https://mcp.abs.xyz npx -y @abstract-foundation/agw-mcp init --chain-id 2741
```

`init` requires `https://` app URLs except loopback (`http://localhost`, `http://127.0.0.1`, `http://[::1]`).

For local hosted-app development:

```bash
npx -y @abstract-foundation/agw-mcp init --chain-id 2741 --app-url http://localhost:3001
```

## Security Model (v0)

- **Scoped MCP surface**: no signing, transfers, swaps, deploys, or session-key actions exposed.
- **No delegated signer provisioning in onboarding**: local context stores wallet address + chain only.
- **Local-only transport**: stdio MCP (no network listener).
- **Restrictive file permissions**: storage dir `0o700`, files `0o600`.
- **Stderr-only logging**: stdout is reserved for MCP transport.

## Development

```bash
git clone https://github.com/Abstract-Foundation/agw-mcp.git
cd agw-mcp
pnpm install
pnpm build

pnpm dev               # tsx dev mode
pnpm test              # jest
pnpm check-types       # tsc --noEmit
pnpm lint              # eslint
```

## License

[MIT](LICENSE)
