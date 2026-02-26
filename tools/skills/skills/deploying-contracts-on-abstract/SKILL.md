---
name: deploying-contracts-on-abstract
description: Deploy smart contracts on Abstract using Foundry (default) or Hardhat. Covers zksolc compilation, deployment, Abscan verification, and testnet faucets for the Abstract Ethereum L2. Use this skill when deploying or compiling contracts on Abstract, using forge/foundry-zksync, verifying on Abscan, or working with the zkSync compiler on Abstract.
---

# Deploying Contracts on Abstract

**Default: Foundry.** Abstract uses the ZK Stack VM — contracts must be compiled with `zksolc`, not standard `solc`. For Hardhat, see `references/hardhat.md`. For EVM differences, see `references/evm-differences.md`.

## Foundry Setup

### 1. Install foundry-zksync

```bash
curl -L https://raw.githubusercontent.com/matter-labs/foundry-zksync/main/install-foundry-zksync | bash
foundryup-zksync
```

> **Warning:** This overwrites standard Foundry. Switch back with `foundryup` if needed.

### 2. Create project

```bash
forge init my-abstract-project && cd my-abstract-project
```

### 3. Configure `foundry.toml`

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

### 4. Compile

```bash
forge build --zksync
```

Outputs to `zkout/` (not `out/`).

## Deploy

### Store private key securely

```bash
cast wallet import myKeystore --interactive
```

### Fund the deployer

- **Testnet:** Claim from [faucets](https://docs.abs.xyz/tooling/faucets) or bridge from Sepolia
- **Mainnet:** Bridge ETH via [Abstract Bridge](https://portal.abs.xyz)

### Deploy + verify (testnet)

```bash
forge create src/Counter.sol:Counter \
  --account myKeystore \
  --rpc-url https://api.testnet.abs.xyz \
  --chain 11124 \
  --zksync \
  --verify \
  --verifier etherscan \
  --verifier-url https://api-sepolia.abscan.org/api \
  --etherscan-api-key ${ABSCAN_API_KEY}
```

### Deploy + verify (mainnet)

```bash
forge create src/Counter.sol:Counter \
  --account myKeystore \
  --rpc-url https://api.mainnet.abs.xyz \
  --chain 2741 \
  --zksync \
  --verify \
  --verifier etherscan \
  --verifier-url https://api.abscan.org/api \
  --etherscan-api-key ${ABSCAN_API_KEY}
```

### Constructor arguments

Append `--constructor-args <arg1> <arg2>` in the order defined in the constructor.

## Verify an Existing Contract

```bash
forge verify-contract <address> src/Counter.sol:Counter \
  --chain abstract-testnet \
  --etherscan-api-key ${ABSCAN_API_KEY} \
  --zksync
```

Use `--chain abstract` for mainnet.

## Testing

```bash
forge test --zksync
```

Fork testing against live networks:

```bash
forge test --zksync --fork-url https://api.testnet.abs.xyz
```

Local node:

```bash
anvil-zksync
forge test --zksync --fork-url http://localhost:8011
```

> **Cheatcode limitation:** On Abstract's ZK VM, cheatcodes (`vm.prank`, `vm.roll`, etc.) only work at the root test level — not from within contracts being tested.

## Decision: Foundry vs Hardhat

| Scenario | Use |
|----------|-----|
| Solidity-first, fast iteration | **Foundry** (default) |
| TypeScript preference | Hardhat (`references/hardhat.md`) |
| Existing Hardhat project | Hardhat (`references/hardhat.md`) |
| Existing Foundry project | **Foundry** |
| Need JS plugin ecosystem | Hardhat (`references/hardhat.md`) |

## Gotchas

- **All `forge` commands need `--zksync`** — without it, you get standard EVM bytecode that won't run on Abstract
- **`foundryup-zksync` overwrites standard Foundry** — use `foundryup` to switch back
- **Abscan API key required** — get one from [abscan.org](https://abscan.org) for both testnet and mainnet verification
- **`zkout/` not `out/`** — compiled artifacts go to a different directory
- Never commit private keys — use `cast wallet import` or environment variables
