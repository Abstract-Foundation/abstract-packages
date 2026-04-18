---
"@abstract-foundation/agw-thirdweb": minor
---

Initial release of `@abstract-foundation/agw-thirdweb` — the Abstract Global Wallet adapter for the thirdweb Connect SDK. Previously shipped as the `@abstract-foundation/agw-react/thirdweb` subpath; the adapter now lives in a dedicated package so thirdweb's transitive dependency tree stays out of applications that don't use it.

Migration:

```diff
- import { abstractWallet } from "@abstract-foundation/agw-react/thirdweb";
+ import { abstractWallet } from "@abstract-foundation/agw-thirdweb";
```

The `abstractWallet()` API is unchanged.
