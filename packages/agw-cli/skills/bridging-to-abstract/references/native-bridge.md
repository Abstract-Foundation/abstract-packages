# Native Bridge Reference

## Contents
- Architecture
- Bridge Contracts
- Deposit Flow (L1→L2)
- Withdrawal Flow (L2→L1)
- Programmatic Access

## Architecture

Abstract uses the ZKsync ZK Stack shared bridge architecture. Core components:

- **BridgeHub** (L1): Routing entry point for deposits. Address: `0x303a465b659cBB0ab36eE643eA362c509EEb5213`
- **L1SharedBridge** (L1): Holds locked assets. Address: `0xd7f9f54194C633F36CCD5F3da84ad4a1c38cB2cB`
- **L2SharedBridge** (L2): Mints/burns on L2. Address: `0x954ba822043cD51C5F1568e8F4e1cC02EF3af30F`
- **Diamond Proxy** (L1): State transitions and proof verification.

### Default bridge addresses via RPC

```bash
curl -X POST https://api.mainnet.abs.xyz \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","method":"zks_getBridgeContracts","params":[],"id":1}'
```

Response:
```json
{
  "l1Erc20DefaultBridge": "0x927ddfcc55164a59e0f33918d13a2a210aa4ee65",
  "l2Erc20DefaultBridge": "0x0000000000000000000000000000000000008006",
  "l1WethBridge": "0x0000000000000000000000000000000000000000",
  "l2WethBridge": "0x0000000000000000000000000000000000000000"
}
```

## Deposit Flow (L1→L2)

1. User calls `deposit` on the L1 bridge contract (or BridgeHub for routed deposits).
2. Tokens are locked on L1.
3. The sequencer processes the L1 deposit message.
4. Equivalent tokens are minted on L2 to the recipient.
5. Timing: ~15 minutes (depends on L1 confirmation + sequencer processing).

Programmatic deposits use the `zksync-ethers` SDK:

```typescript
import { Provider, Wallet } from "zksync-ethers";

const provider = new Provider("https://api.mainnet.abs.xyz");
const wallet = new Wallet(privateKey, provider);

const deposit = await wallet.deposit({
  token: "0x0000000000000000000000000000000000000000", // ETH
  amount: ethers.parseEther("0.1"),
});
await deposit.wait();
```

For ERC-20 deposits, the SDK handles the L1 approval automatically.

## Withdrawal Flow (L2→L1)

Two-step process:

**Step 1 — Initiate withdrawal on L2:**

```typescript
const withdraw = await wallet.withdraw({
  token: "0x0000000000000000000000000000000000000000",
  amount: ethers.parseEther("0.1"),
});
await withdraw.wait();
```

**Step 2 — Finalize on L1 (after batch execution, up to 24 hours):**

```typescript
const isFinalized = await wallet.isWithdrawalFinalized(withdraw.hash);
if (isFinalized) {
  const finalize = await wallet.finalizeWithdrawal(withdraw.hash);
  await finalize.wait();
}
```

Always check `isWithdrawalFinalized` before calling `finalizeWithdrawal`. Premature finalization calls will revert.

## Timing

| Direction | Time | Notes |
|-----------|------|-------|
| L1→L2 deposit | ~15 minutes | After L1 confirmation |
| L2→L1 withdrawal | Up to 24 hours | Withdrawal delay for security |

## Portal UI

- Mainnet: `https://portal.mainnet.abs.xyz/bridge/`
- Testnet: `https://portal.testnet.abs.xyz/bridge/`

For users who prefer a UI over programmatic bridging, direct them to the Portal.
