# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Root (pnpm workspace + Turbo)
pnpm build          # Build all packages
pnpm typecheck      # Type-check all packages
pnpm test           # Run all tests

# packages/mpp
pnpm build          # tsc compile → dist/
pnpm dev            # tsc --watch
pnpm typecheck      # tsc --noEmit

# packages/contracts (Foundry)
forge build         # Standard compile
forge build --zksync  # ZKsync VM compile (requires foundry-zksync)
forge test -v       # Run 17 contract tests
forge soldeer install  # Install Solidity deps (solady, forge-std)

# examples
pnpm dev            # tsx src/index.ts or tsx src/agent.ts
pnpm typecheck      # tsc --noEmit
```

Linting/formatting uses **Biome** (`biome.json` at root). Solidity files are excluded from Biome.

## Architecture

This is a **Machine Payments Protocol (MPP)** plugin for the Abstract blockchain, enabling paid API access via two settlement mechanisms.

### Package Layout

```
packages/contracts/        Solidity — AbstractStreamChannel.sol
packages/mpp/    TypeScript plugin (npm: @abstract-foundation/mpp)
examples/hono-server/      Server example using the plugin
examples/agent-client/     Autonomous client that pays via 402 flow
```

### Payment Flow

Both payment intents follow the same HTTP protocol:
1. Client requests a resource → server responds `402 Payment Required` with `WWW-Authenticate: Payment method="abstract"`
2. Client signs and retries with `Authorization: Payment <base64url>`
3. Server verifies, settles on-chain, responds `200 OK` with `Payment-Receipt`

The `mppx` framework (peer dep `^0.4.9`) handles this 402 negotiation loop. `@abstract-foundation/mpp` implements the Abstract-specific signing and settlement logic on top.

### Two Intents

**`charge` (ERC-3009 `TransferWithAuthorization`)**
- Client signs typed data only — no transaction from client
- Server calls `transferWithAuthorization()` on USDC.e, paying gas (or via Abstract paymaster)
- One signature per request; replay-protected by nonce + `validBefore` expiry
- Implementation: `packages/mpp/src/client/charge.ts` + `server/charge.ts`

**`session` (AbstractStreamChannel payment channels)**
- Client opens a channel on-chain once (approve + `open()`), depositing USDC.e into escrow
- Each subsequent request exchanges a signed EIP-712 voucher with a cumulative amount
- Server accumulates the highest accepted voucher; calls `settle()` or `close()` to finalize
- Payer escape hatch: `requestClose()` → 15-minute grace period → `withdraw()`
- Implementation: `packages/mpp/src/client/session.ts` + `server/session.ts`

### Smart Contract

`AbstractStreamChannel.sol` is a direct port of Tempo's `TempoStreamChannel.sol` with three changes:
1. `ITIP20` → `IERC20`
2. `TempoUtilities.isTIP20()` → `require(token != address(0))`
3. EIP-712 domain → `"Abstract Stream Channel"`

All business logic is identical to Tempo's implementation.

### Abstract / ZKsync Specifics

- Abstract uses the ZKsync VM — on-chain deployment requires `foundry-zksync` or `hardhat-zksync`
- Standard `forge test` works without `foundry-zksync` (tests run against a fork-std EVM)
- Gas sponsorship uses **native ZKsync paymasters** (`customData.paymasterParams`) — no separate fee-payer service needed
- Chain IDs: `11124` (testnet), `2741` (mainnet)
- Token: USDC.e (6 decimals); constants in `packages/mpp/src/constants.ts`

### TypeScript Module Resolution

`packages/mpp` exports three entry points: `@abstract-foundation/mpp`, `@abstract-foundation/mpp/client`, `@abstract-foundation/mpp/server` (see `package.json` exports map).

Examples use **path mappings** in `tsconfig.json` to resolve these from local source during development — no need to build the package first when working in examples.

### EIP-712 Domains

- **Charge (ERC-3009)**: domain `{name: 'USD Coin', version: '2', chainId, verifyingContract: tokenAddr}`
- **Session vouchers**: domain `{name: 'Abstract Stream Channel', version: '1', chainId, verifyingContract: escrowAddr}`

## Code Conventions

- **TypeScript**: ESM (`"type": "module"`), ES2023 target, NodeNext resolution, strict mode. Explicit `.js` extensions on imports.
- **Solidity**: Solc 0.8.26, 200 optimizer runs. Dependencies via Soldeer (forge-std, solady).
- **Formatting**: Biome with recommended rules, single quotes, space indentation. `.sol` files excluded from linting.
- **Foundry tests**: `setUp()` + `test_*` naming. Payer key `0xA11CE` with helper functions `_openChannel()`, `_signVoucher()`.

## Chain Constants

| | Testnet (11124) | Mainnet (2741) |
|---|---|---|
| USDC.e | `0xbd28Bd5A3Ef540d1582828CE2A1a657353008C61` | `0x84A71ccD554Cc1b02749b35d22F684CC8ec987e1` |
| AbstractStreamChannel | `0x29635C384f451a72ED2e2a312BCeb8b0bDC0923c` | `0x29635C384f451a72ED2e2a312BCeb8b0bDC0923c` |
| RPC | `https://api.testnet.abs.xyz` | `https://api.mainnet.abs.xyz` |
