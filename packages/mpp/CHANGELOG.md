# @abstract-foundation/mpp

## 0.1.5

### Patch Changes

- 0b4e965: Normalize release metadata and add CI-aligned packaging checks across the public packages.

## 0.1.4

### Patch Changes

- 2e8559e: Remove AI-generated separator comments and add JSDoc to all undocumented exports

## 0.1.3

### Patch Changes

- cce56d5: Add npm README and MIT license
- 4f4a2fd: Add onChannelOpened callback to abstractSession client options, called after the on-chain channel open but before voucher signing — supports deferring the voucher via a returned Promise

## 0.1.2

### Patch Changes

- 0c3ac45: Add smart-wallet compatibility for Abstract payments.

  - Support ERC-3009 `bytes` signatures for charge flows, including ERC-1271 wallets.
  - Verify session vouchers with contract-wallet-compatible typed-data checks.
  - Update the Abstract testnet and mainnet `AbstractStreamChannel` defaults to `0x29635C384f451a72ED2e2a312BCeb8b0bDC0923c`.

- e825a63: fix: clean up viem usage

## 0.1.1

### Patch Changes

- a2be4d7: Add Changesets-based release automation and npm publish metadata.
