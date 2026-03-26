# Network Configuration

## Contents
- Chain Configuration
- RPC Endpoints
- Explorers
- Faucets
- Key System Contracts

## Chain Configuration

| Property | Mainnet | Testnet |
|----------|---------|---------|
| Chain ID | 2741 | 11124 |
| Currency | ETH | ETH |
| L1 | Ethereum Mainnet | Ethereum Sepolia |
| Data Availability | Celestia | Celestia |
| Rollup Type | ZK Rollup (ZK Stack) | ZK Rollup (ZK Stack) |

## RPC Endpoints

| Network | HTTP | WebSocket |
|---------|------|-----------|
| Mainnet | `https://api.mainnet.abs.xyz` | `wss://api.mainnet.abs.xyz/ws` |
| Testnet | `https://api.testnet.abs.xyz` | `wss://api.testnet.abs.xyz/ws` |

Third-party RPC providers: Alchemy, QuickNode, BlastAPI, dRPC.

## Explorers

| Network | URL |
|---------|-----|
| Mainnet | `https://abscan.org` |
| Testnet | `https://sepolia.abscan.org` |

## Faucets

Testnet ETH: Available through the Abstract testnet faucet and third-party Sepolia faucets.

## Key System Contracts

| Contract | Address | Purpose |
|----------|---------|---------|
| ContractDeployer | `0x0000000000000000000000000000000000008006` | All contract deployments |
| NonceHolder | `0x0000000000000000000000000000000000008003` | Nonce management |
| L1Messenger | `0x0000000000000000000000000000000000008008` | L2→L1 messaging |
| L2BaseToken | `0x000000000000000000000000000000000000800a` | Native ETH balances |
| Bootloader | `0x0000000000000000000000000000000000008001` | Transaction processing |
| BootloaderUtilities | `0x000000000000000000000000000000000000800c` | Bootloader helpers |
| ImmutableSimulator | `0x0000000000000000000000000000000000008005` | Immutable storage |
| Compressor | `0x000000000000000000000000000000000000800e` | Bytecode compression |
| PubdataChunkPublisher | `0x0000000000000000000000000000000000008011` | EIP-4844 blob publishing |
| MsgValueSimulator | `0x0000000000000000000000000000000000008009` | msg.value handling |
| SystemContext | `0x000000000000000000000000000000000000800b` | Block/tx context |
| EventWriter | `0x000000000000000000000000000000000000800d` | Event emission |
| KnownCodesStorage | `0x0000000000000000000000000000000000008004` | Bytecode hash registry |
| AccountCodeStorage | `0x0000000000000000000000000000000000008002` | Account code storage |
| ComplexUpgrader | `0x000000000000000000000000000000000000800f` | System upgrade logic |
| Create2Factory | `0x0000000000000000000000000000000000010000` | Permissionless CREATE2 |

## Session Key Policy Registry

Address: `0xA146c7118A46b32aBD0e1ACA41DF4e61061b6b93`

Mainnet apps must register session key policies through this registry after security review.

## Deployed Infrastructure

See the `trading-on-uniswap` skill's [references/contracts.md] for Uniswap V2/V3 addresses. Additional infrastructure:

| Contract | Mainnet Address |
|----------|----------------|
| WETH9 | `0x3439153EB7AF838Ad19d56E1571FBD09333C2809` |
| USDC | `0x84A71ccD554Cc1b02749b35d22F684CC8ec987e1` |
| USDT | `0x0709F39376dEEe2A2dfC94A58EdEb2Eb9DF012bD` |
| Seaport (OpenSea) | `0xDF3969A315e3fC15B89A2752D0915cc76A5bd82D` |
| ERC-8004 IdentityRegistry | `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432` |
| ERC-8004 ReputationRegistry | `0x8004BAa17C55a88189AE136b182e5fdA19dE9b63` |
| AbstractVoting | `0x3b50de27506f0a8c1f4122a1e6f470009a76ce2a` |
