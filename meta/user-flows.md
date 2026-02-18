# User Flows (v1)

## Flow 1: First-Time Setup
1. User installs `agw-mcp` and connects it to an MCP-compatible agent.
2. User runs `agw-mcp init`.
3. User completes AGW session provisioning flow.
4. Session is persisted locally and validated.
5. User runs `agw-mcp serve` and confirms `get_session_status` is active.

Success criteria:
- Setup completes without manual file editing.
- Session status and wallet address tools return valid data.

## Flow 2: Wallet Read Workflow
1. User asks agent for wallet status.
2. Agent calls `get_wallet_address`, `get_balances`, and `get_token_list`.
3. Agent returns concise portfolio summary and links to explorer.

Success criteria:
- Responses are normalized, deterministic, and chain-aware.

## Flow 3: Signing Workflow
1. User asks agent to sign a message or transaction payload.
2. Agent calls `sign_message` or `sign_transaction`.
3. Agent returns signature/signed payload only (no broadcast).

Success criteria:
- Signing succeeds only for active session with valid policy.

## Flow 4: Send Transaction Workflow
1. User asks agent to execute a transaction.
2. Agent runs preview/preflight and policy checks.
3. Agent calls `send_transaction` with explicit execute intent.
4. Agent returns tx hash and explorer URL.

Success criteria:
- Writes are blocked when policy disallows action.
- Successful sends produce stable response schema.

## Flow 5: Swap Workflow (0x)
1. User requests token swap.
2. Agent fetches quote via 0x.
3. Agent presents quote, expected output, fees/slippage.
4. Agent executes swap when requested.

Success criteria:
- Quote-only and execute modes both supported.
- Approval requirements are surfaced clearly.
