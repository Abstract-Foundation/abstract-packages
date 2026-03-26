# EVM Differences on Abstract

## Contents
- Overview
- Contract Deployment
- Unsupported and Changed Opcodes
- Gas Model
- Address Derivation
- System Contracts
- Key Gotchas

## Overview

Abstract runs the ZKsync VM, which is optimized for ZK proof generation. Bytecode differs from standard EVM because the VM is optimized for ZK circuits. Most Solidity code compiles and runs without changes, but deployment mechanics, gas accounting, and some opcodes differ.

## Contract Deployment

All contract deployments route through the `ContractDeployer` system contract (not direct `CREATE`/`CREATE2` opcodes). The compiler auto-transforms deployment code.

Key differences:
- Bytecode is stored as hashes on L2; actual bytecode is published to L1.
- Deployment transactions must include `factoryDeps` field (EIP-712 format) containing the bytecode of all contracts being deployed.
- Four deployment types: `create`, `create2`, `createAccount`, `create2Account`.

### Foundry deployment

```bash
forge create --zksync \
  --rpc-url https://api.mainnet.abs.xyz \
  --private-key $PRIVATE_KEY \
  src/MyContract.sol:MyContract
```

### Hardhat deployment

```typescript
import { deployContract } from "@matterlabs/hardhat-zksync";

const contract = await deployContract("MyContract", [constructorArgs]);
```

## Unsupported and Changed Opcodes

**Unsupported (will revert):**
- `SELFDESTRUCT` — removed per Ethereum deprecation
- `CALLCODE` — use `DELEGATECALL` instead

**Behavioral changes:**
- `CREATE` / `CREATE2` — routed through ContractDeployer; address derivation differs from Ethereum
- `CALL` — gas semantics differ slightly
- `MSTORE` / `MLOAD` — memory counted in bytes, not 32-byte words
- `CODESIZE` — returns the size of the deployed bytecode hash, not raw bytecode
- `COINBASE` — returns the bootloader address, not the sequencer
- `PREVRANDAO` — returns a pseudo-random value, not the beacon chain value

**Immutable variables** are stored in a system contract (`ImmutableSimulator`), not embedded in bytecode.

## Gas Model

Dual cost model:
1. **Off-chain execution** — ~$0.001/tx fixed cost for sequencer processing
2. **On-chain verification** — variable cost for proof verification and state diff publishing (EIP-4844 blobs)

Key differences from Ethereum:
- `block.baseFee` is not accessible to user accounts (only bootloader)
- Gas refunds follow a 4-step bootloader process
- EVM-compiled contracts may cost 1.5-4x more than native EraVM due to opcode translation
- Include a ~2x buffer over estimated gas usage

### Default pubdata cost

The default pubdata cost per batch is 50,000 gas. This affects contract deployment more than function calls.

## Address Derivation

`CREATE` and `CREATE2` produce different addresses than on Ethereum for the same inputs because:
- The compiler transforms these opcodes to calls to `ContractDeployer`
- Address is derived from `keccak256(0xff ++ deployerAddress ++ salt ++ keccak256(bytecodeHash ++ constructorInput))`

Do not hardcode addresses computed from Ethereum's derivation formula.

## System Contracts

17 system contracts in kernel space. The most relevant for developers:

| Contract | Address | Purpose |
|----------|---------|---------|
| ContractDeployer | `0x0000000000000000000000000000000000008006` | All deployments |
| NonceHolder | `0x0000000000000000000000000000000000008003` | Nonce management |
| L1Messenger | `0x0000000000000000000000000000000000008008` | L2→L1 messages |
| L2BaseToken | `0x000000000000000000000000000000000000800a` | ETH balances |
| Bootloader | `0x0000000000000000000000000000000000008001` | Transaction processing |
| ImmutableSimulator | `0x0000000000000000000000000000000000008005` | Immutable variable storage |

## Key Gotchas

1. **Always use `--zksync` flag** with Foundry commands (`forge build --zksync`, `forge create --zksync`)
2. **Don't rely on `CODESIZE` for contract detection** — returns hash size, not code size
3. **Don't use `tx.origin == msg.sender` to detect EOAs** — all accounts are smart contracts
4. **Gas estimation may underestimate** — add 2x buffer for safety
5. **Library linking differs** — the compiler handles this automatically
6. **Foundry cheatcodes**: most work, but some (like `vm.etch`) have limitations under ZKsync VM
7. **Proxy patterns work** but `DELEGATECALL` to precompiles may behave differently
