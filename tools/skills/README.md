<div align="center">
    <img src="https://mintlify.s3-us-west-1.amazonaws.com/abstract/images/Block.svg" width="700px" alt="abstract banner"/>
    <br />
    <h1>Abstract Skills</h1>
    <p align="center">Curated skills for building on <a href="https://abs.xyz">Abstract</a> — the consumer-focused Ethereum L2.</p>
</div>

<br/>

## What is this?

A [Claude Code plugin](https://docs.anthropic.com/en/docs/claude-code/plugins) that teaches AI assistants how to build on Abstract. Install it and Claude gains deep knowledge of Abstract's toolchain, wallet system, account abstraction, and ecosystem apps.

Complements [agw-mcp](https://github.com/Abstract-Foundation/agw-mcp) — this plugin teaches *how to build*, agw-mcp provides *wallet execution capabilities* for AI agents.

## Installation

### As a Claude Code plugin

```bash
claude plugin add abstract-skills
```

### From GitHub

```bash
git clone https://github.com/Abstract-Foundation/abstract-skills.git
claude plugin add ./abstract-skills
```

## Skills

Each skill is a standalone module that Claude loads on-demand when relevant to your task. Within each directory, you'll find a `SKILL.md` with core guidance and a `references/` directory with detailed documentation.

| Skill | Description |
| --- | --- |
| [connecting-to-abstract](skills/connecting-to-abstract/) | Network config, RPC endpoints, chain IDs, block explorers, and deployed contract addresses for Abstract mainnet and testnet. |
| [deploying-contracts-on-abstract](skills/deploying-contracts-on-abstract/) | Deploy smart contracts to Abstract using Foundry (default) or Hardhat. Covers zksolc compilation, verification on Abscan, and testing. |
| [abstract-global-wallet](skills/abstract-global-wallet/) | Integrate Abstract Global Wallet into React apps — email/social login, smart contract wallet, session keys, gas sponsorship, and wallet providers. |
| [using-agw-mcp](skills/using-agw-mcp/) | Give AI agents wallet capabilities on Abstract via the AGW MCP server — read chain data, check balances, and execute transactions. |
| [safe-multisig-on-abstract](skills/safe-multisig-on-abstract/) | Create and manage Safe multi-signature wallets on Abstract — deploy Safes, configure owners and thresholds, propose and execute multi-sig transactions. |
| [myriad-on-abstract](skills/myriad-on-abstract/) | Integrate Myriad Protocol prediction markets — REST API for market data, SDK for trading outcome shares, and builder revenue sharing. |
| [erc8004-on-abstract](skills/erc8004-on-abstract/) | Register AI agents, track reputation, and discover agents onchain using ERC-8004 — the identity and reputation protocol for agent economies. |

## Commands

| Command | Description |
| --- | --- |
| `/abstract-quickstart` | Scaffold a new Abstract project. |

## Ecosystem App Plugins

Other Abstract ecosystem apps with their own Claude Code plugins:

| App | Description | Plugin |
| --- | --- | --- |
| [Gigaverse](https://gigaverse.io) | Rogue-lite dungeon crawler — AI agents quest, battle, loot, and compete on leaderboards. | [Gigaverse-Games/play](https://github.com/Gigaverse-Games/play) |

## Design Philosophy

**Opinionated with escape hatches.** Each skill picks the best default (Foundry over Hardhat, AGW over raw wallets) and puts alternatives in `references/` subdirectories. This means AI assistants give you the right answer first, with the full picture available when needed.

## Adding Ecosystem Apps

Want to add skills for your Abstract ecosystem app? Follow the pattern in `skills/myriad-on-abstract/`:

```
skills/your-app-on-abstract/
├── SKILL.md              # Opinionated quick start + decision tables
└── references/
    ├── api.md            # Full API reference
    ├── sdk.md            # SDK documentation
    └── ...               # Additional reference material
```

## License

MIT
