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
- `transfer_token`
- `swap_tokens`
- `write_contract`
- `revoke_session`

## Execution Semantics (locked)
- `sign_transaction`: signs and returns signed payload only; never broadcasts.
- `send_transaction`: executes signing + broadcast path and returns transaction hash.
- `swap_tokens`: routes through 0x backend (quote + execute flow).
- Write/sign tools must align with official AGW action semantics (`signMessage`, `signTransaction`, `sendTransaction`, `sendCalls`, `writeContract`, `deployContract`).

## Network Strategy
- Default target: Abstract testnet.
- Mainnet support: config-driven (`chainId`, RPC URL, env vars) without architectural rewrite.

## Milestones

### M0: Product + Harness Foundation
- Lock product scope and architecture decisions
- Maintain markdown memory/control plane
- Keep autonomous loop execution stable

### M1: Session + Client Core
- Implement AGW session client adapter
- Ship companion app bootstrap for login/session policy approval
- Replace placeholder init with real session provisioning path
- Map on-chain session status to MCP tool output

### M2: Read Tooling
- Implement `get_balances` and `get_token_list`
- Harden read-path validation and response schema consistency

### M3: Signing + Execution Tools
- Implement `sign_message`, `sign_transaction`, `send_transaction`
- Implement `transfer_token` and `write_contract`
- Preserve policy preflight checks

### M4: Swap Flow
- Integrate 0x quote/route adapter
- Implement `swap_tokens` with quote + execution modes

### M5: Hardening + Reliability
- Implement `revoke_session`
- Add redaction and security hardening
- Add testnet e2e harness and nightly eval coverage

## Acceptance Shape
- Users can complete the top wallet workflows on Abstract testnet.
- Write tools enforce session-policy constraints.
- Loop-driven engineering produces reproducible, tested increments.
