# IdentityRegistry Reference

The IdentityRegistry is an ERC-721 contract. Each agent identity is an NFT with a `tokenId` that serves as the `agentId`.

**Address (Mainnet):** `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432`

**Global Agent Identifier Format:** `{namespace}:{chainId}:{identityRegistry}:{agentId}`

## Registration

```solidity
function register(string agentURI) external returns (uint256 agentId)
function register(string agentURI, MetadataEntry[] calldata metadata) external returns (uint256 agentId)
function register() external returns (uint256 agentId)
```

Register with a URI pointing to an agent registration JSON file (see `references/agent-uri-schema.md`). The overload with `MetadataEntry[]` sets key-value metadata in the same transaction. Calling `register()` with no arguments creates a blank identity.

## URI Management

```solidity
function setAgentURI(uint256 agentId, string calldata newURI) external
```

Update the agent's metadata URI. Only callable by the NFT owner or approved operator.

## Metadata

```solidity
function getMetadata(uint256 agentId, string memory metadataKey) external view returns (bytes memory)
function setMetadata(uint256 agentId, string memory metadataKey, bytes memory metadataValue) external
```

Arbitrary key-value storage on the agent identity. The key `agentWallet` is reserved and cannot be set via `setMetadata` — use `setAgentWallet` instead.

## Agent Wallet

```solidity
function setAgentWallet(uint256 agentId, address newWallet, uint256 deadline, bytes calldata signature) external
function getAgentWallet(uint256 agentId) external view returns (address)
function unsetAgentWallet(uint256 agentId) external
```

The agent wallet is the address that receives payments. Setting it requires an EIP-712 signature (for EOAs) or ERC-1271 signature (for smart contract wallets) proving ownership of `newWallet`. The `deadline` prevents replay of stale signatures.

## Events

```solidity
event Registered(uint256 indexed agentId, string agentURI, address indexed owner)
event MetadataSet(uint256 indexed agentId, string indexed indexedMetadataKey, string metadataKey, bytes metadataValue)
event URIUpdated(uint256 indexed agentId, string newURI, address indexed updatedBy)
```

## ERC-721 Standard Functions

Since the registry extends ERC-721, all standard NFT functions apply:

- `ownerOf(agentId)` — who owns this agent identity
- `tokenURI(agentId)` — the agent's metadata URI
- `transferFrom(from, to, agentId)` — transfer ownership
- `approve(to, agentId)` — approve an operator
- `balanceOf(owner)` — how many agents an address owns

## Domain Verification (Optional)

Agents can prove they control their endpoint domain by hosting a file at:

```
https://{endpoint-domain}/.well-known/agent-registration.json
```

The file must contain a `registrations` array matching the agent's `agentId` and registry address.

## References

- [ERC-8004 Specification](https://eips.ethereum.org/EIPS/eip-8004)
