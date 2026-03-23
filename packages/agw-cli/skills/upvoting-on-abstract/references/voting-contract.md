# AbstractVoting Contract Reference

## Contents
- Contract Details
- Full Interface
- Schedule Struct
- Epoch Mechanics
- Admin Functions

## Contract Details

| Property | Value |
|----------|-------|
| Name | AbstractVoting |
| Address (Mainnet) | `0x3b50de27506f0a8c1f4122a1e6f470009a76ce2a` |
| Verified | Yes (Exact Match) |
| Compiler | Solidity v0.8.26, ZkSolc v1.5.7 |

## Full Interface

### User Functions

```solidity
// Vote for an app (payable — send voteCost() as value)
function voteForApp(uint256 appId) external payable

// Check remaining votes for a user this epoch
function userVotesRemaining(address user) external view returns (uint256)

// Get total votes for an app in a specific epoch
function getVotesForApp(uint256 appId, uint256 epoch) external view returns (uint256)

// Get array of app IDs a user voted for in a specific epoch
function getUserVotes(address user, uint256 epoch) external view returns (uint256[])

// Get current epoch number
function currentEpoch() external view returns (uint256)

// Get vote cost in wei
function voteCost() external view returns (uint96)
```

### Admin Functions (governance only)

```solidity
// Initialize the voting schedule (governor only)
function initializeSchedule(uint40 _startTime, uint40 _epochDuration, uint96 _voteCost) external

// Change the vote governor address
function setVoteGovernor(address newGovernor) external

// Change the app registry address
function setAppRegistry(address newAppRegistry) external

// Withdraw accumulated ETH (governor only)
function withdraw() external
```

## Schedule Struct

```solidity
struct Schedule {
    uint40 startTime;        // Unix timestamp when voting started
    uint40 epochDuration;    // Duration of each epoch in seconds
    uint40 epochsCompleted;  // Number of completed epochs
    uint96 voteCost;         // Cost per vote in wei
}
```

## Events

```solidity
event ScheduleInitialized(uint256 startTime, uint256 epochDuration, uint256 epochsCompleted)
event Voted(address indexed voter, uint256 indexed appId, uint256 indexed epoch)
event VoteGovernorUpdated(address indexed newGovernor)
event AppRegistryUpdated(address indexed newAppRegistry)
```

## Custom Errors

```solidity
error InvalidValue();       // Wrong ETH amount sent
error InvalidSchedule();    // Invalid schedule parameters
error VotingNotActive();    // Voting not open
error AppNotActive();       // App not eligible
error AlreadyVotedFor();    // Already voted for this app this epoch
error UsedAllVotes();       // No remaining votes this epoch
error WithdrawFailed();     // ETH withdrawal failed
```

## Epoch Mechanics

- Voting is organized into fixed-duration epochs.
- Each epoch resets vote allowances for all users.
- Users have a limited number of votes per epoch (enforced by `UsedAllVotes`).
- Each user can vote for each app at most once per epoch (enforced by `AlreadyVotedFor`).
- Vote cost is fixed per epoch (set by governance via `initializeSchedule`).
- `currentEpoch()` returns the current epoch number based on `block.timestamp`, `startTime`, and `epochDuration`.
