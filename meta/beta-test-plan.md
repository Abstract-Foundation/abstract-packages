# Beta Test Plan — @abstract-foundation/agw-mcp@0.1.0-beta.0

Manual end-to-end validation of the published npm package from an end-user perspective.

**Package**: `@abstract-foundation/agw-mcp@beta`
**Target network**: Abstract testnet (chain id 11124)
**Date**: 2026-02-20

---

## Phase 1: Package Installation & CLI

| # | Command | Expected | Result |
|---|---------|----------|--------|
| 1.1 | `npx -y @abstract-foundation/agw-mcp@beta --help` | Shows `init`, `serve`, `config` commands | PASS |
| 1.2 | `npx -y @abstract-foundation/agw-mcp@beta --version` | Prints `0.1.0` | PASS |
| 1.3 | `npx -y @abstract-foundation/agw-mcp@beta config --npx --chain-id 11124` | Valid JSON with `npx` command and chain-id in args | PASS |

## Phase 2: Claude Code Integration

| # | Command | Expected | Result |
|---|---------|----------|--------|
| 2.1 | `claude mcp add agw -- npx -y @abstract-foundation/agw-mcp@beta serve --chain-id 11124` | Registers without error | PASS |
| 2.2 | `claude mcp list` | `agw` appears in list | PASS — "Connected" |

## Phase 3: Session Bootstrap

Prerequisites: companion running locally (two terminals: `pnpm companion:server` + `pnpm companion:dev`). Tested with local build (`node dist/index.mjs`) since published beta does not include companion POST handler yet.

| # | Step | Expected | Result |
|---|------|----------|--------|
| 3.1 | `pnpm companion:server` + `pnpm companion:dev` | API on `:4174`, Vite on `:4173` | PASS |
| 3.2 | `node dist/index.mjs init --chain-id 11124` | Opens browser to companion | PASS |
| 3.3 | Connect wallet in companion app | Wallet connects, address shown | PASS |
| 3.4 | Select policy, approve session on-chain | Session created, bundle POSTed to CLI callback | PASS |
| 3.5 | Check `ls -la ~/.agw-mcp/` | `session.json` + `session-signer.key`, `0o600` permissions | PASS |

## Phase 4: Read-Only Tools

Start a Claude Code session with the `agw` MCP server active.

| # | Prompt to Claude | Expected Tool | Expected Result | Result |
|---|------------------|---------------|-----------------|--------|
| 4.1 | "What's my AGW wallet address?" | `get_wallet_address` | Returns address from session | PASS — `0x06639F064b82595F3BE7621F607F8e8726852fCf` |
| 4.2 | "What's my session status?" | `get_session_status` | `active` with expiry metadata | PASS — `Active` on-chain, statusCode 1 |
| 4.3 | "What are my balances?" | `get_balances` | Native + ERC-20 balances | PASS — 0.3077 ETH |
| 4.4 | "What tokens do I hold?" | `get_token_list` | ERC-20 token list | FAIL — `zks_getAllAccountBalances` RPC method not available on testnet |

## Phase 5: Sign-Only Tools

| # | Prompt to Claude | Expected Tool | Expected Result | Result |
|---|------------------|---------------|-----------------|--------|
| 5.1 | "Sign the message 'hello world'" | `sign_message` | Returns signature, no on-chain effect | |
| 5.2 | "Sign a tx sending 0.001 ETH to 0x{addr}" | `sign_transaction` | Returns signed payload, no broadcast | |

## Phase 6: Preview & Send Tools

| # | Prompt to Claude | Expected Tool | Expected Result | Result |
|---|------------------|---------------|-----------------|--------|
| 6.1 | "Preview sending 0.001 ETH to 0x{addr}" | `preview_transaction` | Impact/risk preview, no execution | |
| 6.2 | "Send 0.001 ETH to 0x{addr}" | `send_transaction` | Preview first, broadcast on `execute: true` | |
| 6.3 | "Transfer 0.001 ETH to 0x{addr}" | `transfer_token` | Policy-checked native transfer, returns tx hash | |

## Phase 7: Policy Enforcement (negative tests)

| # | Prompt to Claude | Expected Result | Result |
|---|------------------|-----------------|--------|
| 7.1 | "Send 1000 ETH to 0x{addr}" | Rejected — exceeds value limit | |
| 7.2 | "Call contract 0x{unlisted} with function foo()" | Rejected — target not in policy | |
| 7.3 | "Deploy a contract with bytecode 0x..." | Rejected if no deploy permission in policy | |

## Phase 8: Session Revocation

| # | Prompt to Claude | Expected Tool | Expected Result | Result |
|---|------------------|---------------|-----------------|--------|
| 8.1 | "Revoke my session" | `revoke_session` | Invalidates on-chain + clears local | |
| 8.2 | "What's my session status?" | `get_session_status` | `revoked` or `missing` | |
| 8.3 | "Send 0.001 ETH to 0x{addr}" | any write tool | Fails — no active session | |

---

## Things to Watch

- **stderr vs stdout**: all logs to stderr, stdout clean for MCP stdio
- **Error messages**: helpful on missing session, expired session, policy denial?
- **No secret leakage**: session keys / private keys never in Claude tool responses
- **Companion dependency**: `init` needs companion at `127.0.0.1:4173` — npx-only users must clone repo or paste payload manually

## Issues Found

- **portal.abs.xyz ignores redirect_uri** — broke the original companion→portal→companion handoff chain. Fixed by rewriting companion to handle wallet connection + session creation directly via AGW SDK (no portal dependency).
- **CLI opened docs.abs.xyz on init** — vestigial from old flow. Removed; now only opens companion URL.
- **Vite bound to IPv6 by default** — `127.0.0.1` refused connection. Fixed by setting `host: "127.0.0.1"` in vite.config.ts.
- **High-risk confirmation checkbox auto-toggled off** — `change` event triggered `refreshPolicyPreview()` which re-rendered and reset checkbox state. Fixed by decoupling checkbox from preview refresh.
- **Wrong account address stored in session** — `createAbstractClient` derived a new smart account from the AGW provider's already-resolved smart account address. Fixed by using `walletAddress` (from `eth_requestAccounts`) directly in the bundle.
- **`get_token_list` fails on testnet** — `zks_getAllAccountBalances` RPC method not available on Abstract testnet. Not a code bug — testnet RPC limitation.

## Notes

<!-- General observations, UX feedback, etc. -->
