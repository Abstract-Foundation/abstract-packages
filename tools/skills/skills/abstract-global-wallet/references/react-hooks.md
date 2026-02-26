# AGW React Hooks Reference

All hooks require the app to be wrapped in `<AbstractWalletProvider>`.

## useLoginWithAbstract

Sign in/out users with AGW.

```tsx
import { useLoginWithAbstract } from "@abstract-foundation/agw-react";

const { login, logout } = useLoginWithAbstract();
```

| Return | Type | Description |
|--------|------|-------------|
| `login` | `() => void` | Opens AGW signup/login modal |
| `logout` | `() => void` | Disconnects wallet |

## useAbstractClient

Get an `AbstractClient` instance for sending transactions, deploying contracts, etc.

```tsx
import { useAbstractClient } from "@abstract-foundation/agw-react";

const { data: abstractClient, isLoading, error } = useAbstractClient();

// Send transaction
const hash = await abstractClient.sendTransaction({ to: "0x...", data: "0x..." });

// Deploy contract
const hash = await abstractClient.deployContract({ abi, bytecode, args: [] });

// Write to contract
const hash = await abstractClient.writeContract({ abi, address: "0x...", functionName: "mint", args: [] });
```

Returns `UseQueryResult<AbstractClient, Error>` (TanStack Query).

## useWriteContractSponsored

Call contract functions with gas paid by a paymaster.

```tsx
import { useWriteContractSponsored } from "@abstract-foundation/agw-react";
import { getGeneralPaymasterInput } from "viem/zksync";

const { writeContractSponsored, writeContractSponsoredAsync, data, error, isPending, isSuccess } =
  useWriteContractSponsored();

writeContractSponsored({
  abi: contractAbi,
  address: "0xContractAddress",
  functionName: "mint",
  args: ["0xRecipient", BigInt(1)],
  paymaster: "0xPaymasterAddress",
  paymasterInput: getGeneralPaymasterInput({ innerInput: "0x" }),
});
```

| Return | Type | Description |
|--------|------|-------------|
| `writeContractSponsored` | `function` | Sync — fire and forget |
| `writeContractSponsoredAsync` | `function` | Async — returns promise with tx hash |
| `data` | `Hex \| undefined` | Transaction hash |
| `isPending` | `boolean` | Transaction in flight |
| `isSuccess` | `boolean` | Transaction confirmed |
| `error` | `Error \| null` | Error if failed |
| `reset` | `() => void` | Reset mutation state |

## useCreateSession

Create a session key. See `references/session-keys.md` for full session config details.

```tsx
import { useCreateSession } from "@abstract-foundation/agw-react";

const { createSession, data, isPending } = useCreateSession();
```

## useRevokeSessions

Revoke active session keys. See `references/session-keys.md` for full session lifecycle details.

```tsx
import { useRevokeSessions } from "@abstract-foundation/agw-react";

const { revokeSessions } = useRevokeSessions();
```

## useGlobalWalletSignerAccount

Get the EOA signer behind the AGW smart contract wallet.

```tsx
import { useGlobalWalletSignerAccount } from "@abstract-foundation/agw-react";

const { data: signerAccount } = useGlobalWalletSignerAccount();
```

## useGlobalWalletSignerClient

Get a wallet client for the underlying signer.

```tsx
import { useGlobalWalletSignerClient } from "@abstract-foundation/agw-react";

const { data: signerClient } = useGlobalWalletSignerClient();
```

## References

- [AbstractWalletProvider](https://docs.abs.xyz/abstract-global-wallet/agw-react/AbstractWalletProvider)
- [useLoginWithAbstract](https://docs.abs.xyz/abstract-global-wallet/agw-react/hooks/useLoginWithAbstract)
- [useAbstractClient](https://docs.abs.xyz/abstract-global-wallet/agw-react/hooks/useAbstractClient)
- [useWriteContractSponsored](https://docs.abs.xyz/abstract-global-wallet/agw-react/hooks/useWriteContractSponsored)
