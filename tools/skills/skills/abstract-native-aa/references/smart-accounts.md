# Smart Contract Wallets on Abstract

All accounts on Abstract implement `IAccount`. The bootloader calls these functions on `tx.from` for every transaction. EOAs are wrapped in `DefaultAccount` automatically.

Build a custom smart contract wallet when you need custom signature validation, recovery mechanisms, spending limits, or multi-sig logic.

## IAccount Interface

```solidity
import {IAccount} from "@matterlabs/zksync-contracts/l2/system-contracts/interfaces/IAccount.sol";

contract SmartAccount is IAccount {
    function validateTransaction(bytes32, bytes32, Transaction calldata) external payable returns (bytes4 magic);
    function executeTransaction(bytes32, bytes32, Transaction calldata) external payable;
    function executeTransactionFromOutside(Transaction calldata) external payable;
    function payForTransaction(bytes32, bytes32, Transaction calldata) external payable;
    function prepareForPaymaster(bytes32, bytes32, Transaction calldata) external payable;
}
```

### validateTransaction

Determine whether to execute. Must:

1. Increment nonce via `NonceHolder.incrementMinNonceIfEquals`
2. Return `ACCOUNT_VALIDATION_SUCCESS_MAGIC` if valid
3. Only callable by bootloader (`onlyBootloader` modifier)

```solidity
import {SystemContractsCaller} from "@matterlabs/zksync-contracts/l2/system-contracts/libraries/SystemContractsCaller.sol";
import {NONCE_HOLDER_SYSTEM_CONTRACT, INonceHolder} from "@matterlabs/zksync-contracts/l2/system-contracts/Constants.sol";

function validateTransaction(
    bytes32, bytes32, Transaction calldata _transaction
) external payable onlyBootloader returns (bytes4 magic) {
    SystemContractsCaller.systemCallWithPropagatedRevert(
        uint32(gasleft()),
        address(NONCE_HOLDER_SYSTEM_CONTRACT),
        0,
        abi.encodeCall(INonceHolder.incrementMinNonceIfEquals, (_transaction.nonce))
    );
    // ... validation logic (signature check, etc.)
}
```

> `isSystem` flag must be `true` in your compiler config to call system contracts.

### executeTransaction

Called if validation passed. Use `EfficientCall` library for zkEVM-optimized execution. Only callable by bootloader.

### executeTransactionFromOutside

For initiating transactions via external calls (e.g., L1 → L2 communication).

### payForTransaction

Pay bootloader for gas. Use `_transaction.payToTheBootloader()` convenience function.

### prepareForPaymaster

Alternative to `payForTransaction` when a paymaster is set. Use `_transaction.processPaymasterInput()`.

## Deploying Smart Contract Wallets

Use `ContractDeployer` system contract via `createAccount` or `create2Account`:

```typescript
import { ContractFactory } from "zksync-ethers";

const factory = new ContractFactory(abi, bytecode, wallet, "createAccount");
const account = await factory.deploy();
```

## Sending Transactions from a Smart Contract Wallet

Use EIP-712 formatted transactions:

```typescript
import { VoidSigner } from "ethers";
import { Provider, utils } from "zksync-ethers";
import { serializeEip712 } from "zksync-ethers/build/utils";

const txFields = await signer.populateTransaction({ to: "0x..." });
const serialized = serializeEip712({
  ...txFields,
  nonce: 0,
  from: "0xSmartWalletAddress",
  customData: { customSignature: "0x..." },
});

const tx = await provider.broadcastTransaction(serialized);
```

## Signature Validation (EIP-1271)

Smart contract wallets should implement EIP-1271 for message signature verification:

```solidity
function isValidSignature(bytes32 _hash, bytes memory _signature) public view returns (bytes4 magicValue);
// Return 0x1626ba7e on success
```

Use OpenZeppelin's `SignatureChecker`:

```solidity
import { SignatureChecker } from "@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol";
```

## Nonce Handling

Abstract uses **two nonces per account**:

- **Transaction nonce:** incremented per transaction
- **Deployment nonce:** incremented per contract deployment

Both managed by `NonceHolder` system contract. Key differences from Ethereum:
- Deploying doesn't increment transaction nonce
- New contracts start with deployment nonce `0` (Ethereum starts at `1`)
- Deployment nonce only increments on success

## References

- [Smart Contract Wallets](https://docs.abs.xyz/how-abstract-works/native-account-abstraction/smart-contract-wallets)
- [Signature Validation](https://docs.abs.xyz/how-abstract-works/native-account-abstraction/signature-validation)
- [Handling Nonces](https://docs.abs.xyz/how-abstract-works/native-account-abstraction/handling-nonces)
- [IAccount source](https://github.com/matter-labs/era-contracts/blob/main/system-contracts/contracts/interfaces/IAccount.sol)
- [DefaultAccount source](https://github.com/matter-labs/era-contracts/blob/main/system-contracts/contracts/DefaultAccount.sol)
