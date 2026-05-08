---
"@abstract-foundation/wallet-sdk": minor
---

Initial release of `@abstract-foundation/wallet-sdk`. Framework-agnostic core
for embedding the Abstract Global Wallet on third-party origins via iframe
(with popup fallback). Ships:

- `createWallet({ host, chainId, dialog })` returning an EIP-1193 provider
- `iframe()` / `popup()` dialog factories with hardened sandbox + allow attrs
- Origin-validated `postMessage` messenger with ready handshake and
  request-id correlation
- Iframe → popup fallback driven by HTTPS / IntersectionObserver-v2 /
  trusted-host eligibility checks, plus a runtime `__internal { switch }`
  channel the wallet host can use for cases the SDK can't predict
- IntersectionObserver-v2 feature detection used by the parent-side
  `secure()` eligibility check (the actual visibility wrapper lives in the
  wallet host application)

AGW does not use WebAuthn for wallet signing or account creation, and
Privy passkey enrollment only happens in the main portal app — so the SDK
deliberately does not pre-emptively force Safari users into popup mode.

Web Components (`/elements`) and React wrappers (`/react`) are planned for
follow-up releases.
