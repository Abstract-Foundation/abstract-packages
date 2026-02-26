---
name: abstract-quickstart
description: Scaffold a new Abstract project — choose framework, configure AGW, set up network
allowed-tools:
  - AskUserQuestion
  - Bash
  - Write
  - Edit
  - Read
---

# Abstract Quickstart

You are scaffolding a new project on Abstract (Ethereum L2, ZK Stack).

## Step 1: Ask what they're building

<question>
What type of Abstract project do you want to create?

<options>
<option value="react-app">React App with AGW (recommended) — Full-stack app with Abstract Global Wallet, email/social login, gas sponsorship</option>
<option value="smart-contract">Smart Contracts Only — Foundry project for deploying contracts to Abstract</option>
<option value="both">Full Stack — Smart contracts + React frontend with AGW</option>
</options>
</question>

## Step 2: For React apps

If the user chose react-app or both:

1. Run the official scaffolder:
```bash
npx @abstract-foundation/create-abstract-app@latest <project-name>
```

2. Confirm the generated project has:
   - `@abstract-foundation/agw-react` and `@abstract-foundation/agw-client` installed
   - `AbstractWalletProvider` wrapping the app
   - `useLoginWithAbstract` hook ready to use
   - `viem@2.x` (not 1.x)
   - Chain set to `abstractTestnet` for development

3. Share quick tips:
   - Switch to `abstract` (mainnet) chain when ready for production
   - Use `useWriteContractSponsored` for gas-free transactions
   - See `abstract-global-wallet` skill for session keys and advanced features

## Step 3: For smart contracts

If the user chose smart-contract or both:

1. Ask about framework preference (default to Foundry):

<question>
Which smart contract framework?

<options>
<option value="foundry">Foundry (recommended) — Solidity-first, fast compilation</option>
<option value="hardhat">Hardhat — TypeScript-first, plugin ecosystem</option>
</options>
</question>

2. For Foundry:
```bash
# Install foundry-zksync (overwrites standard Foundry)
curl -L https://raw.githubusercontent.com/matter-labs/foundry-zksync/main/install-foundry-zksync | bash
foundryup-zksync

# Create project
forge init <project-name> && cd <project-name>
```

Then update `foundry.toml`:
```toml
[profile.default]
src = 'src'
libs = ['lib']
fallback_oz = true
is_system = false
mode = "3"

[etherscan]
abstractTestnet = { chain = "11124", url = "https://api-sepolia.abscan.org/api", key = "${ABSCAN_API_KEY}" }
abstractMainnet = { chain = "2741", url = "https://api.abscan.org/api", key = "${ABSCAN_API_KEY}" }
```

3. For Hardhat:
```bash
npx hardhat init
npm install -D @matterlabs/hardhat-zksync zksync-ethers@6 ethers@6
```

Then configure `hardhat.config.ts` with Abstract network settings.

4. Remind them:
   - All `forge` commands need `--zksync` flag
   - Compiled output goes to `zkout/` (Foundry) or `artifacts-zk/` (Hardhat)
   - Get testnet ETH from faucets: https://docs.abs.xyz/tooling/faucets
   - See `deploying-contracts-on-abstract` skill for deployment workflow

## Step 4: Summary

After scaffolding, print a summary of:
- What was created
- Key files to edit
- Next steps (deploy, test, connect wallet)
- Relevant skills for deeper topics
