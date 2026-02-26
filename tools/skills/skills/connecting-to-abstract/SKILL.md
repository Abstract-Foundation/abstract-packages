---
name: connecting-to-abstract
description: Abstract network configuration — chain IDs, RPC endpoints, WebSocket URLs, block explorers, and wallet setup for the Abstract Ethereum L2. Use this skill when configuring clients, wallets, or dev environments for Abstract, including questions about Abstract RPC URLs, chain IDs (2741/11124), testnet config, Abscan explorer, or connecting to the Abstract network.
---

# Connecting to Abstract

Abstract is a Layer 2 ZK rollup on Ethereum (ZK Stack). Use these values whenever configuring a client, wallet, or development environment.

## Network Configuration

| Property | Mainnet | Testnet |
|----------|---------|---------|
| Network name | Abstract | Abstract Testnet |
| Chain ID | `2741` | `11124` |
| RPC | `https://api.mainnet.abs.xyz` | `https://api.testnet.abs.xyz` |
| WebSocket | `wss://api.mainnet.abs.xyz/ws` | `wss://api.testnet.abs.xyz/ws` |
| Block explorer | `https://abscan.org` | `https://sepolia.abscan.org` |
| Verify API | `https://api.abscan.org/api` | `https://api-sepolia.abscan.org/api` |
| Currency | ETH | ETH |

## Viem Chain Config

```ts
import { abstract, abstractTestnet } from "viem/chains";
```

Both chains are exported from `viem/chains` — no manual configuration needed.

## Testnet ETH

Get testnet ETH from faucets or bridge from Sepolia. See [Faucets](https://docs.abs.xyz/tooling/faucets).

## Additional RPC Providers

For production traffic beyond the default public endpoints, see [RPC Providers](https://docs.abs.xyz/ecosystem/rpc-providers) for Alchemy, QuickNode, and other options.
