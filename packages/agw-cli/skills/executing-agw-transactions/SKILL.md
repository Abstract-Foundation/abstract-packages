---
name: executing-agw-transactions
description: Apply preview-first execution rules to AGW signing, sends, batched calls, token transfers, contract writes, and deployments. Use when a user wants to sign data, simulate a transaction, broadcast a transaction, transfer tokens, write a contract, deploy a contract, or build one of those payloads safely. Trigger for requests mentioning `agw tx`, `agw contract`, signing, dry-run, execute, preview, transfer, contract write, or deployment.
---

# AGW Transaction Discipline

Use this skill for any AGW action that can sign data or change chain state.

## Operating Rules

- Separate preview-only, sign-only, and broadcast intentions before choosing a command.
- Default to preview mode. Use `--dry-run` before `--execute` on any mutating command.
- Never infer execute permission from a successful preview.
- Keep payloads raw and schema-aligned. Do not invent bespoke flag abstractions.
- Confirm the target chain, account, contract, recipient, and value before execution.
- Keep runtime config in `AGW_*` env vars or top-level flags, not JSON payloads.
- Inspect `agw schema tx.send`, `agw schema tx.calls`, `agw schema tx.sign-message`, `agw schema tx.sign-transaction`, `agw schema tx.transfer-token`, `agw schema contract.write`, or `agw schema contract.deploy` when shapes are uncertain.

## Task Map

- Preview a single send with `agw tx send --json '{"to":"0x...","data":"0x1234","value":"0"}' --dry-run`.
- Preview a batched call set with `agw tx calls --json '{"calls":[{"to":"0x...","data":"0x1234","value":"0"}]}' --dry-run`.
- Preview a message signature with `agw tx sign-message --json '{"message":"Authorize this action"}' --dry-run`.
- Preview a transaction signature with `agw tx sign-transaction --json '{"to":"0x...","data":"0x1234","value":"0"}' --dry-run`.
- Preview an ERC-20 transfer with `agw tx transfer-token --json '{"tokenAddress":"0x...","to":"0x...","amount":"1000000"}' --dry-run`.
- Preview a contract write with `agw contract write --json '{"address":"0x...","abi":[...],"functionName":"setValue","args":[42]}' --dry-run`.
- Preview a contract deployment with `agw contract deploy --json '{"abi":[...],"bytecode":"0x..."}' --dry-run`.

Execute only after explicit confirmation with `--execute`.
