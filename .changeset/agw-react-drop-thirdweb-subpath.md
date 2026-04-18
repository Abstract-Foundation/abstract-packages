---
"@abstract-foundation/agw-react": minor
---

Removed the `@abstract-foundation/agw-react/thirdweb` subpath export. The thirdweb adapter now lives in its own package, `@abstract-foundation/agw-thirdweb`, so that thirdweb's transitive dependency tree is no longer dragged into `@abstract-foundation/agw-react` installs.

Consumers of the previous subpath should install `@abstract-foundation/agw-thirdweb` and update their import:

```diff
- import { abstractWallet } from "@abstract-foundation/agw-react/thirdweb";
+ import { abstractWallet } from "@abstract-foundation/agw-thirdweb";
```

`thirdweb` is no longer declared as a peer dependency of `@abstract-foundation/agw-react`.
