---
name: using-agw-mcp
description: Use the Abstract Global Wallet MCP server to give AI agents wallet capabilities on Abstract — read chain data, check balances, and (coming soon) send transactions on behalf of users. Use this skill when setting up agw-mcp, giving AI agents wallet access on Abstract, or building MCP-powered agent workflows that interact with Abstract chain data.
---

# Using AGW MCP

The [agw-mcp](https://github.com/Abstract-Foundation/agw-mcp) server gives AI agents wallet capabilities on Abstract via the Model Context Protocol. This is the counterpart to the `abstract-global-wallet` skill — AGW is for end-user facing apps, agw-mcp is for AI agent access.

## When to Use What

| Scenario | Tool |
|----------|------|
| Building a React app where users log in and transact | `abstract-global-wallet` skill (AGW React SDK) |
| AI agent needs to read chain data / balances | **agw-mcp** (this skill) |
| AI agent needs to execute transactions on user's behalf | **agw-mcp** (read+write coming soon) |
| AI agent needs to trade on Myriad | `myriad-on-abstract` skill (API) + **agw-mcp** for wallet ops |

## Current Status

**v1 — read-only.** The MCP server currently provides read access to Abstract chain data. Write capabilities (sending transactions, signing messages) are in active development.

## Setup

agw-mcp is an MCP server. Configure it in your Claude Code settings, AI agent framework, or any MCP-compatible client.

Since the repo is currently private, refer to the README in the agw-mcp repository for installation and configuration instructions.

## Complementary Skills

agw-mcp handles wallet *execution*. Pair it with these skills for domain *knowledge*:

| Need | Skill |
|------|-------|
| Understand Abstract network config | `connecting-to-abstract` |
| Deploy contracts | `deploying-contracts-on-abstract` |
| Understand AGW architecture | `abstract-global-wallet` |
| Trade on Myriad markets | `myriad-on-abstract` |
| Understand gas sponsorship / paymasters | `abstract-native-aa` |
