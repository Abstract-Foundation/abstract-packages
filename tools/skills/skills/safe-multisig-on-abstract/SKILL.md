---
name: safe-multisig-on-abstract
description: Create and manage Safe multi-signature wallets on Abstract — deploy new Safes, configure owners and thresholds, propose and execute multi-sig transactions using the Safe SDK or the Safe UI. This skill should be used when working with Safe on Abstract, creating a multisig wallet on Abstract, safe.abs.xyz, Safe Protocol Kit on Abstract, multi-sig transactions, SafeL2, SafeProxyFactory, or managing shared wallets with multiple signers on Abstract.
---

# Safe Multisig on Abstract

Safe (formerly Gnosis Safe) is the standard multi-signature wallet on Abstract. Use it when multiple parties must approve transactions before execution — treasury management, team wallets, DAO operations, or any scenario requiring shared custody.

A Safe web interface is live at [safe.abs.xyz](https://safe.abs.xyz/).

## Quick Start (Web UI)

For non-programmatic use, create and manage Safes directly at [safe.abs.xyz](https://safe.abs.xyz/). Connect a wallet, add owner addresses, set the confirmation threshold, and deploy.

## Quick Start (SDK — Create a Safe)

```bash
npm install @safe-global/protocol-kit viem
```

```typescript
import Safe, { SafeAccountConfig, PredictedSafeProps } from "@safe-global/protocol-kit";
import { abstract } from "viem/chains";

const safeAccountConfig: SafeAccountConfig = {
  owners: [
    "0xOwner1Address",
    "0xOwner2Address",
    "0xOwner3Address",
  ],
  threshold: 2,
};

const predictedSafe: PredictedSafeProps = { safeAccountConfig };

const protocolKit = await Safe.init({
  provider: abstract.rpcUrls.default.http[0],
  signer: DEPLOYER_PRIVATE_KEY,
  predictedSafe,
});

const safeAddress = await protocolKit.getAddress();

const deploymentTx = await protocolKit.createSafeDeploymentTransaction();
const client = await protocolKit.getSafeProvider().getExternalSigner();

const txHash = await client!.sendTransaction({
  to: deploymentTx.to as `0x${string}`,
  value: BigInt(deploymentTx.value),
  data: deploymentTx.data as `0x${string}`,
  chain: abstract,
});
```

After deployment, verify:

```typescript
const kit = await protocolKit.connect({ safeAddress });
await kit.isSafeDeployed(); // true
await kit.getOwners();      // ["0xOwner1...", "0xOwner2...", "0xOwner3..."]
await kit.getThreshold();   // 2
```

## Quick Start (SDK — Execute a Multi-sig Transaction)

```typescript
import Safe from "@safe-global/protocol-kit";
import { MetaTransactionData, OperationType } from "@safe-global/types-kit";

const kitOwner1 = await Safe.init({
  provider: "https://api.mainnet.abs.xyz",
  signer: OWNER_1_PRIVATE_KEY,
  safeAddress: SAFE_ADDRESS,
});

const txData: MetaTransactionData = {
  to: "0xRecipientAddress",
  value: "1000000000000000", // 0.001 ETH in wei
  data: "0x",
  operation: OperationType.Call,
};

const safeTx = await kitOwner1.createTransaction({ transactions: [txData] });
const signedTx = await kitOwner1.signTransaction(safeTx);

// Owner 2 signs
const kitOwner2 = await Safe.init({
  provider: "https://api.mainnet.abs.xyz",
  signer: OWNER_2_PRIVATE_KEY,
  safeAddress: SAFE_ADDRESS,
});

const fullySignedTx = await kitOwner2.signTransaction(signedTx);

// Any owner executes once threshold is met
const executeTxResponse = await kitOwner1.executeTransaction(fullySignedTx);
```

## Deployed Contracts

| Contract | Address (Mainnet & Testnet) |
|----------|----------------------------|
| Safe | `0xC35F063962328aC65cED5D4c3fC5dEf8dec68dFa` |
| SafeL2 | `0x610fcA2e0279Fa1F8C00c8c2F71dF522AD469380` |
| SafeProxyFactory | `0xc329D02fd8CB2fc13aa919005aF46320794a8629` |
| MultiSend | `0x309D0B190FeCCa8e1D5D8309a16F7e3CB133E885` |

For the full deployed contract list, see `connecting-to-abstract` skill → `references/deployed-contracts.md`.

## Decision: UI vs SDK

| Scenario | Use |
|----------|-----|
| Manual treasury management | **UI** — [safe.abs.xyz](https://safe.abs.xyz/) |
| Programmatic Safe creation | **SDK** — Protocol Kit |
| Automated multi-sig flows | **SDK** — Protocol Kit |
| Off-chain signature collection (proposal service) | **UI** — see Transaction Service caveat below |
| Batch transactions (multiple calls in one) | **SDK** — MultiSend via Protocol Kit |

## Transaction Service Caveat

Abstract is **not listed** in Safe's official Transaction Service supported networks. The off-chain proposal flow (where owners sign asynchronously via the API Kit / `SafeApiKit`) may not work with the standard Safe infrastructure for Abstract.

**Workarounds:**
- Use [safe.abs.xyz](https://safe.abs.xyz/) for off-chain signature collection (it runs its own backend)
- Use the Protocol Kit for fully onchain signing — pass the transaction object between signers in your own application
- For automated pipelines, coordinate signatures offchain (e.g., via a database or messaging) and submit the fully-signed transaction onchain

## Gotchas

- **Abstract is a ZK Stack chain** — Safe contracts on Abstract are the same Safe codebase, but the underlying VM differs from standard EVM. The Protocol Kit handles this transparently.
- **SafeL2 is the recommended singleton** — on L2 chains, use the `SafeL2` contract (not `Safe`) for lower gas costs via event-based indexing
- **Transaction Service ≠ Protocol Kit** — the Protocol Kit works fully onchain and is chain-agnostic. The Transaction Service (API Kit) requires a supported backend endpoint.
- **Gas sponsorship** — Safe transactions on Abstract can be sponsored via a paymaster. See `abstract-global-wallet` skill for paymaster patterns.
- **Never store private keys in client code** — use `cast wallet import`, environment variables, or KMS for signer keys

## Feature Reference

| Topic | Where to look |
|-------|--------------|
| Protocol Kit detailed API | `references/protocol-kit.md` |
| Abstract network config (RPC, chain IDs) | `connecting-to-abstract` skill |
| All deployed contracts on Abstract | `connecting-to-abstract` skill → `references/deployed-contracts.md` |
| Safe official docs | [docs.safe.global](https://docs.safe.global/) |
| Safe UI on Abstract | [safe.abs.xyz](https://safe.abs.xyz/) |
