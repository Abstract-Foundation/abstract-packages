# AGW Integration Reference

## Contents
- Client SDK Setup
- React SDK Setup
- Key Hooks
- Session Keys
- Sponsored Transactions

## Client SDK Setup

```bash
npm install @abstract-foundation/agw-client viem
```

```typescript
import { createAbstractClient } from "@abstract-foundation/agw-client";
import { abstractMainnet } from "viem/chains";

const client = await createAbstractClient({
  chain: abstractMainnet,
  signer: walletClient, // viem WalletClient
});

// Send transaction
const hash = await client.sendTransaction({
  to: "0x...",
  value: parseEther("0.1"),
});

// Write contract
const hash = await client.writeContract({
  address: "0x...",
  abi: contractAbi,
  functionName: "mint",
  args: [tokenId],
});

// Batch transactions (EIP-5792)
const hash = await client.sendCalls({
  calls: [
    { to: tokenAddress, data: approveCalldata },
    { to: routerAddress, data: swapCalldata },
  ],
});
```

## React SDK Setup

```bash
npm install @abstract-foundation/agw-react wagmi viem @tanstack/react-query
```

Wrap the app with `AbstractWalletProvider`:

```tsx
import { AbstractWalletProvider } from "@abstract-foundation/agw-react";

function App({ children }) {
  return (
    <AbstractWalletProvider chain="abstractMainnet">
      {children}
    </AbstractWalletProvider>
  );
}
```

## Key Hooks

### useLoginWithAbstract
Handles the full AGW login flow (social login, passkeys, or existing wallet).

```tsx
const { login, logout, isLoggedIn } = useLoginWithAbstract();
```

### useAbstractClient
Returns the AGW smart contract wallet client for programmatic interactions.

```tsx
const { data: client } = useAbstractClient();
```

### useWriteContractSponsored
Execute a contract write with gas sponsorship (paymaster).

```tsx
const { writeContractSponsored } = useWriteContractSponsored();

writeContractSponsored({
  address: "0x...",
  abi: contractAbi,
  functionName: "mint",
  args: [tokenId],
});
```

### useCreateSession
Create a session key for delegated, time-limited access.

```tsx
const { createSession } = useCreateSession();

createSession({
  session: {
    signer: signerAddress,
    expiresAt: BigInt(Math.floor(Date.now() / 1000) + 3600),
    feeLimit: { limit: parseEther("0.1"), limitType: 0, period: 0 },
    callPolicies: [{
      target: contractAddress,
      selector: "0x...",
      constraints: [],
      maxValuePerUse: parseEther("0"),
      valueLimit: { limit: parseEther("0"), limitType: 0, period: 0 },
    }],
    transferPolicies: [],
  },
});
```

### useRevokeSessions
Revoke active session keys.

```tsx
const { revokeSessions } = useRevokeSessions();
revokeSessions({ sessions: [sessionHash] });
```

## Session Keys

Session keys enable delegated, time-limited, scoped access without user confirmation per transaction. Essential for gaming, streaming, and automation use cases.

### SessionConfig structure

```typescript
interface SessionConfig {
  signer: Address;               // Delegated signer address
  expiresAt: bigint;            // Unix timestamp expiry
  feeLimit: SpendLimit;         // Gas budget
  callPolicies: CallPolicy[];   // Allowed contract calls
  transferPolicies: TransferPolicy[]; // Allowed token transfers
}
```

### Limit types

| Type | Value | Description |
|------|-------|-------------|
| Unlimited | 0 | No restriction |
| Lifetime | 1 | Total across session lifetime |
| Allowance | 2 | Resets per period |

### Mainnet requirement

Session keys on mainnet require security review and registration with the Session Key Policy Registry at `0xA146c7118A46b32aBD0e1ACA41DF4e61061b6b93`. Testnet has no such restriction.

## Sponsored Transactions

### General paymaster (sponsor all gas)

The paymaster pays gas on behalf of the user. No ETH needed in user's wallet.

### Approval-Based paymaster (pay gas with ERC-20)

Users pay gas with USDC or other ERC-20 tokens. The paymaster swaps the ERC-20 for ETH to cover gas.

### Provider: Zyfi

Zyfi provides paymaster-as-a-service for Abstract. Integrate via their API to sponsor or token-pay gas.

```typescript
import { getGeneralPaymasterInput, getPaymasterParams } from "zksync-ethers/build/paymaster-utils";

const paymasterParams = getPaymasterParams(paymasterAddress, {
  type: "General",
  innerInput: getGeneralPaymasterInput({ type: "General", innerInput: "0x" }),
});

const tx = await wallet.sendTransaction({
  to: "0x...",
  data: "0x...",
  customData: { paymasterParams },
});
```
