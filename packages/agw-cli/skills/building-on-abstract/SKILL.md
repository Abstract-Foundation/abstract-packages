---
name: building-on-abstract
description: Build, deploy, and integrate applications on Abstract chain using Foundry, Hardhat, AGW SDK, paymasters, and session keys. Use when a user wants to build a dApp on Abstract, deploy smart contracts, scaffold a new project, integrate Abstract Global Wallet, implement gasless transactions with paymasters, use session keys, understand EVM differences from standard Ethereum, or get started developing on Abstract. Trigger for requests mentioning build on Abstract, deploy contract, create-abstract-app, Foundry, Hardhat, AGW SDK, agw-client, agw-react, paymaster, session key, gas sponsorship, ZKsync VM, EVM differences, or Abstract developer documentation.
---

# Building on Abstract

Abstract is a ZK Rollup on ZK Stack with native account abstraction, paymasters, and session keys. The developer experience differs from standard Ethereum in important ways — this skill covers project setup, contract deployment, AGW integration, and the critical EVM differences.

## Operating Rules

- Identify whether the task is smart contract development, frontend/SDK integration, or both before recommending tooling.
- Read [references/evm-differences.md](./references/evm-differences.md) before advising on contract deployment or Solidity patterns — Abstract's ZKsync VM has significant differences from standard EVM.
- Read [references/agw-integration.md](./references/agw-integration.md) for AGW client and React SDK setup.
- Read [references/paymaster-guide.md](./references/paymaster-guide.md) for gasless transaction patterns.
- Read [references/network-config.md](./references/network-config.md) for RPC URLs, chain IDs, and system contracts.

## Quick Start

### New project from scratch

```bash
npx @abstract-foundation/create-abstract-app@latest my-app
```

Scaffolds a Next.js app with AGW integration pre-configured.

### Smart contract development

| Framework | Install | Notes |
|-----------|---------|-------|
| Foundry | `foundry-zksync` fork | `forge build --zksync`, `forge create --zksync` |
| Hardhat | `@matterlabs/hardhat-zksync` | Plugin handles zksolc compilation |

### Network configuration

| Network | Chain ID | RPC | Explorer |
|---------|----------|-----|----------|
| Mainnet | 2741 | `https://api.mainnet.abs.xyz` | `https://abscan.org` |
| Testnet | 11124 | `https://api.testnet.abs.xyz` | `https://sepolia.abscan.org` |

## Contract Deployment via AGW CLI

Preview then deploy:

```bash
agw contract deploy --json '{
  "abi": [...],
  "bytecode": "0x..."
}' --dry-run

agw contract deploy --json '{
  "abi": [...],
  "bytecode": "0x..."
}' --execute
```

Verify on Abscan after deployment.

## Key Architecture Decisions

### Native Account Abstraction
Every account on Abstract is a smart contract implementing `IAccount`. This is built into the protocol (not ERC-4337). Enables passkey wallets, session keys, batch transactions, and gas sponsorship natively.

### Paymasters
Smart contracts that pay gas on behalf of users. Two flows:
- **General**: Sponsor all transactions (e.g., onboarding)
- **Approval-Based**: Users pay gas with ERC-20 tokens (e.g., USDC)

Provider: Zyfi (`https://zyfi.org`)

### Session Keys
Temporary, scoped credentials for pre-approved tx execution without user confirmation. Mainnet requires security review + registration with Session Key Policy Registry at `0xA146c7118A46b32aBD0e1ACA41DF4e61061b6b93`.

### EVM Differences (Critical)
Abstract uses ZKsync VM, not standard EVM. Key differences:
- **Contract deployment** routes through `ContractDeployer` system contract
- **`factoryDeps`** field required in deployment transactions
- **CREATE/CREATE2 address derivation differs** from Ethereum
- **Gas model**: dual off-chain + on-chain cost
- **Unsupported opcodes**: `SELFDESTRUCT`, `CALLCODE`

Read [references/evm-differences.md](./references/evm-differences.md) before writing contracts.

## AGW Integration

### Client SDK (`@abstract-foundation/agw-client`)

```bash
npm install @abstract-foundation/agw-client viem
```

Key actions: `sendTransaction`, `writeContract`, `deployContract`, `sendCalls` (batch), `signMessage`.

### React SDK (`@abstract-foundation/agw-react`)

```bash
npm install @abstract-foundation/agw-react
```

Key hooks: `useLoginWithAbstract`, `useAbstractClient`, `useWriteContractSponsored`, `useCreateSession`, `useRevokeSessions`.

Read [references/agw-integration.md](./references/agw-integration.md) for setup details and code examples.

## Escalation

- Route transaction execution questions to `executing-agw-transactions`.
- Route wallet/balance queries to `reading-agw-wallet`.
- Route Uniswap trading to `trading-on-uniswap`.
- Route bridging to `bridging-to-abstract`.
