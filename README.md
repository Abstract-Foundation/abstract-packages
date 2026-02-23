# @abstract-foundation/agw-mcp

[![npm version](https://img.shields.io/npm/v/@abstract-foundation/agw-mcp.svg)](https://www.npmjs.com/package/@abstract-foundation/agw-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![CI](https://github.com/Abstract-Foundation/agw-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/Abstract-Foundation/agw-mcp/actions/workflows/ci.yml)

MCP server for [Abstract Global Wallet](https://abs.xyz) session-key workflows — scoped wallet actions without custodial signing.

## Quick Start

```bash
npx -y @abstract-foundation/agw-mcp serve --chain-id 2741
```

Or add it to Claude Code directly:

```bash
claude mcp add agw -- npx -y @abstract-foundation/agw-mcp serve --chain-id 2741
```

## Setup

### 1. Bootstrap a session

```bash
npx -y @abstract-foundation/agw-mcp init --chain-id 2741
```

This opens the hosted onboarding app (`https://app-jarrodwatts.vercel.app`) where you:

1. Choose a policy preset (or provide custom policy JSON)
2. Connect your Abstract Global Wallet
3. Approve the session key

Session data is saved to `~/.agw-mcp/session.json` with `0o600` file permissions. The session signer key is stored separately in `~/.agw-mcp/session-signer.key`.
If a previous active session exists locally, the CLI attempts to revoke it on-chain after creating the new one.
Bootstrap is single-process per storage directory (lockfile: `~/.agw-mcp/.bootstrap-init.lock`) to prevent concurrent `init` races.

### 2. Start the MCP server

```bash
npx -y @abstract-foundation/agw-mcp serve --chain-id 2741
```

## Client Configuration

### Claude Code

```bash
claude mcp add agw -- npx -y @abstract-foundation/agw-mcp serve --chain-id 2741
```

### Claude Desktop

Add to your `claude_desktop_config.json`:

<details>
<summary>macOS: ~/Library/Application Support/Claude/claude_desktop_config.json</summary>

```json
{
  "mcpServers": {
    "agw-mcp": {
      "command": "npx",
      "args": ["-y", "@abstract-foundation/agw-mcp", "serve", "--chain-id", "2741"]
    }
  }
}
```

</details>

<details>
<summary>Windows: %APPDATA%\Claude\claude_desktop_config.json</summary>

```json
{
  "mcpServers": {
    "agw-mcp": {
      "command": "npx",
      "args": ["-y", "@abstract-foundation/agw-mcp", "serve", "--chain-id", "2741"]
    }
  }
}
```

</details>

### Cursor / Windsurf

Use the same JSON block as Claude Desktop in your editor's MCP configuration file.

### Generate config snippet

```bash
npx -y @abstract-foundation/agw-mcp config --npx --chain-id 2741
```

## Tools

| Tool | Description |
|------|-------------|
| `get_wallet_address` | Returns AGW account address from local session |
| `get_balances` | Native + ERC-20 balances with formatted amounts |
| `get_token_list` | Wallet ERC-20 holdings via network discovery |
| `get_session_status` | On-chain session state + local expiry metadata |
| `sign_message` | Signs UTF-8 message via session signer |
| `sign_transaction` | Signs EVM transaction, returns signed payload (no broadcast) |
| `preview_transaction` | Impact/risk preview without signing |
| `send_transaction` | Preview by default, broadcast on `execute: true` |
| `send_calls` | EIP-5792 batch call execution |
| `transfer_token` | Native/ERC-20 transfer with policy checks |
| `swap_tokens` | 0x quote + execute via session key |
| `write_contract` | Contract write with target/selector policy validation |
| `deploy_contract` | Contract deployment with ABI/bytecode validation |
| `revoke_session` | Revoke session key, invalidate local session |

## Network Configuration

Defaults to Abstract mainnet (chain ID `2741`). Override RPC or switch to testnet when needed:

```bash
# Mainnet
npx -y @abstract-foundation/agw-mcp serve --chain-id 2741

# Custom RPC
npx -y @abstract-foundation/agw-mcp serve --chain-id 2741 --rpc-url https://api.mainnet.abs.xyz
```

Environment variables are also supported:

```bash
AGW_MCP_CHAIN_ID=2741 npx -y @abstract-foundation/agw-mcp serve
AGW_MCP_RPC_URL=https://api.mainnet.abs.xyz npx -y @abstract-foundation/agw-mcp serve
AGW_MCP_APP_URL=http://localhost:3001 npx -y @abstract-foundation/agw-mcp init --chain-id 2741
```

`init` requires `https://` app URLs except for loopback local development URLs (`http://localhost`, `http://127.0.0.1`, `http://[::1]`).

For local hosted-app development:

```bash
npx -y @abstract-foundation/agw-mcp init --chain-id 2741 --app-url http://localhost:3001
```

## Security Model

- **Non-custodial**: Session keys are scoped and time-limited. No full wallet access.
- **Default-deny policies**: Write tools fail unless a matching policy explicitly allows the target address, function selector, or transfer amount.
- **Local-only transport**: stdio MCP — no network exposure. Session signer keys never leave the machine.
- **Restrictive file permissions**: Session storage directory `0o700`, files `0o600`.
- **Stderr-only logging**: stdout is reserved for MCP stdio transport. All operational logs go to stderr.

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
