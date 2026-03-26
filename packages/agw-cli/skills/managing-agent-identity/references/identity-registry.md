# Identity Registry Reference

## Contents
- Contract Addresses
- IIdentityRegistry Interface
- Registration Flow
- Metadata Management
- Agent Wallet
- Agent URI Format

## Contract Addresses

| Network | Address |
|---------|---------|
| Mainnet (2741) | `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432` |
| Testnet (11124) | `0x8004A818BFB912233c491871b3d84c89A494BD9e` |

Both are ERC1967 proxies. Implementation is upgradeable.

Token: AgentIdentity (AGENT) — ERC-721.

## IIdentityRegistry Interface

Extends ERC-721 and ERC-721URIStorage.

### Registration (3 overloads)

```solidity
function register() external returns (uint256 agentId)
function register(string calldata agentURI) external returns (uint256 agentId)
function register(string calldata agentURI, MetadataEntry[] calldata metadata) external returns (uint256 agentId)
```

Each overload mints an ERC-721 to `msg.sender` with a sequential `agentId`. The simplest form registers with no URI; the full form sets URI and arbitrary key-value metadata in one call.

### URI Management

```solidity
function setAgentURI(uint256 agentId, string calldata newURI) external
```

Only callable by owner or approved operator.

### Metadata

```solidity
struct MetadataEntry {
    string metadataKey;
    bytes metadataValue;
}

function getMetadata(uint256 agentId, string memory metadataKey) external view returns (bytes memory)
function setMetadata(uint256 agentId, string memory metadataKey, bytes memory metadataValue) external
```

Arbitrary key-value store per agent. The reserved key `agentWallet` cannot be set via `setMetadata()`.

### Authorization

```solidity
function isAuthorizedOrOwner(address spender, uint256 agentId) external view returns (bool)
```

### Agent Wallet

```solidity
function setAgentWallet(uint256 agentId, address newWallet, uint256 deadline, bytes calldata signature) external
function getAgentWallet(uint256 agentId) external view returns (address)
function unsetAgentWallet(uint256 agentId) external
```

The `agentWallet` is the address where the agent receives payments. Initially set to `msg.sender` on registration. Changing it requires an EIP-712 signature (for EOAs) or ERC-1271 signature (for smart contract wallets). Automatically cleared on ERC-721 transfer.

### Events

```solidity
event Registered(uint256 indexed agentId, string agentURI, address indexed owner)
event URIUpdated(uint256 indexed agentId, string newURI, address indexed updatedBy)
event MetadataSet(uint256 indexed agentId, string indexed indexedMetadataKey, string metadataKey, bytes metadataValue)
```

## Registration Flow

1. Call `register(agentURI)` on IdentityRegistry.
2. An ERC-721 token is minted to `msg.sender` with sequential `agentId`.
3. `agentWallet` metadata is auto-set to `msg.sender`.
4. `agentURI` should resolve to a JSON registration file.
5. Optional: verify domain ownership via `/.well-known/agent-registration.json`.

## Agent URI Format

The `agentURI` resolves to a JSON registration file:

```json
{
  "type": "AgentRegistration",
  "name": "My Agent",
  "description": "An autonomous trading agent",
  "image": "https://example.com/avatar.png",
  "services": [
    {
      "type": "a2a",
      "endpoint": "https://myagent.example.com/a2a",
      "version": "1.0"
    },
    {
      "type": "mcp",
      "endpoint": "https://myagent.example.com/mcp",
      "version": "1.0"
    }
  ],
  "x402Support": true,
  "active": true,
  "registrations": [
    {
      "agentRegistry": "eip155:2741:0x8004A169FB4a3325136EB29fA0ceB6D2e539a432",
      "agentId": "42"
    }
  ],
  "supportedTrust": ["reputation", "validation"]
}
```

URI schemes: `https://`, `ipfs://`, or `data:` (base64-encoded).
