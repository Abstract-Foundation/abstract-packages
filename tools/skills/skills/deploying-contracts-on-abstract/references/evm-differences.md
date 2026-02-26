# EVM Differences on Abstract

Abstract uses the ZK Stack VM (ZKsync Era), which is EVM-compatible but not EVM-equivalent. Key differences that affect contract development:

## Compilation

- Contracts compile to ZK-friendly bytecode via `zksolc`, not standard `solc`
- Standard EVM bytecode will **not** execute on Abstract
- Foundry: `forge build --zksync` → outputs to `zkout/`
- Hardhat: `npx hardhat compile` with `@matterlabs/hardhat-zksync` → outputs to `artifacts-zk/`

## Opcode Differences

| Opcode | Ethereum | Abstract |
|--------|----------|----------|
| `CODECOPY` / `EXTCODECOPY` | Returns actual bytecode | Not available for ZK bytecode |
| `SELFDESTRUCT` | Destroys contract | **Deprecated**, behaves as no-op |
| `CREATE` / `CREATE2` | Deploys from init code | Uses system contract `ContractDeployer`; factory deps must be declared |
| `CALLCODE` | Delegatecall variant | **Not supported** |
| `EXTCODEHASH` | Hash of code | Returns hash of ZK bytecode (different from EVM hash) |

## Gas Model

- Gas is **not** 1:1 with Ethereum — the ZK proving cost is factored in
- Storage writes are more expensive relative to computation
- `gasleft()` returns an approximation
- Use `zks_estimateFee` RPC for accurate estimates
- L1 data availability cost is included in transaction fees

## Nonces

Abstract uses **two separate nonces** per account:
- **Transaction nonce:** Incremented with each transaction (like Ethereum)
- **Deployment nonce:** Incremented with each contract deployment via `CREATE`/`CREATE2`

Both are managed by the `NonceHolder` system contract. This means:
- Deploying a contract does NOT increment the transaction nonce
- Transaction ordering still uses the transaction nonce

## Contract Deployment

- All contract deployments go through the `ContractDeployer` system contract
- Factory dependencies (bytecode of contracts deployed by your contract) must be explicitly provided in the transaction
- `CREATE2` address derivation uses a different formula than Ethereum (includes bytecode hash)

## Precompiles

Most Ethereum precompiles (ecrecover, sha256, etc.) are available but implemented as system contracts:
- `ecrecover` (0x01) — available
- `sha256` (0x02) — available
- `keccak256` — native opcode, available
- `ecAdd`, `ecMul`, `ecPairing` (0x06-0x08) — available via system contracts

## Libraries

- Solidity libraries that use `DELEGATECALL` work normally
- Libraries linked at compile time work normally
- Library deployment follows the same `ContractDeployer` pattern

## Best Practices

1. Always compile with `zksolc` — never deploy standard EVM bytecode
2. Avoid `SELFDESTRUCT` and `CALLCODE`
3. Declare all factory dependencies when deploying factory contracts
4. Use `zks_estimateFee` instead of `eth_estimateGas` for accurate gas estimates
5. Test on Abstract testnet (not just local EVM) to catch ZK-specific issues

## References

- [EVM Differences](https://docs.abs.xyz/how-abstract-works/evm-differences/overview)
- [EVM Opcodes](https://docs.abs.xyz/how-abstract-works/evm-differences/evm-opcodes)
- [Gas Fees](https://docs.abs.xyz/how-abstract-works/evm-differences/gas-fees)
- [Nonces](https://docs.abs.xyz/how-abstract-works/evm-differences/nonces)
- [Precompiles](https://docs.abs.xyz/how-abstract-works/evm-differences/precompiles)
