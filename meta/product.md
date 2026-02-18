# Product Brief: AGW MCP

## Mission
Enable Abstract users with AGW wallets to use AI agents for common wallet operations through session keys.

## Primary User (v1)
- End users of Abstract Global Wallet who want AI-assisted wallet interactions.

## Top User Workflows
1. Check wallet state: addresses, balances, token holdings, session status.
2. Perform common wallet actions: transfer, swap, contract interactions.
3. Sign operations: message signing and transaction signing/sending.

## Target Wallet Patterns (v1)
- View wallet address
- View balances
- View token portfolio/list
- Sign message
- Sign transaction (no broadcast)
- Send transaction (broadcast)
- Transfer token
- Swap tokens
- Write contract
- Revoke session

## Product Constraints
- Session-key-based execution only.
- Session policies must be fully customizable.
- Testnet-first rollout with straightforward mainnet configurability.

## Non-goals (v1)
- Hosted multi-tenant MCP service
- Full remote MCP auth/OAuth stack
- Opinionated hard-deny action list at product level

## Product Principles
- Preserve AGW non-custodial model.
- Keep write behavior explicit and auditable.
- Minimize friction for common wallet tasks.
- Build iteratively with strong tests and clear memory artifacts.
