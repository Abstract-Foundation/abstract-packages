# Paymaster Guide

## Contents
- Overview
- IPaymaster Interface
- General Flow
- Approval-Based Flow
- Sending Paymaster Transactions
- Resources

## Overview

Paymasters are smart contracts that pay gas fees on behalf of other accounts. They integrate with Abstract's native account abstraction after smart contract wallet validation.

Two standard flows:
1. **General**: Paymaster sponsors all gas (e.g., onboarding, free-to-play games)
2. **Approval-Based**: Users pay gas with ERC-20 tokens (e.g., USDC for gas)

## IPaymaster Interface

Install system contracts:
- Hardhat: `npm install @matterlabs/zksync-contracts`
- Foundry: `forge install matter-labs/era-contracts`

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
Must send at least `tx.gasprice * tx.gasLimit` to the bootloader. Return `PAYMASTER_VALIDATION_SUCCESS_MAGIC` to approve.

### postTransaction
Called after execution. No guarantee of execution if tx fails with out-of-gas. Use for refunds or accounting.

## General Flow

Minimal implementation that sponsors all transactions:

```solidity
function validateAndPayForPaymasterTransaction(
    bytes32, bytes32, Transaction calldata _transaction
) external payable returns (bytes4 magic, bytes memory context) {
    magic = PAYMASTER_VALIDATION_SUCCESS_MAGIC;
    uint256 requiredETH = _transaction.gasLimit * _transaction.maxFeePerGas;
    (bool success, ) = payable(BOOTLOADER_FORMAL_ADDRESS).call{value: requiredETH}("");
    require(success, "Bootloader payment failed");
}
```

Reference implementation: [GeneralPaymaster.sol](https://github.com/matter-labs/zksync-contract-templates/blob/main/templates/hardhat/solidity/contracts/paymasters/GeneralPaymaster.sol)

## Approval-Based Flow

Users approve the paymaster to spend their ERC-20. The paymaster collects ERC-20, converts to ETH, and pays the bootloader.

Reference implementation: [ApprovalPaymaster.sol](https://github.com/matter-labs/zksync-contract-templates/blob/main/templates/hardhat/solidity/contracts/paymasters/ApprovalPaymaster.sol)

## Sending Paymaster Transactions

Submit transactions with `customData.paymasterParams`:

```typescript
import { getGeneralPaymasterInput, getPaymasterParams } from "zksync-ethers/build/paymaster-utils";

const paymasterParams = getPaymasterParams(PAYMASTER_ADDRESS, {
  type: "General",
  innerInput: getGeneralPaymasterInput({
    type: "General",
    innerInput: "0x",
  }),
});

const tx = await wallet.sendTransaction({
  to: "0x...",
  data: "0x...",
  customData: { paymasterParams },
});
```

For Approval-Based:

```typescript
const paymasterParams = getPaymasterParams(PAYMASTER_ADDRESS, {
  type: "ApprovalBased",
  token: USDC_ADDRESS,
  minimalAllowance: requiredAmount,
  innerInput: "0x",
});
```

## Resources

- Paymaster examples: `https://github.com/Abstract-Foundation/examples/tree/main/paymasters`
- IPaymaster source: `https://github.com/matter-labs/era-contracts/blob/main/system-contracts/contracts/interfaces/IPaymaster.sol`
- Video tutorial: `https://www.youtube.com/watch?v=oolgV2M8ZUI`
- Zyfi paymaster-as-a-service: `https://zyfi.org`
