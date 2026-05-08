# wallet-sdk-nextjs

Minimal Next.js demo of [`@abstract-foundation/wallet-sdk`](../../packages/wallet-sdk).

The SDK opens an iframe pointing at the Abstract wallet-host (the
`apps/web/wallet-host` app in the [mono-ts](https://github.com/Abstract-Foundation/mono-ts) repo) and proxies EIP-1193
requests to it. This demo walks through the canonical flow:

1. **Connect** → `wallet_connect` opens the iframe; user authenticates
   inside the wallet origin; SDK returns the AGW smart-account address.
2. **Sign Message** → `personal_sign` opens the iframe with the
   `@abstract/wallet-ui` signature-review surface; user approves; SDK
   returns the signature.
3. **Send Transaction** → `eth_sendTransaction` opens the iframe with the
   transaction-review surface; user approves; SDK returns the tx hash.
   AGW sponsors gas via paymaster.

Every action's request + result is appended to a log panel so the iframe
round-trip is visible.

## Run

```bash
# 1. Bring up the wallet-host (in the mono-ts repo, separate terminal):
turbo dev --filter=wallet-host

# 2. Bring up this demo (defaults to http://localhost:3004):
pnpm dev
```

Override the wallet-host URL via `NEXT_PUBLIC_WALLET_HOST_URL`:

```bash
NEXT_PUBLIC_WALLET_HOST_URL=https://wallet.abs.xyz pnpm dev
```

## What this demo does *not* do

- No Wagmi / agw-react. The SDK gives you a plain EIP-1193 provider; pass
  it to viem/wagmi/ethers/whatever the host app already uses.
- No connector switching, no chain switching UI. Single chain (Abstract),
  hardcoded `chainId = 2741`. Add as needed.
- No styling beyond a small inline stylesheet. The SDK is presentational
  inside the iframe; the host app owns its own visual surface.
