# @abstract-foundation/agw-thirdweb

## 0.1.0

### Minor Changes

- [#12](https://github.com/Abstract-Foundation/abstract-packages/pull/12) [`b6cf8e4`](https://github.com/Abstract-Foundation/abstract-packages/commit/b6cf8e4e50d09c39aeef9578824f436f8a48404d) Thanks [@coffeexcoin](https://github.com/coffeexcoin)! - Initial release of `@abstract-foundation/agw-thirdweb` — the Abstract Global Wallet adapter for the thirdweb Connect SDK. Previously shipped as the `@abstract-foundation/agw-react/thirdweb` subpath; the adapter now lives in a dedicated package so thirdweb's transitive dependency tree stays out of applications that don't use it.

  Migration:

  ```diff
  - import { abstractWallet } from "@abstract-foundation/agw-react/thirdweb";
  + import { abstractWallet } from "@abstract-foundation/agw-thirdweb";
  ```

  The `abstractWallet()` API is unchanged.
