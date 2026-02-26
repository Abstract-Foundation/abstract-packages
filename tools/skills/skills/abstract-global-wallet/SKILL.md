---
name: abstract-global-wallet
description: Integrate Abstract Global Wallet (AGW) into React applications — email/social/passkey login, smart contract wallet, session keys, gas sponsorship, and wallet provider integrations for the Abstract Ethereum L2. Use this skill when working with AGW, AbstractWalletProvider, useLoginWithAbstract, useAbstractClient, useWriteContractSponsored, agw-react, agw-client, create-abstract-app, session keys on Abstract, or gas-sponsored transactions on Abstract.
---

# Abstract Global Wallet

AGW is Abstract's cross-application smart contract wallet. Users sign up once (email, social, passkey) and use it across all Abstract apps. **Recommended over standard wallet connections for new Abstract apps** — see the decision table below for when to consider alternatives.

For AI agent wallet access (not end-user facing), see the `using-agw-mcp` skill instead.

## Quick Start (New Project)

```bash
npx @abstract-foundation/create-abstract-app@latest my-app
```

This scaffolds a React app with AGW pre-configured.

## Quick Start (Existing React Project)

### 1. Install

```bash
npm install @abstract-foundation/agw-react @abstract-foundation/agw-client wagmi viem@2.x @tanstack/react-query
```

> **viem must be 2.x.** Using viem 1.x causes compatibility errors.

### 2. Wrap with provider

```tsx
import { AbstractWalletProvider } from "@abstract-foundation/agw-react";
import { abstractTestnet } from "viem/chains"; // or abstract for mainnet

export default function App() {
  return (
    <AbstractWalletProvider chain={abstractTestnet}>
      {/* Your app */}
    </AbstractWalletProvider>
  );
}
```

### 3. Add login

```tsx
import { useLoginWithAbstract } from "@abstract-foundation/agw-react";

export default function LoginButton() {
  const { login, logout } = useLoginWithAbstract();
  return <button onClick={login}>Login with Abstract</button>;
}
```

### 4. Send transactions

```tsx
import { useAbstractClient } from "@abstract-foundation/agw-react";

export default function SendTx() {
  const { data: abstractClient } = useAbstractClient();

  async function send() {
    if (!abstractClient) return;
    const hash = await abstractClient.sendTransaction({
      to: "0x...",
      data: "0x...",
    });
  }

  return <button onClick={send}>Send</button>;
}
```

### 5. Sponsored transactions (gas-free for users)

```tsx
import { useWriteContractSponsored } from "@abstract-foundation/agw-react";
import { getGeneralPaymasterInput } from "viem/zksync";

export default function SponsoredMint() {
  const { writeContractSponsored, isPending } = useWriteContractSponsored();

  return (
    <button
      disabled={isPending}
      onClick={() =>
        writeContractSponsored({
          abi: contractAbi,
          address: "0xContractAddress",
          functionName: "mint",
          args: ["0xRecipient", BigInt(1)],
          paymaster: "0xPaymasterAddress",
          paymasterInput: getGeneralPaymasterInput({ innerInput: "0x" }),
        })
      }
    >
      Mint (Gas Free)
    </button>
  );
}
```

## Decision Tables

### AGW vs Standard Wallets

| Use Case | AGW | Standard (MetaMask/EOA) |
|----------|-----|------------------------|
| New Abstract app | **Yes** | No |
| Cross-app wallet identity | **Yes** | No |
| Email/social login | **Yes** | No |
| Session keys (gasless UX) | **Yes** | No |
| Gas sponsorship | **Yes** | Paymaster only |
| Existing wallet user base | Consider both | **Yes** |

### Session Keys vs Direct Transactions

| Use Case | Session Keys | Direct Approval |
|----------|--------------|-----------------|
| Games / frequent actions | **Yes** | No |
| One-time transactions | No | **Yes** |
| No-popup UX | **Yes** | No |
| High-value transactions | No | **Yes** |
| Testnet | **Yes** | **Yes** |
| Mainnet | Requires security review | **Yes** |

## Feature Reference

| Feature | Where to look |
|---------|--------------|
| React hooks API | `references/react-hooks.md` |
| Session keys (create, use, revoke) | `references/session-keys.md` |
| Third-party wallet providers | `references/wallet-providers.md` |

## Packages

| Package | Purpose |
|---------|---------|
| `@abstract-foundation/agw-react` | React hooks + `AbstractWalletProvider`. Built on Wagmi. |
| `@abstract-foundation/agw-client` | Wallet actions + session key utilities. Built on Viem. |

## Gotchas

- **viem 2.x required** — AGW is incompatible with viem 1.x
- **Chain must be `abstract` or `abstractTestnet`** — `AbstractWalletProvider` throws on unsupported chains
- **Session keys on mainnet need security review** — testnet is permissionless, mainnet requires registry approval
- **Session key signers are sensitive** — never store private keys in `localStorage`; use encrypted browser storage or server-side KMS
- **`approve`/`setApprovalForAll` in session policies** must include constraints restricting to a specific contract address, or the registry will reject
