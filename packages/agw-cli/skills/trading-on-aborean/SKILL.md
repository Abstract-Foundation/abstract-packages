---
name: trading-on-aborean
description: Compose AGW wallet, Portal, transaction, and contract commands for current Aborean Finance workflows on Abstract. Use when a user wants to inspect Aborean app 183 metadata, discover live Aborean contracts, identify liquidity pools, inspect verified contract entrypoints, or safely prepare swaps, LP deposits, zaps, veABX locks, gauge votes, vault actions, fees, bribes, emissions, or claims. Trigger for requests mentioning Aborean, app 183, DexScreener, Abscan, veABX, locks, voting, gauges, vaults, emissions, bribes, fees, liquidity, zaps, LP positions, or AGW actions tied to the Aborean protocol.
---

# Aborean Protocol

Use this skill to keep Aborean-specific discovery and flow selection outside the reusable AGW core skills.

## Operating Rules

- Start with `agw app list` or `agw app show --json '{"appId":"183"}'`. Treat the live AGW app metadata as the canonical contract index.
- Use the official docs to classify the workflow before selecting a contract or function:
  - `https://aborean.finance/docs`
  - `https://aborean.finance/liquidity`
  - `https://aborean.finance/locks`
  - `https://aborean.finance/voting`
  - `https://aborean.finance/vaults`
  - `https://aborean.finance/tokenomics`
  - `https://aborean.finance/emissions`
- Use `agw wallet balances` or `agw wallet tokens list` before proposing any flow that depends on holdings.
- If the user names an exact pair, resolve the canonical token addresses first and query the v2 factory with `getPool(tokenA, tokenB, false)` and `getPool(tokenA, tokenB, true)` before using any search surface.
- Use DexScreener only to discover candidate pools when the task involves trading, LPing, zaps, or pair selection and the exact pair or pool family is still unknown.
- Do not conclude that a pool does not exist from DexScreener search alone. Treat DexScreener as fuzzy discovery, not as the source of truth for exact-pair existence.
- Use Abscan verified source to discover real entrypoints and struct shapes before building a `contract.write` payload.
- Prefer the live `app.show` result over remembered contract lists.
- Use `agw app show --json '{"appId":"183","offline":true}'` only when you intentionally want the small shipped catalog view for comparison or fallback.
- Preview every allowance, lock, vote, claim, transfer, deposit, withdrawal, or contract write before execution.
- Route generic session, wallet, and transaction safety questions back to `authenticating-with-agw`, `reading-agw-wallet`, and `executing-agw-transactions`.
- Read [references/discovery-and-entrypoints.md](./references/discovery-and-entrypoints.md) when the task needs pool discovery, function signatures, or concrete LP and zap entrypoints.

## Contract Index

Use `agw app show --json '{"appId":"183"}'` as the source of truth for contracts.

- Expect `meta.contractsSource: "portal"` when live enrichment succeeds.
- The merged top-level `app.contracts` payload is the normalized list you should use for AGW-oriented reasoning.
- The nested `live.app.contracts` payload preserves the raw Portal labels.
- Use labels such as `Router`, `Voting Escrow`, `Voter`, `Minter`, `Rewards distributor`, and gauge entries only as discovery hints.
- Confirm the exact entrypoint in Abscan verified source before building a `contract.write` payload.

## Verified Product Model

Use the official docs and frontend to reason about the protocol:

- Aborean positions itself as the liquidity layer for Abstract, centered on trading, LP capital, and governor incentives.
- `ABX` is the governance and utility token.
- `veABX` is the vote-escrowed governance position created by locking ABX and is represented as an ERC-721 lock NFT.
- veABX holders direct emissions to pools, earn fees and bribes, and participate in governance.
- Emissions are epoch-based and routed by veABX votes.
- Trading-fee rewards can accrue continuously, while epoch-based incentives and voting rewards become claimable on epoch transition, documented as Thursday 00:00 UTC.
- Vaults automate veABX participation rather than replacing it.

## Primary User Flows

- Trading and routing:
  - Use swap and pool context for token exchanges and price discovery.
  - The live frontend exposes routes such as `/swap`, `/liquidity`, and `/positions/*`.
- Liquidity provision:
  - Users add capital to stable, volatile, or concentrated pools, then may stake LP positions for emissions.
  - Concentrated-liquidity position management is a first-class surface in the live app.
- Locks and governance:
  - Users lock ABX into veABX, extend duration, and manage voting power.
  - The docs describe lock durations up to 4 years.
  - The live frontend exposes `/locks` and `/lock/deposit`.
- Voting and claims:
  - veABX holders vote emissions toward gauges and later claim fees, bribes, and related rewards.
  - The live frontend exposes `/vote`.
- Vault participation:
  - `veABX Maxi Vault`: deposit ABX or veABX, max-lock it, collect fees, emissions, and bribes, then convert non-ABX rewards into ABX and re-lock.
  - `ABX Rewards Vault`: deposit veABX, auto-vote the highest-yield gauges, harvest rewards and fees, convert them into ABX, and distribute ABX weekly.
  - The live frontend exposes `/earn/vault`.

## Discovery Workflow

1. Load app metadata with `agw app show --json '{"appId":"183"}'`.
2. Classify the task:
   - swap or LP on a known pair
   - single-sided zap
   - v3 or concentrated position management
   - veABX lock, vote, claim, or vault action
3. Choose the discovery path:
   - exact pair named: resolve token addresses, query `getPool(..., false)` and `getPool(..., true)`, then inspect the returned pool
   - token-only or ambiguous LP request: use DexScreener to enumerate candidate pools, then narrow by quote asset and `v2` versus `v3`
   - v3 or concentrated request: identify the manager or NFT path before reasoning about execution
4. Use Abscan verified source to identify the actual router, pool, or manager entrypoint and the exact argument shape.
5. Reconfirm the chosen pool onchain with `cast call` or equivalent reads before drafting the write.
6. Preview the write with `agw contract write --json '{...}' --dry-run`.
7. Execute only after explicit user confirmation with `--execute`.

Do not infer that "LP token X" implies one unique pool. Aborean can expose multiple live pools for the same asset pair family.

## Execution Rules

- Prefer Abscan-verified v2 router entrypoints for standard two-sided LP and zap flows when they match the user's request.
- Treat `v3` or concentrated-liquidity flows as a separate path. Do not assume the v2 router covers CL position creation or management.
- If the user only has one side of a pair, check whether the router exposes a zap path before inventing a manual swap-plus-add flow.
- If multiple Aborean pools exist for the same asset, stop and confirm the exact pool family with the user unless the request already implies one.
- If DexScreener does not surface an exact pair, say that the search did not surface a candidate and move to onchain confirmation. Do not state that the pool is absent until factory reads return zero addresses for the relevant pool family.
- Confirm deadlines, min amounts, and approvals from live reads or router quote helpers. Do not hardcode slippage or split ratios without a reason.

## Key Entry Points

Use these as search anchors, not as permission to skip verification:

- v2 two-sided LP: `quoteAddLiquidity`, `addLiquidity`, `addLiquidityETH`
- v2 single-sided LP: `generateZapInParams`, `zapIn`
- v2 pool confirmation: `getPool`, `token0`, `token1`, `stable`, `getReserves`
- v3 or concentrated liquidity: find the manager or NFT path first; a CL pool alone is not enough to construct the user-facing LP write
- locks, votes, claims, and vault actions: inspect the verified contract selected from `app.contracts` and confirm the exact write method before proceeding

See [references/discovery-and-entrypoints.md](./references/discovery-and-entrypoints.md) for the concrete signatures, selectors, and example discovery commands.

## Task Map

1. Load app metadata with `agw app show --json '{"appId":"183"}'`.
2. Inspect `app.contracts` and, when label fidelity matters, compare against `live.app.contracts`.
3. Confirm wallet context with `agw wallet balances --json '{"fields":["accountAddress","nativeBalance"]}'` or `agw wallet tokens list --json '{"pageSize":25,"fields":["items.symbol","items.tokenAddress","items.value","nextCursor"]}'`.
4. Classify the request into one of the primary flows above using the official docs and, for market tasks, the discovery workflow in [references/discovery-and-entrypoints.md](./references/discovery-and-entrypoints.md).
5. Inspect live Aborean streams with `agw portal streams list --json '{"appId":"183","pageSize":10,"fields":["items.id","items.title","nextCursor"]}'` only when the task depends on Portal content.
6. Choose the target contract from the live AGW app metadata, then confirm the exact ABI plus function name in Abscan verified source.
7. Preview the write with `agw contract write --json '{...}' --dry-run`.
8. Execute only after explicit user confirmation with `--execute`.
9. Re-read balances, token inventory, LP state, or relevant claim state after execution when the user needs verification.

## Escalation

- Stop and gather more evidence when the docs describe a flow but the exact ABI or function name is still unclear.
- Prefer a correct preview plan over a guessed execution payload.
