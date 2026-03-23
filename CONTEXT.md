# AGW Context

AGW is an agent-first CLI for Abstract Global Wallet workflows. Treat the CLI as the source of truth.

## Rules

- Use `agw-cli schema <commandId>` whenever the request or response shape is unclear.
- Pass command input with `--json <payload|@file>`.
- Keep runtime config out of JSON payloads. Use `AGW_*` env vars or CLI flags such as `--home`, `--chain-id`, `--rpc-url`, and `--app-url`.
- Treat signing and state-changing commands as preview-first.
- Use `--dry-run` to validate locally and inspect the preview.
- Use `--execute` only after explicit user confirmation.
- Never infer execute permission from a successful preview.
- Keep reads narrow with `fields`.
- Use pagination on list surfaces and prefer `--page-all --output ndjson` for large result sets.
- Parse stdout only. Diagnostics and warnings belong on stderr.
- Prefer MCP when the host supports it. The MCP server is generated from the same registry as the CLI.
- Sanitization profiles are `off` and `strict`. MCP and extension surfaces default to `strict`.

## Config

Public runtime config is:

- `AGW_HOME`
- `AGW_CHAIN_ID`
- `AGW_RPC_URL`
- `AGW_APP_URL`
- `AGW_OUTPUT`
- `AGW_CALLBACK_SIGNING_PUBLIC_KEY`
- `AGW_CALLBACK_SIGNING_ISSUER`
- `AGW_SANITIZE_PROFILE`

## Common Patterns

Inspect schema:

```bash
agw-cli schema tx.send
```

Inspect session state:

```bash
agw-cli session status --json '{"fields":["status","readiness","accountAddress"]}'
```

Preview a mutating action:

```bash
agw-cli tx send --json '{"to":"0x...","data":"0x1234","value":"0"}' --dry-run
```

Execute after confirmation:

```bash
agw-cli tx send --json '{"to":"0x...","data":"0x1234","value":"0"}' --execute
```

Stream a paginated read:

```bash
agw-cli wallet tokens list \
  --json '{"pageSize":25,"fields":["items.symbol","items.value","nextCursor"]}' \
  --page-all \
  --output ndjson
```
