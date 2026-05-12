# @abstract-foundation/wallet-sdk

## 0.2.0

### Minor Changes

- [#30](https://github.com/Abstract-Foundation/abstract-packages/pull/30) [`63cd1e9`](https://github.com/Abstract-Foundation/abstract-packages/commit/63cd1e95583b3c396b4e86432629da98fad2b262) Thanks [@coffeexcoin](https://github.com/coffeexcoin)! - Initial release of `@abstract-foundation/wallet-sdk`. Framework-agnostic core
  for embedding the Abstract Global Wallet on third-party origins via iframe
  (with popup fallback). Ships:

  - `createWallet({ host, chainId, dialog })` returning an EIP-1193 provider
  - `iframe()` / `popup()` dialog factories with hardened sandbox + allow attrs
  - Origin-validated `postMessage` messenger with ready handshake and
    request-id correlation
  - Auth-aware iframe → popup routing: the SDK reads the wallet host's
    authenticated status and uses a top-level popup for OAuth login before
    replaying the original connect request in the iframe
  - Iframe → popup fallback driven by HTTPS / IntersectionObserver-v2 /
    trusted-host eligibility checks, plus runtime `__internal` channels the
    wallet host can use for cases the SDK can't predict
  - IntersectionObserver-v2 feature detection used by the parent-side
    `secure()` eligibility check (the actual visibility wrapper lives in the
    wallet host application)

  Web Components (`/elements`) and React wrappers (`/react`) are planned for
  follow-up releases.

### Patch Changes

- [#33](https://github.com/Abstract-Foundation/abstract-packages/pull/33) [`82b6ffb`](https://github.com/Abstract-Foundation/abstract-packages/commit/82b6ffb3abbbe50fc4b30e9a5596e1f5fc04a84d) Thanks [@coffeexcoin](https://github.com/coffeexcoin)! - Align the iframe dialog with the wallet host overlay model and close the dialog when wallet requests finish.

- [#32](https://github.com/Abstract-Foundation/abstract-packages/pull/32) [`a640fe2`](https://github.com/Abstract-Foundation/abstract-packages/commit/a640fe29a8f6012ad67d93e85a2352f0ee900d15) Thanks [@coffeexcoin](https://github.com/coffeexcoin)! - Align iframe dialog behavior with the wallet host by using a transparent parent backdrop, forwarding local dev protocol bypass configuration, and supporting host-driven dialog sizing.
