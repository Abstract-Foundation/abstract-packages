---
name: abstract-native-aa
description: Native account abstraction on Abstract — IAccount smart contract wallets, IPaymaster gas sponsorship, transaction flow, signature validation, and nonce handling for the Abstract Ethereum L2. This skill should be used when building custom paymasters, smart contract wallets, or working with Abstract's native AA system (IAccount, IPaymaster, DefaultAccount, bootloader, NonceHolder).
---

# Native Account Abstraction on Abstract

Abstract implements account abstraction **natively in the protocol** — not as an add-on like ERC-4337 on Ethereum. All accounts are smart contracts implementing `IAccount`. All transactions go through the same lifecycle. There is no parallel system.

**Default: Use AGW's built-in AA features** (see `abstract-global-wallet` skill) unless you need custom account logic or paymasters. This skill is for developers building custom smart contract wallets or paymasters.

## What Native AA Means

1. **All accounts are smart contracts** — even EOAs (MetaMask, etc.) get wrapped in `DefaultAccount`
2. **All accounts support paymasters natively** — any account can sponsor gas or pay in ERC-20
3. **No separate bundler/mempool** — transactions go through the standard mempool and bootloader
4. **Standard interface** — all accounts implement `IAccount`, all paymasters implement `IPaymaster`

## Transaction Flow

```
User submits tx → Mempool → Bootloader picks up
  → NonceHolder: check nonce unused
  → Account has code? No → wrap in DefaultAccount
  → account.validateTransaction() → returns MAGIC if valid
  → account.executeTransaction() → runs the actual call
  → account.payForTransaction() OR account.prepareForPaymaster()
  → If paymaster: paymaster.validateAndPayForPaymasterTransaction()
  → If paymaster: paymaster.postTransaction() (optional, not guaranteed on OOG)
```

## Decision Table

| Goal | Approach |
|------|----------|
| Sponsor gas for end users | Use AGW's `useWriteContractSponsored` (simplest) |
| Let users pay gas in ERC-20 | Build a custom paymaster (`references/paymasters.md`) |
| Custom signature validation | Build a custom smart contract wallet (`references/smart-accounts.md`) |
| Recovery mechanisms / spending limits | Build a custom smart contract wallet |
| Standard EOA behavior | No action needed — `DefaultAccount` handles it |

## Getting Started

Install system contracts:

```bash
# Hardhat
npm install @matterlabs/zksync-contracts

# Foundry
forge install matter-labs/era-contracts
```

## Feature Reference

| Topic | Where to look |
|-------|--------------|
| Building paymasters (IPaymaster) | `references/paymasters.md` |
| Building smart contract wallets (IAccount) | `references/smart-accounts.md` |

## Example Repositories

- [Smart Contract Accounts (Ethers)](https://github.com/Abstract-Foundation/examples/tree/main/smart-contract-accounts)
- [Smart Contract Account Factory](https://github.com/Abstract-Foundation/examples/tree/main/smart-contract-account-factory)
- [Smart Contract Accounts (Viem)](https://github.com/Abstract-Foundation/examples/tree/main/smart-contract-accounts-viem)
- [Paymasters](https://github.com/Abstract-Foundation/examples/tree/main/paymasters)

## References

- [Native AA Overview](https://docs.abs.xyz/how-abstract-works/native-account-abstraction/overview)
- [Transaction Flow](https://docs.abs.xyz/how-abstract-works/native-account-abstraction/transaction-flow)
