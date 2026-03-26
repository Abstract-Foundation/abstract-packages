# Safe Protocol Kit Reference

The Protocol Kit (`@safe-global/protocol-kit`) provides a TypeScript interface for creating and managing Safe smart accounts. All operations are onchain — no Transaction Service dependency.

## Installation

```bash
npm install @safe-global/protocol-kit @safe-global/types-kit viem
```

## Initialization

### Connect to an existing Safe

```typescript
import Safe from "@safe-global/protocol-kit";

const protocolKit = await Safe.init({
  provider: "https://api.mainnet.abs.xyz",
  signer: SIGNER_PRIVATE_KEY,
  safeAddress: "0xExistingSafeAddress",
});
```

### Predict and deploy a new Safe

```typescript
import Safe, { SafeAccountConfig, PredictedSafeProps } from "@safe-global/protocol-kit";

const safeAccountConfig: SafeAccountConfig = {
  owners: ["0xAddr1", "0xAddr2", "0xAddr3"],
  threshold: 2,
};

const predictedSafe: PredictedSafeProps = { safeAccountConfig };

const protocolKit = await Safe.init({
  provider: "https://api.mainnet.abs.xyz",
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

For testnet, use `https://api.testnet.abs.xyz` and import `abstractTestnet` from `viem/chains`.

## Reading Safe State

```typescript
await protocolKit.getAddress();    // Safe address
await protocolKit.getOwners();     // Owner addresses
await protocolKit.getThreshold();  // Required confirmations
await protocolKit.getBalance();    // ETH balance (bigint)
await protocolKit.getNonce();      // Current nonce
await protocolKit.isSafeDeployed(); // Deployment status
```

## Creating Transactions

### Single transaction

```typescript
import { MetaTransactionData, OperationType } from "@safe-global/types-kit";

const txData: MetaTransactionData = {
  to: "0xRecipient",
  value: "0",
  data: "0xEncodedCalldata",
  operation: OperationType.Call,
};

const safeTx = await protocolKit.createTransaction({
  transactions: [txData],
});
```

### Batch transaction (MultiSend)

Pass multiple transaction objects to execute them atomically in a single Safe transaction:

```typescript
const batch: MetaTransactionData[] = [
  {
    to: "0xTokenContract",
    value: "0",
    data: approveCalldata,
    operation: OperationType.Call,
  },
  {
    to: "0xProtocolContract",
    value: "0",
    data: depositCalldata,
    operation: OperationType.Call,
  },
];

const safeTx = await protocolKit.createTransaction({
  transactions: batch,
});
```

## Signing and Executing

### Collect signatures from multiple owners

```typescript
// Owner 1 creates and signs
const kitOwner1 = await Safe.init({
  provider: "https://api.mainnet.abs.xyz",
  signer: OWNER_1_PRIVATE_KEY,
  safeAddress: SAFE_ADDRESS,
});

const safeTx = await kitOwner1.createTransaction({ transactions: [txData] });
const signedByOwner1 = await kitOwner1.signTransaction(safeTx);

// Owner 2 signs the same transaction
const kitOwner2 = await Safe.init({
  provider: "https://api.mainnet.abs.xyz",
  signer: OWNER_2_PRIVATE_KEY,
  safeAddress: SAFE_ADDRESS,
});

const fullySignedTx = await kitOwner2.signTransaction(signedByOwner1);

// Execute once threshold is met (any owner can execute)
const result = await kitOwner1.executeTransaction(fullySignedTx);
```

### Get transaction hash for coordination

```typescript
const safeTxHash = await protocolKit.getTransactionHash(safeTx);
```

Use this hash as a coordination key when passing transactions between signers outside the Transaction Service.

## Owner and Threshold Management

### Add an owner

```typescript
const addOwnerTx = await protocolKit.createAddOwnerTx({
  ownerAddress: "0xNewOwner",
  threshold: 2, // optional: update threshold at the same time
});
const signedTx = await protocolKit.signTransaction(addOwnerTx);
// Collect remaining signatures, then execute
```

### Remove an owner

```typescript
const removeOwnerTx = await protocolKit.createRemoveOwnerTx({
  ownerAddress: "0xOwnerToRemove",
  threshold: 2,
});
```

### Change threshold

```typescript
const changeThresholdTx = await protocolKit.createChangeThresholdTx(3);
```

## EIP-1193 Signers

The Protocol Kit also accepts EIP-1193 compatible signers instead of raw private keys:

```typescript
const protocolKit = await Safe.init({
  provider: window.ethereum, // or any EIP-1193 provider
  signer: userAddress,       // address of the connected signer
  safeAddress: SAFE_ADDRESS,
});
```

## Key Types

| Type | Package | Purpose |
|------|---------|---------|
| `SafeAccountConfig` | `@safe-global/protocol-kit` | Owners + threshold for new Safe |
| `PredictedSafeProps` | `@safe-global/protocol-kit` | Wrapper for counterfactual Safe |
| `MetaTransactionData` | `@safe-global/types-kit` | Transaction payload (to, value, data, operation) |
| `OperationType` | `@safe-global/types-kit` | `Call` (0) or `DelegateCall` (1) |

## Abstract-Specific Notes

- Use `https://api.mainnet.abs.xyz` (mainnet) or `https://api.testnet.abs.xyz` (testnet) as the provider URL
- Import `abstract` or `abstractTestnet` from `viem/chains` when sending deployment transactions
- Safe contracts are already deployed on Abstract — the Protocol Kit uses the standard deployment addresses automatically
- For gas sponsorship, integrate a paymaster at the transaction execution layer (see `abstract-global-wallet` skill)
