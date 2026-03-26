---
name: reading-agw-wallet
description: Read AGW wallet identity, balances, and token inventory with field trimming and pagination. Use when a user wants to know which wallet is linked, inspect balances, list tokens, confirm the current account before another workflow, or gather read-only wallet context without blowing the context window. Trigger for requests mentioning `agw wallet address`, `agw wallet balances`, `agw wallet tokens list`, portfolio inspection, token inventory, or linked wallet identity.
---

# AGW Wallet Reads

Use read-only wallet commands to establish account context before higher-risk actions.

## Operating Rules

- Default to `--json` payloads and machine-readable output.
- Trim reads with `fields` whenever the command supports them.
- Prefer paginated output for token inventories.
- Use `--page-all --output ndjson` only when the task needs every page.
- Check session state before assuming a linked wallet is available.
- Keep runtime config in `AGW_*` env vars or top-level flags, not JSON payloads.
- Inspect `agw schema wallet.address`, `agw schema wallet.balances`, or `agw schema wallet.tokens.list` when shapes are uncertain.

## Task Map

- Read the linked account with `agw wallet address --json '{}'`.
- Read balances with `agw wallet balances --json '{"fields":["accountAddress","chainId","nativeBalance"]}'`.
- Read a page of tokens with `agw wallet tokens list --json '{"pageSize":25,"fields":["items.symbol","items.tokenAddress","items.value","nextCursor"]}'`.
- Stream the full inventory only when required with `agw wallet tokens list --json '{"pageSize":25,"fields":["items.symbol","items.tokenAddress","items.value","nextCursor"]}' --page-all --output ndjson`.

## Escalation

- Switch to `authenticating-with-agw` when the wallet is not linked because the local session is missing or inactive.
