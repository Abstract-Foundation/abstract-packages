# Abstract Skills

Curated skills for building on [Abstract](https://abs.xyz) — the consumer-focused Ethereum L2.

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

| Skill | What it covers |
|-------|---------------|
| [connecting-to-abstract](skills/connecting-to-abstract/) | Network config, RPC endpoints, chain IDs, explorers |
| [deploying-contracts-on-abstract](skills/deploying-contracts-on-abstract/) | Foundry-first smart contract deployment (Hardhat alternative in references) |
| [abstract-global-wallet](skills/abstract-global-wallet/) | AGW integration — React hooks, session keys, wallet providers |
| [using-agw-mcp](skills/using-agw-mcp/) | AI agent wallet access via the AGW MCP server |
| [myriad-on-abstract](skills/myriad-on-abstract/) | Prediction market integration with Myriad |

## Commands

| Command | Description |
|---------|-------------|
| `/abstract-quickstart` | Scaffold a new Abstract project |

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
