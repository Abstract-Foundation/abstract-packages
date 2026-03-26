# ReputationRegistry Reference

Tracks client feedback for registered agents. Feedback is stored onchain with optional off-chain evidence linked via URI and hash.

**Address (Mainnet):** `0x8004BAa17C55a88189AE136b182e5fdA19dE9b63`

## Giving Feedback

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

| Parameter | Description |
|-----------|-------------|
| `agentId` | The agent's NFT token ID from the IdentityRegistry |
| `value` | Feedback score (signed — can be negative for losses) |
| `valueDecimals` | Decimal places for `value` (0-18). E.g., `value=9977, decimals=2` = 99.77% |
| `tag1` | Primary category (`starred`, `uptime`, `responseTime`, `tradingYield`) |
| `tag2` | Subcategory (optional — e.g., `day`, `week`, `month` for yield) |
| `endpoint` | The agent endpoint that was used |
| `feedbackURI` | Link to off-chain evidence JSON (optional) |
| `feedbackHash` | Hash of the off-chain evidence for integrity verification |

**Constraints:**
- Cannot give feedback to an agent you own or are an approved operator for
- `valueDecimals` must be 0-18

## Revoking Feedback

```solidity
function revokeFeedback(uint256 agentId, uint64 feedbackIndex) external
```

Only the original feedback submitter can revoke. Revoked feedback is excluded from summaries by default.

## Agent Responses to Feedback

```solidity
function appendResponse(
  uint256 agentId,
  address clientAddress,
  uint64 feedbackIndex,
  string calldata responseURI,
  bytes32 responseHash
) external
```

Agent owners can respond to feedback with off-chain evidence (e.g., transaction logs, dispute context).

## Reading Feedback

### Summary (aggregated score)

```solidity
function getSummary(
  uint256 agentId,
  address[] calldata clientAddresses,
  string tag1,
  string tag2
) external view returns (uint64 count, int128 summaryValue, uint8 summaryValueDecimals)
```

Pass specific `clientAddresses` to filter by trusted reviewers. Pass `[]` for all feedback (vulnerable to Sybil spam).

### Individual entries

```solidity
function readFeedback(
  uint256 agentId,
  address clientAddress,
  uint64 feedbackIndex
) external view returns (int128 value, uint8 valueDecimals, string tag1, string tag2, bool isRevoked)
```

### All feedback (batch)

```solidity
function readAllFeedback(
  uint256 agentId,
  address[] calldata clientAddresses,
  string tag1,
  string tag2,
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

### Helper queries

```solidity
function getClients(uint256 agentId) external view returns (address[] memory)
function getLastIndex(uint256 agentId, address clientAddress) external view returns (uint64)
function getResponseCount(uint256 agentId, address clientAddress, uint64 feedbackIndex, address[] responders) external view returns (uint64)
```

## Events

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
event ResponseAppended(uint256 indexed agentId, address indexed clientAddress, uint64 feedbackIndex, address indexed responder, string responseURI, bytes32 responseHash)
```

## Sybil Considerations

The protocol does not prevent Sybil attacks at the contract level. Defenses are delegated to consumers:

- **Filter by trusted `clientAddresses`** — the most effective mitigation
- **Weight feedback by client reputation** — use external reputation systems for reviewers
- **Check `feedbackURI` evidence** — off-chain proof of actual agent usage

## References

- [ERC-8004 Specification](https://eips.ethereum.org/EIPS/eip-8004)
