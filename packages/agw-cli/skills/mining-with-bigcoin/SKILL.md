---
name: mining-with-bigcoin
description: Interact with the Bigcoin virtual mining game on Abstract — buy facilities, purchase miners, claim rewards, check hashrate, and manage mining operations. Use when a user wants to play Bigcoin, mine $BIG tokens, buy a facility or miner, claim mining rewards, check pending rewards, view hashrate, upgrade their facility, sell miners, or interact with the Bigcoin game contracts on Abstract. Trigger for requests mentioning Bigcoin, $BIG, BIG token, virtual mining, hashrate, facility, miner purchase, mining rewards, claim BIG, or Bigcoin game on Abstract.
---

# Mining with Bigcoin

Bigcoin is a virtual Bitcoin mining simulator on Abstract. Players buy facilities, purchase miners with $BIG tokens, and earn $BIG proportional to their share of global hashrate. Fixed supply of 21M $BIG with halving every 4.2M blocks.

## ABI Format

The AGW CLI requires full JSON ABI objects, not human-readable strings. Every `abi` array element must be an object with `type`, `name`, `inputs`, `outputs`, and `stateMutability` fields.

## Operating Rules

- Check pending rewards before claiming — no point paying gas for zero rewards.
- Check facility status before buying miners — miners require sufficient facility capacity and power.
- Preview every purchase and claim with `--dry-run` before execution.
- Miner purchases require $BIG token balance. Check with `agw wallet tokens list`.
- Initial facility purchase costs ETH (payable), not $BIG.
- Read [references/game-contracts.md](./references/game-contracts.md) for the full contract interface, facility tiers, and mining mechanics.

## Contracts

| Contract | Mainnet Address |
|----------|----------------|
| Bigcoin Game (proxy) | `0x89eb96a0a157f935de38d548b79af511d424e33a` |
| $BIG Token (ERC-20) | `0xdf70075737e9f96b078ab4461eee3e055e061223` |

## Current State

- Emission: halving every 4,200,000 blocks, started at 2.5 BIG/block
- Current emission: ~0.039 BIG/block (after multiple halvings)
- 75% of $BIG spent on upgrades/miners is burned
- Miners are auto-staked on purchase with 24-hour lockup

## Task Map

### Check pending rewards

```bash
agw contract write --json '{
  "address": "0x89eb96a0a157f935de38d548b79af511d424e33a",
  "abi": [{"type":"function","name":"pendingRewards","stateMutability":"view","inputs":[{"name":"player","type":"address"}],"outputs":[{"name":"","type":"uint256"}]}],
  "functionName": "pendingRewards",
  "args": ["<YOUR_ADDRESS>"]
}' --dry-run
```

Result is in 18-decimal raw units. Divide by 1e18 for human-readable $BIG.

### Claim mining rewards

```bash
agw contract write --json '{
  "address": "0x89eb96a0a157f935de38d548b79af511d424e33a",
  "abi": [{"type":"function","name":"claimRewards","stateMutability":"nonpayable","inputs":[],"outputs":[{"name":"","type":"uint256"}]}],
  "functionName": "claimRewards",
  "args": []
}' --dry-run
```

### Check facility status

```bash
agw contract write --json '{
  "address": "0x89eb96a0a157f935de38d548b79af511d424e33a",
  "abi": [{"type":"function","name":"ownerToFacility","stateMutability":"view","inputs":[{"name":"player","type":"address"}],"outputs":[{"name":"","type":"tuple","components":[{"name":"facilityIndex","type":"uint256"},{"name":"maxMiners","type":"uint256"},{"name":"totalPowerOutput","type":"uint256"},{"name":"cost","type":"uint256"},{"name":"x","type":"uint256"},{"name":"y","type":"uint256"}]}]}],
  "functionName": "ownerToFacility",
  "args": ["<YOUR_ADDRESS>"]
}' --dry-run
```

### Check player's hashrate per block

```bash
agw contract write --json '{
  "address": "0x89eb96a0a157f935de38d548b79af511d424e33a",
  "abi": [{"type":"function","name":"playerBigcoinPerBlock","stateMutability":"view","inputs":[{"name":"player","type":"address"}],"outputs":[{"name":"","type":"uint256"}]}],
  "functionName": "playerBigcoinPerBlock",
  "args": ["<YOUR_ADDRESS>"]
}' --dry-run
```

### Buy initial facility (costs ETH)

First facility requires a one-time ETH payment to prevent bots. Check the current price, then purchase:

```bash
agw contract write --json '{
  "address": "0x89eb96a0a157f935de38d548b79af511d424e33a",
  "abi": [{"type":"function","name":"purchaseInitialFacility","stateMutability":"payable","inputs":[{"name":"referrer","type":"address"}],"outputs":[]}],
  "functionName": "purchaseInitialFacility",
  "args": ["0x0000000000000000000000000000000000000000"],
  "value": "<FACILITY_PRICE_WEI>"
}' --dry-run
```

Pass zero address for no referrer, or a referrer address for 2.5% reward split.

### Buy a miner (costs $BIG)

Requires $BIG approval to the game contract first, then purchase. Use `agw tx calls` to batch:

```bash
agw tx calls --json '{
  "calls": [
    {
      "to": "0xdf70075737e9f96b078ab4461eee3e055e061223",
      "data": "0x095ea7b300000000000000000000000089eb96a0a157f935de38d548b79af511d424e33a<AMOUNT_PADDED>",
      "value": "0"
    },
    {
      "to": "0x89eb96a0a157f935de38d548b79af511d424e33a",
      "data": "<ENCODED_buyMiner>",
      "value": "0"
    }
  ]
}' --dry-run
```

`buyMiner(uint256 minerIndex, uint256 x, uint256 y)` — minerIndex selects the miner type, x/y set the grid position.

### Check current emission rate

```bash
agw contract write --json '{
  "address": "0x89eb96a0a157f935de38d548b79af511d424e33a",
  "abi": [{"type":"function","name":"getBigcoinPerBlock","stateMutability":"view","inputs":[],"outputs":[{"name":"","type":"uint256"}]}],
  "functionName": "getBigcoinPerBlock",
  "args": []
}' --dry-run
```

## Game Mechanics Summary

- **Facility**: Required first. Tiers 1-9 with increasing miner capacity and power output.
- **Miners**: Purchased with $BIG. Auto-staked for 24 hours. Contribute hashrate to earn rewards.
- **Rewards**: Proportional to `playerHashrate / totalNetworkHashrate * emissionPerBlock`.
- **Burns**: 75% of $BIG spent is burned. 25% goes to the contract treasury.
- **Selling**: Miners can be sold back in-game (burned permanently). High-end miners may not be sellable.

## Escalation

- Route $BIG token balance queries to `reading-agw-wallet`.
- Route $BIG trading/swapping to `trading-on-uniswap`.
- Route transaction safety to `executing-agw-transactions`.
