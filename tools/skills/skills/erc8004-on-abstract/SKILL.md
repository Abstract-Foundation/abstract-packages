---
name: erc8004-on-abstract
description: Register AI agents, track reputation, and discover agents on Abstract using ERC-8004 — the onchain identity and reputation protocol for trustless agent economies. This skill should be used when registering an agent onchain, querying agent reputation, giving feedback to an agent, working with IdentityRegistry or ReputationRegistry on Abstract, ERC-8004, agent discovery, or onchain agent identity.
---

# ERC-8004 on Abstract

ERC-8004 gives AI agents onchain identity and reputation on Abstract. Agents mint an NFT identity, publish a metadata URI describing their capabilities, and accumulate reputation feedback from clients who use them.

Abstract has the IdentityRegistry and ReputationRegistry deployed on mainnet. For the full deployed contract list, see `connecting-to-abstract` skill → `references/deployed-contracts.md`.

## Contract Addresses (Mainnet)

| Contract | Address |
|----------|---------|
| IdentityRegistry | `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432` |
| ReputationRegistry | `0x8004BAa17C55a88189AE136b182e5fdA19dE9b63` |

## Quick Start: Register an Agent

```typescript
import { createWalletClient, http } from "viem";
import { abstract } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

const account = privateKeyToAccount(process.env.PRIVATE_KEY);
const client = createWalletClient({ account, chain: abstract, transport: http() });

const agentId = await client.writeContract({
  address: "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432",
  abi: [{ name: "register", type: "function", stateMutability: "nonpayable", inputs: [{ name: "agentURI", type: "string" }], outputs: [{ name: "agentId", type: "uint256" }] }],
  functionName: "register",
  args: ["https://your-agent.com/agent.json"],
});
```

The `agentURI` points to a JSON file describing your agent. See `references/agent-uri-schema.md` for the schema.

## Quick Start: Check an Agent's Reputation

```typescript
import { createPublicClient, http } from "viem";
import { abstract } from "viem/chains";

const client = createPublicClient({ chain: abstract, transport: http() });

const [count, summaryValue, decimals] = await client.readContract({
  address: "0x8004BAa17C55a88189AE136b182e5fdA19dE9b63",
  abi: [{ name: "getSummary", type: "function", stateMutability: "view", inputs: [{ name: "agentId", type: "uint256" }, { name: "clientAddresses", type: "address[]" }, { name: "tag1", type: "string" }, { name: "tag2", type: "string" }], outputs: [{ name: "count", type: "uint64" }, { name: "summaryValue", type: "int128" }, { name: "summaryValueDecimals", type: "uint8" }] }],
  functionName: "getSummary",
  args: [22n, [], "starred", ""],
});
```

Pass specific `clientAddresses` to filter by trusted reviewers, or `[]` for all feedback.

## Quick Start: Give Feedback

```typescript
await client.writeContract({
  address: "0x8004BAa17C55a88189AE136b182e5fdA19dE9b63",
  abi: [{ name: "giveFeedback", type: "function", stateMutability: "nonpayable", inputs: [{ name: "agentId", type: "uint256" }, { name: "value", type: "int128" }, { name: "valueDecimals", type: "uint8" }, { name: "tag1", type: "string" }, { name: "tag2", type: "string" }, { name: "endpoint", type: "string" }, { name: "feedbackURI", type: "string" }, { name: "feedbackHash", type: "bytes32" }], outputs: [] }],
  functionName: "giveFeedback",
  args: [
    22n,       // agentId
    85n,       // value (e.g. 85/100 rating)
    0,         // valueDecimals
    "starred", // tag1 — category
    "",        // tag2 — subcategory (optional)
    "https://agent.example.com/GetPrice", // endpoint used
    "",        // feedbackURI — link to off-chain evidence (optional)
    "0x0000000000000000000000000000000000000000000000000000000000000000", // feedbackHash
  ],
});
```

## Decision: What Do You Need?

| Goal | Registry | Function |
|------|----------|----------|
| Give an agent an onchain identity | IdentityRegistry | `register(agentURI)` |
| Update agent metadata/URI | IdentityRegistry | `setAgentURI(agentId, newURI)` |
| Set a payment wallet for an agent | IdentityRegistry | `setAgentWallet(agentId, wallet, deadline, sig)` |
| Store key-value metadata | IdentityRegistry | `setMetadata(agentId, key, value)` |
| Rate an agent after using it | ReputationRegistry | `giveFeedback(...)` |
| Check an agent's reputation score | ReputationRegistry | `getSummary(agentId, clients, tag1, tag2)` |
| Read individual feedback entries | ReputationRegistry | `readAllFeedback(...)` |
| Revoke feedback you gave | ReputationRegistry | `revokeFeedback(agentId, feedbackIndex)` |
| Discover agents | IdentityRegistry | Enumerate via ERC-721 `tokenURI` |

## Common Feedback Tags

| tag1 | What it measures | Example value | decimals |
|------|-----------------|---------------|----------|
| `starred` | Quality rating (0-100) | `87` | `0` |
| `uptime` | Endpoint uptime (%) | `9977` (99.77%) | `2` |
| `responseTime` | Response latency (ms) | `560` | `0` |
| `tradingYield` | Yield (tag2=day/week/month) | `-32` (-3.2%) | `1` |

## Gotchas

- **IdentityRegistry is an ERC-721** — each agent identity is an NFT owned by the registrant's address
- **You cannot give feedback to your own agent** — the contract rejects feedback from the agent's owner or approved operators
- **`clientAddresses` filtering is critical** — passing `[]` returns all feedback including potential Sybil spam; pass trusted reviewer addresses for meaningful scores
- **`agentWallet` requires a signature** — setting a payment wallet needs an EIP-712 or ERC-1271 signature proving wallet ownership
- **ValidationRegistry is not yet deployed** — the third registry (for stake-secured re-execution, zkML proofs) is part of the ERC-8004 spec but not live on Abstract yet

## Feature Reference

| Topic | Where to look |
|-------|--------------|
| Full IdentityRegistry functions | `references/identity-registry.md` |
| Full ReputationRegistry functions | `references/reputation-registry.md` |
| Agent registration JSON schema | `references/agent-uri-schema.md` |
| Abstract deployed contracts | `connecting-to-abstract` skill → `references/deployed-contracts.md` |

## References

- [ERC-8004 Specification](https://eips.ethereum.org/EIPS/eip-8004)
- [Abstract Deployed Contracts](https://docs.abs.xyz/tooling/deployed-contracts)
