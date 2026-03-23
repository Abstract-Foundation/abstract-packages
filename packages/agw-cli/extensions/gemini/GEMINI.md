# AGW Gemini Guidance

Use AGW for Abstract Global Wallet workflows through a JSON-first CLI and generated MCP tools.

## Rules

- Prefer `agw schema <commandId>` when a request shape is unclear.
- Keep reads narrow with `fields`, pagination, and `--page-all` when the result set is large.
- Treat all signing and state-changing actions as preview-first.
- Use `--dry-run` before `--execute` for risky actions.
- Parse stdout as machine-readable output only.
- Use `strict` sanitization for MCP and extension-driven reads.
- Prefer `AGW_OUTPUT=json` or `AGW_OUTPUT=ndjson` when the host needs a fixed output default.
- Use the companion approval flow for signer provisioning.
- Runtime config belongs in `AGW_*` env vars or top-level CLI flags, not inside JSON payloads.

## Recommended Surfaces

- Session inspection: `session.status`, `session.doctor`
- Wallet reads: `wallet.address`, `wallet.balances`, `wallet.tokens.list`
- Preview-first writes: `tx.send`, `tx.calls`, `tx.transfer-token`, `contract.write`, `contract.deploy`
- Discovery: `app.list`, `app.show`, `portal.streams.*`, `portal.user-profile.*`

## Example Flows

Preview a send:

```bash
agw tx send --json '{"to":"0x...","data":"0x1234","value":"0"}' --dry-run
```

Stream a paginated read:

```bash
agw wallet tokens list \
  --json '{"pageSize":25,"fields":["items.symbol","items.value","nextCursor"]}' \
  --page-all \
  --output ndjson
```
