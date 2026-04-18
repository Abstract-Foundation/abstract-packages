# @abstract-foundation/agw-thirdweb

Abstract Global Wallet (AGW) adapter for the [thirdweb Connect SDK](https://portal.thirdweb.com/connect).

## Abstract Global Wallet (AGW)

[Abstract Global Wallet (AGW)](https://docs.abs.xyz/overview) is a cross-application [smart contract wallet](https://docs.abs.xyz/how-abstract-works/native-account-abstraction/smart-contract-wallets) that users can use to interact with any application built on Abstract, powered by Abstract's [native account abstraction](https://docs.abs.xyz/how-abstract-works/native-account-abstraction).

## Installation

```bash
npm install @abstract-foundation/agw-thirdweb thirdweb
```

`thirdweb` and `viem` are peer dependencies — install whichever versions are compatible with your app.

## Quick Start

```tsx
import { createThirdwebClient } from "thirdweb";
import { ConnectButton } from "thirdweb/react";
import { abstractWallet } from "@abstract-foundation/agw-thirdweb";

const client = createThirdwebClient({ clientId: "YOUR_CLIENT_ID" });

export function Connect() {
  return <ConnectButton client={client} wallets={[abstractWallet()]} />;
}
```

`abstractWallet()` returns a thirdweb `Wallet` that can be passed to any surface that accepts a `Wallet` — `ConnectButton`, `ConnectEmbed`, `useConnect`, etc.

## API

### `abstractWallet(options?)`

Creates a thirdweb `Wallet` backed by Abstract Global Wallet.

```ts
function abstractWallet(options?: AbstractWalletOptions): Wallet;
```

#### Options

| Option | Type | Description |
| --- | --- | --- |
| `customPaymasterHandler` | `CustomPaymasterHandler` | Optional handler that returns paymaster + paymaster input for sponsoring user transactions. See [`@abstract-foundation/agw-client`](https://github.com/Abstract-Foundation/abstract-packages/tree/main/packages/agw-client) for the handler signature. |

### Example: sponsoring gas

```tsx
import type { CustomPaymasterHandler } from "@abstract-foundation/agw-client";
import { abstractWallet } from "@abstract-foundation/agw-thirdweb";

const sponsorGas: CustomPaymasterHandler = async () => ({
  paymaster: "0xYourPaymasterAddress",
  paymasterInput: "0x",
});

const wallet = abstractWallet({ customPaymasterHandler: sponsorGas });
```

## Relationship to `@abstract-foundation/agw-react`

Prior to `@abstract-foundation/agw-react@1.13`, this adapter shipped as the `@abstract-foundation/agw-react/thirdweb` subpath. It now lives in a dedicated package to keep thirdweb's transitive dependency tree out of applications that don't use it.

Migration:

```diff
- import { abstractWallet } from "@abstract-foundation/agw-react/thirdweb";
+ import { abstractWallet } from "@abstract-foundation/agw-thirdweb";
```

No other changes are required — the `abstractWallet()` API is identical.

## Documentation

For full AGW documentation, see the [Abstract Global Wallet documentation](https://docs.abs.xyz/how-abstract-works/abstract-global-wallet/overview).
