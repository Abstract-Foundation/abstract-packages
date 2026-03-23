<p align="center">
  <img src="https://raw.githubusercontent.com/Abstract-Foundation/agw-mcp/main/docs/assets/banner.png" alt="AGW CLI Banner" width="100%" />
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@abstract-foundation/agw-cli"><img src="https://img.shields.io/npm/v/@abstract-foundation/agw-cli" alt="npm version" /></a>
  <a href="https://github.com/Abstract-Foundation/agw-mcp/blob/main/LICENSE"><img src="https://img.shields.io/github/license/Abstract-Foundation/agw-mcp" alt="License" /></a>
  <img src="https://img.shields.io/node/v/@abstract-foundation/agw-cli" alt="Node.js version" />
</p>

# AGW CLI

AGW is an agent-first CLI for [Abstract Global Wallet](https://docs.abs.xyz/abstract-global-wallet/overview). It enables AI agents like [Claude](https://code.claude.com/docs/en/overview) to interact with your Abstract Global Wallet autonomously — viewing wallet balances, sending transactions, and interacting with apps deployed on [Abstract](https://abs.xyz/).

It also ships a built-in [MCP](https://modelcontextprotocol.io/) server, so any MCP-compatible host can use AGW as a native tool surface.

## Features

- **Agent-first design** — structured JSON input/output on every command, built for LLM tool-use
- **Built-in MCP server** — plug into Claude Code, Gemini, or any MCP-compatible host
- **Preview-first writes** — all state-changing commands require explicit `--execute` after `--dry-run`
- **Session-key auth** — delegated signing via companion app approval, no private keys exposed to agents
- **Schema introspection** — `agw-cli schema <command>` for machine-readable input/output specs
- **Pagination & field trimming** — narrow reads with `fields`, paginate with `--page-all`
- **Agent skills** — installable skills that teach AI agents safe CLI usage patterns

## Get Started

Copy and paste this prompt to your LLM agent (Claude Code, Codex, etc.):

```text
Install and configure the AGW CLI by following the instructions here (use curl to fetch this file, NOT WebFetch): https://raw.githubusercontent.com/Abstract-Foundation/agw-mcp/main/docs/guide/installation.md
```

Or, read the [installation guide](https://github.com/Abstract-Foundation/agw-mcp/blob/main/docs/guide/installation.md) directly.

### Prerequisites

- Node.js 18+
- npm 10+

### Install

```bash
npm install -g @abstract-foundation/agw-cli
```

### Authenticate

The companion app handles authentication. Run the init flow to create a session key linked to your wallet:

```bash
agw-cli auth init --json '{"chainId":2741}' --execute
```

This opens your browser where you connect an existing AGW or create a new one, then approve the agent signer for this machine.

### Verify

```bash
agw-cli session status --json '{"fields":["status","readiness","accountAddress"]}'
```

## How It Works

AGW CLI uses a **delegated signer architecture** powered by [Privy](https://www.privy.io/) so your AI agent can act on your wallet's behalf without ever holding your wallet's private key.

### The Big Picture

Your [Abstract Global Wallet](https://docs.abs.xyz/abstract-global-wallet/overview) is a smart contract wallet. Its signing key is managed by Privy inside a [Trusted Execution Environment (TEE)](https://docs.privy.io/recipes/tee-wallet-migration-guide) — it never exists in complete form outside the enclave, and is never exposed to the CLI or the agent.

Instead, AGW CLI generates a local **device authorization key** and registers it as an [authenticated signer](https://docs.privy.io/security/authentication/authenticated-signers) on your wallet via a [key quorum](https://docs.privy.io/controls/key-quorum/overview). The signer is scoped to a [Privy policy](https://docs.privy.io/controls/policies/overview) you approve during onboarding, which defines exactly what RPC methods and transaction parameters the signer is allowed to use.

### Authentication Flow

```
┌──────────┐                                     ┌──────────────┐
│  AGW CLI  │  1. Generate P-256 key pair         │  Local Disk  │
│ (device)  │────────────────────────────────────▶│  ~/.agw/     │
│           │     private key → privy-auth.key     └──────────────┘
│           │
│           │  2. Open browser with public key
│           │────────────────────────────────────▶┌──────────────┐
│           │                                     │  Companion   │
│           │  3. User connects AGW, approves      │  App         │
│           │     signer + selects policy preset   │  mcp.abs.xyz │
│           │                                     └──────┬───────┘
│           │                                            │
│           │  4. Signed callback token (EdDSA)          │
│           │◀───────────────────────────────────────────┘
│           │
│           │  5. Verify signature, fingerprint,
│           │     chain ID → save session.json
└──────────┘
```

1. **Key generation** — the CLI generates a [P-256 ECDSA](https://docs.privy.io/controls/key-quorum/create) key pair locally. The private key is written to `~/.agw/privy-auth.key` with `0o600` permissions. The public key (base64-encoded DER) is passed to the companion app.
2. **Browser approval** — the CLI opens the companion app in your browser. You connect your AGW (or create a new one), then choose a policy preset that restricts what the agent can do.
3. **Signer registration** — behind the scenes, the companion app creates a Privy [key quorum](https://docs.privy.io/controls/key-quorum/overview) with your device's P-256 public key as an authorization key. It [adds this key quorum as a signer](https://docs.privy.io/wallets/using-wallets/signers/add-signers) on your wallet, bound to a [policy](https://docs.privy.io/controls/policies/overview) that defines allowed RPC methods, value limits, and target contract restrictions.
4. **Callback verification** — the companion app sends back a cryptographically signed token (EdDSA). The CLI verifies the signature, checks the signer fingerprint matches the local key, and confirms the chain ID.
5. **Session materialization** — the verified session data (account address, signer binding, policy IDs, capability summary) is saved to `~/.agw/session.json`.

### How Signing Works at Runtime

When the agent sends a transaction or signs a message:

1. The CLI reads the local P-256 private key and computes an [authorization signature](https://docs.privy.io/api-reference/authorization-signatures) over a canonicalized representation of the RPC request (method, URL, body, Privy headers).
2. The signed request is sent to [Privy's wallet RPC API](https://docs.privy.io/wallets/using-wallets/signers/use-signers) with the signature in the `privy-authorization-signature` header.
3. Privy verifies the authorization signature against the registered public key in the key quorum, then evaluates the request against the signer's [policy rules](https://docs.privy.io/controls/policies/overview).
4. If both checks pass, Privy reconstructs the wallet key inside the TEE, executes the operation, and returns the result. The key is immediately discarded after use.

**Your wallet's private key never leaves Privy's TEE.** The device key only proves that *this machine* is authorized to request specific actions within the approved policy.

### Policy Presets

During onboarding, you choose a policy preset that maps to a Privy policy governing which RPC methods and tools the signer can invoke:

| Preset | Typical capabilities |
|--------|---------------------|
| `payments` | Token transfers, balance reads |
| `trading` | Swaps, transfers, contract writes |
| `gaming` | In-game transactions |
| `contract_write` | Arbitrary contract interactions |
| `deploy` | Contract deployment |
| `signing` | Message and transaction signing |
| `full_app_control` | All capabilities |
| `custom` | Fine-grained tool selection |

Privy enforces these restrictions server-side via [policy rules](https://docs.privy.io/controls/policies/overview) (deny-by-default, `DENY` overrides `ALLOW`). The CLI also enforces them locally — both must agree before any action executes.

### Revocation

Run `agw-cli auth revoke` to remove the signer. This opens the companion app where you confirm removal. The signer is deregistered from the key quorum on Privy's side, and the local session and key files are cleaned up. You can re-run `auth init` at any time to create a new session.

## Commands

| Group | Commands | Description |
|-------|----------|-------------|
| **wallet** | `address`, `balances`, `tokens list` | Read wallet identity, balances, and token inventory |
| **tx** | `preview`, `send`, `calls`, `transfer-token`, `sign-message`, `sign-transaction` | Preview and execute transactions |
| **contract** | `write`, `deploy` | Interact with or deploy smart contracts |
| **auth** | `init`, `revoke` | Manage session-key authentication |
| **session** | `status`, `doctor` | Inspect and troubleshoot session state |
| **app** | `list`, `show` | Discover apps deployed on Abstract |
| **portal** | `streams list`, `user-profile get` | Browse Portal content and profiles |
| **schema** | `list`, `get` | Introspect command schemas |
| **mcp** | `serve` | Start the built-in MCP server |
| **mcp-config** | — | Print a ready-to-paste MCP config snippet |

Run `agw-cli schema <command>` for detailed input/output schemas on any command.

## Usage Examples

**Check your wallet balance:**

```bash
agw-cli wallet balances --json '{"fields":["native","tokens"]}'
```

**Preview a transaction before sending:**

```bash
agw-cli tx send --json '{"to":"0x...","data":"0x1234","value":"0"}' --dry-run
```

**Execute after reviewing the preview:**

```bash
agw-cli tx send --json '{"to":"0x...","data":"0x1234","value":"0"}' --execute
```

**Stream paginated token list:**

```bash
agw-cli wallet tokens list \
  --json '{"pageSize":25,"fields":["items.symbol","items.value","nextCursor"]}' \
  --page-all --output ndjson
```

**Discover apps on Abstract:**

```bash
agw-cli app list --json '{"pageSize":10,"fields":["items.id","items.name"]}'
```

## MCP Server

AGW ships a built-in MCP server generated from the same command registry as the CLI. Start it with:

```bash
agw-cli mcp serve --sanitize strict
```

Or generate a config snippet to paste into your agent host:

```bash
agw-cli mcp-config        # local binary
agw-cli mcp-config --npx  # npx-based (no global install needed)
```

## Agent Skills

The repo ships agent skills that teach AI agents how to use the CLI safely. Install them with:

```bash
npx skills add https://github.com/Abstract-Foundation/agw-mcp/tree/main/packages/agw-cli/skills
```

Available skills:

| Skill | What it covers |
|-------|----------------|
| `authenticating-with-agw` | Session bootstrap, inspection, and troubleshooting |
| `reading-agw-wallet` | Wallet identity, balances, and token inventory |
| `executing-agw-transactions` | Preview-first execution rules for signing and sends |
| `discovering-abstract-portal` | App and Portal stream discovery |
| `trading-on-aborean` | Aborean Finance protocol workflows |
| `trading-on-uniswap` | Uniswap V2+V3 swaps and liquidity on Abstract |
| `bridging-to-abstract` | Native bridge and third-party bridge options |
| `building-on-abstract` | Developer onboarding, deployment, paymasters, session keys |
| `managing-agent-identity` | ERC-8004 agent registration and reputation |
| `upvoting-on-abstract` | Abstract Portal on-chain voting |
| `mining-with-bigcoin` | Bigcoin virtual mining simulator |

## Agent Host Extensions

Pre-built configuration for:

- **Claude Code** — MCP config scaffold in `packages/agw-cli/extensions/claude-code/`
- **Gemini** — Extension guidance in `packages/agw-cli/extensions/gemini/`

Both assume `agw-cli` is installed and on `PATH`.

## Configuration

Runtime configuration via environment variables:

| Variable | Description |
|----------|-------------|
| `AGW_HOME` | Override AGW home directory (default: `~/.agw/`) |
| `AGW_CHAIN_ID` | Default chain ID |
| `AGW_RPC_URL` | RPC URL override |
| `AGW_APP_URL` | Companion app URL override |
| `AGW_OUTPUT` | Default output mode (`json` or `ndjson`) |
| `AGW_SANITIZE_PROFILE` | Sanitization profile (`off` or `strict`) |

Or use CLI flags: `--home`, `--chain-id`, `--rpc-url`, `--app-url`, `--output`, `--sanitize`.

## Security

- Session keys are stored locally with restrictive file permissions (`0o600`)
- All write operations are default-deny — no action executes without a matching policy
- State-changing commands require explicit `--execute` after preview
- Companion callback payloads are signed and verified before session materialization
- No secrets or session material in logs

See [SECURITY.md](SECURITY.md) and [THREAT_MODEL.md](THREAT_MODEL.md) for details.

## FAQ

### Does my AI agent have access to my wallet's private key?

No. Your wallet's private key is managed by [Privy](https://www.privy.io/) inside a Trusted Execution Environment (TEE). It is never stored in complete form and is only reconstructed temporarily inside the enclave when needed for signing. The CLI holds a separate device authorization key (P-256) that proves identity to Privy — it cannot extract or derive your wallet key.

### What happens if my machine is compromised?

An attacker who obtains your device authorization key (`~/.agw/privy-auth.key`) can only perform actions allowed by the Privy policy you approved during onboarding. They cannot extract your wallet's private key, change the policy, or add new signers. You can revoke the compromised signer immediately from any device by running `agw-cli auth revoke` or through the companion app directly.

### Can the agent spend more than I authorized?

No. The Privy policy attached to your signer defines hard limits enforced server-side — which RPC methods are allowed, value-per-transaction caps, fee limits, and optionally which contracts can be called. The CLI also enforces tool restrictions locally, so both layers must agree. If the agent attempts an action outside the policy, Privy denies the request.

### What is the companion app?

The companion app ([mcp.abs.xyz](https://mcp.abs.xyz)) is a hosted web interface where you approve or revoke agent signers. It handles the Privy signer registration flow and sends a cryptographically signed callback token back to the CLI. You only need it during `auth init` and `auth revoke` — normal CLI usage does not require the browser.

### Can I use AGW CLI without an AI agent?

Yes. The CLI is a standard command-line tool that takes JSON input and produces JSON output. You can use it directly from your terminal for wallet reads, transaction previews, and app discovery. The `--dry-run` / `--execute` flags work the same whether you're typing commands or an agent is.

### What is the MCP server for?

The [Model Context Protocol](https://modelcontextprotocol.io/) server exposes AGW commands as tools that MCP-compatible AI hosts (Claude Code, Gemini, etc.) can call directly. It's generated from the same command registry as the CLI, so the tool surface is identical. Use `agw-cli mcp serve` to start it, or `agw-cli mcp-config` to generate a config snippet for your host.

### How do I change what my agent is allowed to do?

Re-run `agw-cli auth init` and select a different policy preset in the companion app. This creates a new signer with the updated policy. The previous signer remains registered until you explicitly revoke it.

### Where is session data stored?

Session data lives in `~/.agw/` by default (override with `AGW_HOME` or `--home`):
- `session.json` — account address, signer binding, policy metadata, capability summary
- `privy-auth.key` — the device authorization private key

Both files are written with `0o600` permissions (owner read/write only). The directory itself is `0o700`.

### Does AGW CLI work on testnet?

Yes. Pass `--chain-id` or set `AGW_CHAIN_ID` to target a different network. Use `--rpc-url` or `AGW_RPC_URL` to point at a testnet RPC endpoint.

## Project Status

> **Under active development** — breaking changes possible before v1.0.

## Contributing

Issues and pull requests are welcome at [github.com/Abstract-Foundation/agw-mcp](https://github.com/Abstract-Foundation/agw-mcp/issues).

## License

[MIT](LICENSE) — Abstract Foundation
