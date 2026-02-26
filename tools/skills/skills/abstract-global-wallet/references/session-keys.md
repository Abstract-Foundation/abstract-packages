# Session Keys on Abstract

Session keys let approved signers execute pre-defined actions on behalf of an AGW without per-transaction user confirmation. Ideal for games, mobile apps, and any flow where constant popups degrade UX.

## Restrictions

- **Testnet:** permissionless
- **Mainnet:** requires security review and registry approval. See [Going to Production](https://docs.abs.xyz/abstract-global-wallet/session-keys/going-to-production).

## Workflow

1. **Create** session with scope (which contracts, which functions, spending limits)
2. **Store** session config + signer key securely (not localStorage — use encrypted storage or KMS)
3. **Use** a `SessionClient` to execute actions within the defined scope
4. **Revoke** when done (or let expire)

## Creating a Session

```tsx
import { useAbstractClient } from "@abstract-foundation/agw-react";
import { LimitType } from "@abstract-foundation/agw-client/sessions";
import { toFunctionSelector, parseEther } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

const sessionPrivateKey = generatePrivateKey();
const sessionSigner = privateKeyToAccount(sessionPrivateKey);

const { data: agwClient } = useAbstractClient();

const { session } = await agwClient.createSession({
  session: {
    signer: sessionSigner.address,
    expiresAt: BigInt(Math.floor(Date.now() / 1000) + 60 * 60 * 24), // 24h
    feeLimit: {
      limitType: LimitType.Lifetime,
      limit: parseEther("1"),
      period: BigInt(0),
    },
    callPolicies: [
      {
        target: "0xContractAddress",
        selector: toFunctionSelector("mint(address,uint256)"),
        valueLimit: {
          limitType: LimitType.Unlimited,
          limit: BigInt(0),
          period: BigInt(0),
        },
        maxValuePerUse: BigInt(0),
        constraints: [],
      },
    ],
    transferPolicies: [],
  },
});
```

## Session Config Types

### LimitType

| Value | Name | Behavior |
|-------|------|----------|
| `0` | `Unlimited` | No limit |
| `1` | `Lifetime` | Total cap over session lifetime |
| `2` | `Allowance` | Cap per time period (set `period` in seconds) |

### CallPolicy

| Field | Type | Description |
|-------|------|-------------|
| `target` | `Address` | Contract to call |
| `selector` | `Hash` | Function selector (use `toFunctionSelector`) |
| `valueLimit` | `Limit` | Native token value limit |
| `maxValuePerUse` | `bigint` | Max value per single call |
| `constraints` | `Constraint[]` | Parameter-level constraints |

### Constraint

| Field | Type | Description |
|-------|------|-------------|
| `index` | `bigint` | Parameter index |
| `condition` | `ConstraintCondition` | `Equal(1)`, `Greater(2)`, `Less(3)`, `GreaterEqual(4)`, `LessEqual(5)`, `NotEqual(6)` |
| `refValue` | `Hash` | ABI-encoded reference value |
| `limit` | `Limit` | Limit for this parameter |

### TransferPolicy

| Field | Type | Description |
|-------|------|-------------|
| `target` | `Address` | Recipient address |
| `maxValuePerUse` | `bigint` | Max per transfer |
| `valueLimit` | `Limit` | Total transfer limit |

## Using a Session Client

```tsx
const sessionClient = agwClient.toSessionClient(sessionSigner, session);

const hash = await sessionClient.writeContract({
  abi: parseAbi(["function mint(address,uint256) external"]),
  account: sessionClient.account,
  chain: abstractTestnet,
  address: "0xContractAddress",
  functionName: "mint",
  args: [userAddress, BigInt(1)],
});
```

Or create a standalone `SessionClient` without an existing `AbstractClient`:

```tsx
import { createSessionClient } from "@abstract-foundation/agw-client";
```

## Revoking Sessions

```tsx
await agwClient.revokeSessions({ sessions: [sessionHash] });
```

Or via hook:

```tsx
import { useRevokeSessions } from "@abstract-foundation/agw-react";
const { revokeSessions } = useRevokeSessions();
```

## Production Requirements

1. Session key policies with `approve` or `setApprovalForAll` **must** include constraints restricting to a specific contract address
2. Create unique signer per session — never reuse across users
3. Store signer keys encrypted (browser encrypted storage, AWS KMS, etc.)
4. Apply for registry whitelisting before mainnet deployment

## References

- [Session Keys Overview](https://docs.abs.xyz/abstract-global-wallet/session-keys/overview)
- [createSession](https://docs.abs.xyz/abstract-global-wallet/agw-client/session-keys/createSession)
- [toSessionClient](https://docs.abs.xyz/abstract-global-wallet/agw-client/session-keys/toSessionClient)
- [Going to Production](https://docs.abs.xyz/abstract-global-wallet/session-keys/going-to-production)
