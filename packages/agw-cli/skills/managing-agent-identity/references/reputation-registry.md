# Reputation Registry Reference

## Contents
- Contract Addresses
- IReputationRegistry Interface
- Feedback Flow
- Reading Reputation
- Aggregation

## Contract Addresses

| Network | Address |
|---------|---------|
| Mainnet (2741) | `0x8004BAa17C55a88189AE136b182e5fdA19dE9b63` |
| Testnet (11124) | `0x8004B663056A597Dffe9eCcC1965A193B7388713` |

## IReputationRegistry Interface

### Initialization

```solidity
function getIdentityRegistry() external view returns (address identityRegistry)
```

### Giving Feedback

```solidity
function giveFeedback(
    uint256 agentId,
    int128 value,
    uint8 valueDecimals,
    string calldata tag1,
    string calldata tag2,
    string calldata endpoint,
    string calldata feedbackURI,
    bytes32 feedbackHash
) external
```

**Constraints:**
- `agentId` must be a valid registered agent
- `valueDecimals` must be 0-18
- Submitter cannot be the agent owner or approved operator (prevents self-rating)
- `value` is signed int128 (allows negative feedback)
- All fields except `value` and `valueDecimals` are optional (pass empty strings and zero hash)

**On-chain storage:** value, valueDecimals, tag1, tag2, isRevoked, feedbackIndex.
**Emitted only (not stored):** endpoint, feedbackURI, feedbackHash.

### Revoking Feedback

```solidity
function revokeFeedback(uint256 agentId, uint64 feedbackIndex) external
```

Only the original feedback submitter can revoke. Revoked feedback remains as an immutable record but is excluded from summaries by default.

### Appending Responses

```solidity
function appendResponse(
    uint256 agentId,
    address clientAddress,
    uint64 feedbackIndex,
    string calldata responseURI,
    bytes32 responseHash
) external
```

Anyone can append a response (e.g., the agent showing a refund, or an aggregator tagging feedback as spam).

### Reading Feedback

```solidity
function readFeedback(
    uint256 agentId,
    address clientAddress,
    uint64 feedbackIndex
) external view returns (int128 value, uint8 valueDecimals, string memory tag1, string memory tag2, bool isRevoked)

function readAllFeedback(
    uint256 agentId,
    address[] calldata clientAddresses,
    string calldata tag1,
    string calldata tag2,
    bool includeRevoked
) external view returns (
    address[] memory clients,
    uint64[] memory feedbackIndexes,
    int128[] memory values,
    uint8[] memory valueDecimals,
    string[] memory tag1s,
    string[] memory tag2s,
    bool[] memory revokedStatuses
)
```

### Summary

```solidity
function getSummary(
    uint256 agentId,
    address[] calldata clientAddresses,
    string calldata tag1,
    string calldata tag2
) external view returns (uint64 count, int128 summaryValue, uint8 summaryValueDecimals)
```

**`clientAddresses` must be non-empty** to prevent Sybil/spam attacks. To get a meaningful summary, provide trusted client addresses.

### Utility

```solidity
function getClients(uint256 agentId) external view returns (address[] memory)
function getLastIndex(uint256 agentId, address clientAddress) external view returns (uint64)
function getResponseCount(uint256 agentId, address clientAddress, uint64 feedbackIndex, address[] calldata responders) external view returns (uint64 count)
```

### Events

```solidity
event NewFeedback(
    uint256 indexed agentId,
    address indexed clientAddress,
    uint64 feedbackIndex,
    int128 value,
    uint8 valueDecimals,
    string indexed indexedTag1,
    string tag1,
    string tag2,
    string endpoint,
    string feedbackURI,
    bytes32 feedbackHash
)

event FeedbackRevoked(uint256 indexed agentId, address indexed clientAddress, uint64 indexed feedbackIndex)

event ResponseAppended(
    uint256 indexed agentId,
    address indexed clientAddress,
    uint64 feedbackIndex,
    address indexed responder,
    string responseURI,
    bytes32 responseHash
)
```

## Feedback Flow

1. Client calls `giveFeedback(agentId, value, valueDecimals, ...)`.
2. Feedback stored on-chain indexed by `(agentId, clientAddress, feedbackIndex)`.
3. Tags enable categorized scoring (e.g., "speed", "accuracy", "reliability").
4. Optional `feedbackURI` + `feedbackHash` link to extended off-chain evidence with integrity verification.

## Aggregation

On-chain `getSummary()` provides simple count + sum aggregation filtered by client addresses and tags. Complex scoring algorithms (weighted averages, decay, outlier removal) should run off-chain using the raw on-chain signals.
