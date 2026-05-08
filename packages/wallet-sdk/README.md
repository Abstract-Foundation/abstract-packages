# @abstract-foundation/wallet-sdk

Framework-agnostic SDK for embedding the Abstract Global Wallet on third-party
origins via iframe (with popup fallback).

Ports the security-relevant pieces of [Porto](https://github.com/ithacaxyz/porto)
to the Abstract stack: origin-validated `postMessage` transport, hardened
iframe sandboxing, IntersectionObserver-v2-aware visibility checks (the
clickjacking primitive lives in the wallet host), runtime-driven popup
fallback over the messenger, and an EIP-1193 provider that proxies through
to the wallet origin.

> Status: **early**. The dApp-side core is in place; Web Components
> (`/elements`) and React wrappers (`/react`) ship in follow-up releases.

## Install

```bash
pnpm add @abstract-foundation/wallet-sdk viem
```

## Usage

```ts
import { createWallet } from '@abstract-foundation/wallet-sdk';

const wallet = createWallet({
  host: 'https://wallet.abs.xyz',
  chainId: 2741,
  // optional
  dialog: 'auto',  // 'auto' | 'iframe' | 'popup'
});

// EIP-1193 — pass straight to wagmi/viem/ethers
const accounts = await wallet.provider.request({
  method: 'eth_requestAccounts',
});
```

## Mode selection

`'auto'` (default) starts in iframe mode and transparently falls back to a
popup when:

- Parent origin is HTTP (HTTPS is required for the iframe transport).
- IntersectionObserver v2 (`isVisible`) is unsupported AND the parent host
  is not on the wallet host's trusted-host allowlist.
- The wallet host explicitly requests a switch via the messenger
  (`__internal { type: 'switch', mode: 'popup' }`). The host uses this
  hook for cases the parent SDK can't predict — for example, WebAuthn
  credential creation on Safari (which Safari blocks in cross-origin
  iframes) if a flow ever required it.

### A note on WebAuthn / passkeys

AGW does not use WebAuthn for wallet signing or account creation. Privy
passkey enrollment happens in the main Abstract portal app under account
management — never inside the iframed wallet — so the SDK does not
pre-emptively force Safari users into popup mode for `wallet_connect` or
`eth_requestAccounts`.

Returning users with passkeys log in via `navigator.credentials.get()`,
which works in cross-origin iframes when the `publickey-credentials-get`
permission is granted (set automatically by `Dialog.iframe()`).

## Iframe hardening

When the iframe path is chosen, the iframe is mounted inside a top-layer
`<dialog>` with:

```
sandbox="allow-forms allow-scripts allow-same-origin
         allow-popups allow-popups-to-escape-sandbox"
allow="payment;
       publickey-credentials-get   <walletOrigin>;
       publickey-credentials-create <walletOrigin>;
       clipboard-write"
```

The dApp side also installs a `MutationObserver` that strips `inert`
attributes injected onto the dialog by browser extensions (a known issue
with 1Password and similar).

The actual visibility/clickjacking defence (the IO-v2 `isVisible` check
that disables `pointer-events` when the iframe is occluded) lives in the
**wallet host application**, not in this SDK — it's a property of being
delivered cross-origin in an iframe and would not be meaningful on the
parent side.

## Public API

```ts
// Top-level (consumed by most dApps)
import {
  createWallet,
  type Wallet,
  type WalletConfig,
  type Eip1193Provider,
} from '@abstract-foundation/wallet-sdk';

// Lower-level primitives (for embedders / framework wrappers)
import {
  Dialog,
  Messenger,
  UserAgent,
  IntersectionObserver,
} from '@abstract-foundation/wallet-sdk/core';
```

## License

MIT
