# Paymasters on Abstract

Paymasters are smart contracts that pay gas fees on behalf of other accounts. Two common patterns:

- **General flow:** Paymaster sponsors all transactions (e.g., free gas for your app's users)
- **Approval-based flow:** Users pay gas in ERC-20 tokens instead of ETH

## IPaymaster Interface

```solidity
import {IPaymaster} from "@matterlabs/zksync-contracts/l2/system-contracts/interfaces/IPaymaster.sol";

contract MyPaymaster is IPaymaster {
    function validateAndPayForPaymasterTransaction(
        bytes32 _txHash,
        bytes32 _suggestedSignedHash,
        Transaction calldata _transaction
    ) external payable returns (bytes4 magic, bytes memory context);

    function postTransaction(
        bytes calldata _context,
        Transaction calldata _transaction,
        bytes32 _txHash,
        bytes32 _suggestedSignedHash,
        ExecutionResult _txResult,
        uint256 _maxRefundedGas
    ) external payable;
}
```

### validateAndPayForPaymasterTransaction

Called to decide whether to sponsor and pay. Must:

1. Send at least `tx.gasprice * tx.gasLimit` to the bootloader
2. Return `PAYMASTER_VALIDATION_SUCCESS_MAGIC` to approve

| Parameter | Type | Description |
|-----------|------|-------------|
| `_txHash` | `bytes32` | Transaction hash |
| `_suggestedSignedHash` | `bytes32` | Suggested signed hash |
| `_transaction` | `Transaction` | Full transaction data |

Returns `(bytes4 magic, bytes memory context)` — context is passed to `postTransaction`.

### postTransaction

Optional cleanup after execution. **Not guaranteed to run** if the transaction fails with out-of-gas.

## Sending Transactions with a Paymaster

### Using zksync-ethers

```typescript
import { Provider, Wallet } from "zksync-ethers";
import { getGeneralPaymasterInput, getPaymasterParams } from "zksync-ethers/build/paymaster-utils";

const paymasterParams = getPaymasterParams("0xPaymasterAddress", {
  type: "General",
  innerInput: getGeneralPaymasterInput({ type: "General", innerInput: "0x" }),
});

const tx = await wallet.sendTransaction({
  to: "0xRecipient",
  data: "0x...",
  customData: { paymasterParams },
});
```

### Using AGW React (simplest)

```tsx
import { useWriteContractSponsored } from "@abstract-foundation/agw-react";
import { getGeneralPaymasterInput } from "viem/zksync";

const { writeContractSponsored } = useWriteContractSponsored();

writeContractSponsored({
  abi: contractAbi,
  address: "0xContract",
  functionName: "mint",
  args: [],
  paymaster: "0xPaymasterAddress",
  paymasterInput: getGeneralPaymasterInput({ innerInput: "0x" }),
});
```

### Testnet Paymaster

Abstract testnet has a built-in paymaster. Retrieve its address:

```typescript
const paymasterAddress = await provider.send("zks_getTestnetPaymaster", []);
```

## Ecosystem Paymaster Providers

For production, consider managed paymaster services: [Paymasters Ecosystem](https://docs.abs.xyz/ecosystem/paymasters).

## References

- [Paymasters](https://docs.abs.xyz/how-abstract-works/native-account-abstraction/paymasters)
- [IPaymaster source](https://github.com/matter-labs/era-contracts/blob/main/system-contracts/contracts/interfaces/IPaymaster.sol)
- [TransactionHelper](https://github.com/matter-labs/era-contracts/blob/main/system-contracts/contracts/libraries/TransactionHelper.sol)
