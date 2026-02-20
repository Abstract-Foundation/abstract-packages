# AGW MCP PRD (v1)

## Scope
Build a local stdio MCP server and local companion app for AGW users to perform common crypto wallet actions through session keys.

## Core Tool Surface (v1)
- `get_wallet_address`
- `get_balances`
- `get_token_list`
- `get_session_status`
- `sign_message`
- `sign_transaction`
- `send_transaction`
- `send_calls`
- `transfer_token`
- `swap_tokens`
- `write_contract`
- `deploy_contract`
- `preview_transaction`
- `revoke_session`

## Execution Semantics (locked)
- `sign_transaction`: signs and returns signed payload only; never broadcasts.
- `send_transaction`: executes signing + broadcast path and returns transaction hash.
- `swap_tokens`: routes through 0x backend (quote + execute flow).
- Write/sign tools must align with official AGW action semantics (`signMessage`, `signTransaction`, `sendTransaction`, `sendCalls`, `writeContract`, `deployContract`).

## Network Strategy
- Default target: Abstract testnet.
- Mainnet support: config-driven (`chainId`, RPC URL, env vars) without architectural rewrite.

## Acceptance Shape
- Users can complete the top wallet workflows on Abstract testnet.
- Write tools enforce session-policy constraints.
