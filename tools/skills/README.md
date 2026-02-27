<div align="center">
    <img src="https://mintlify.s3-us-west-1.amazonaws.com/abstract/images/Block.svg" width="700px" alt="abstract banner"/>
    <br />
    <h1>Abstract Skills</h1>
    <p align="center">A <a href="https://docs.anthropic.com/en/docs/claude-code/plugins">Claude Code plugin</a> for building on <a href="https://abs.xyz">Abstract</a> — the blockchain leading the next generation of consumer crypto.</p>
</div>

<br/>

## What is this?

Install this plugin and Claude learns how to build smart contracts and applications on Abstract — from connecting to the network and deploying contracts, to integrating wallets, prediction markets, and onchain agent identity.

Complements [agw-mcp](https://github.com/Abstract-Foundation/agw-mcp) — this plugin teaches *how to build*, agw-mcp gives AI agents *wallet capabilities* on Abstract.

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

Each skill is a standalone module that Claude loads on-demand when relevant to your task. Within each directory, you'll find a `SKILL.md` with core guidance and a `references/` directory with deeper documentation.

| Skill | Description |
| --- | --- |
| [connecting-to-abstract](skills/connecting-to-abstract/) | Connect to Abstract — chain IDs, RPC endpoints, block explorers, and deployed contract addresses for mainnet and testnet. |
| [deploying-contracts-on-abstract](skills/deploying-contracts-on-abstract/) | Deploy smart contracts to Abstract using Foundry (default) or Hardhat. Covers zksolc compilation, Abscan verification, and testing. |
| [abstract-global-wallet](skills/abstract-global-wallet/) | Integrate Abstract Global Wallet — email/social login, smart contract wallet, session keys, gas sponsorship, and third-party wallet providers. |
| [using-agw-mcp](skills/using-agw-mcp/) | Give AI agents wallet capabilities on Abstract via the AGW MCP server — read chain data, check balances, and send transactions. |
| [safe-multisig-on-abstract](skills/safe-multisig-on-abstract/) | Create and manage Safe multi-signature wallets on Abstract — deploy Safes, configure owners and thresholds, and execute multi-sig transactions. |
| [myriad-on-abstract](skills/myriad-on-abstract/) | Build with Myriad Protocol prediction markets — REST API for market data, SDK for trading outcome shares, and builder revenue sharing. |
| [erc8004-on-abstract](skills/erc8004-on-abstract/) | Register AI agents onchain, track reputation, and discover agents using ERC-8004 — the identity and reputation protocol for agent economies. |

## Commands

| Command | Description |
| --- | --- |
| `/abstract-quickstart` | Scaffold a new Abstract project. |

## Ecosystem Plugins

Other apps in the Abstract ecosystem with their own Claude Code plugins:

| App | Description | Plugin |
| --- | --- | --- |
| [Gigaverse](https://gigaverse.io) | Rogue-lite dungeon crawler — AI agents quest, battle, loot, and compete on leaderboards. | [Gigaverse-Games/play](https://github.com/Gigaverse-Games/play) |

## Design Philosophy

**Opinionated with escape hatches.** Each skill picks the best default (Foundry over Hardhat, AGW over raw wallets) and puts alternatives in `references/`. Claude gets the right answer first, with the full picture available when needed.

## Adding Your App

Building on Abstract? Add skills for your app by following the pattern in `skills/myriad-on-abstract/`:

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
