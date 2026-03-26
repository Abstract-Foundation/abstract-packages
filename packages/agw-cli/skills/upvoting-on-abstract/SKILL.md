---
name: upvoting-on-abstract
description: Vote for apps on the Abstract Portal using the AbstractVoting contract. Use when a user wants to upvote an app, check remaining votes, see vote counts for apps, check the current epoch or vote cost, or interact with Abstract Portal voting. Trigger for requests mentioning upvote, vote for app, Abstract voting, Portal voting, vote cost, epoch, voteForApp, votes remaining, or app popularity on Abstract.
---

# Upvoting on Abstract

The Abstract Portal has an on-chain voting system where users spend ETH to upvote apps each epoch. Votes signal app quality and contribute to Portal XP.

## Operating Rules

- Check the vote cost with `voteCost()` before submitting a vote — the cost is set per epoch and may change.
- Check remaining votes with `userVotesRemaining(address)` before voting.
- The `voteForApp` function is payable — include the vote cost as `value`.
- Each user can vote for each app only once per epoch (`AlreadyVotedFor` error).
- Preview every vote with `--dry-run` before execution.
- Read [references/voting-contract.md](./references/voting-contract.md) for the full contract interface and error handling.

## Contract

| Network | Address |
|---------|---------|
| Mainnet | `0x3b50de27506f0a8c1f4122a1e6f470009a76ce2a` |

## ABI Format

The AGW CLI requires full JSON ABI objects, not human-readable strings. Every `abi` array element must be an object with `type`, `name`, `inputs`, `outputs`, and `stateMutability` fields.

## Task Map

### Check vote cost and current epoch

```bash
agw contract write --json '{
  "address": "0x3b50de27506f0a8c1f4122a1e6f470009a76ce2a",
  "abi": [{"type":"function","name":"voteCost","stateMutability":"view","inputs":[],"outputs":[{"name":"","type":"uint96"}]}],
  "functionName": "voteCost",
  "args": []
}' --dry-run
```

```bash
agw contract write --json '{
  "address": "0x3b50de27506f0a8c1f4122a1e6f470009a76ce2a",
  "abi": [{"type":"function","name":"currentEpoch","stateMutability":"view","inputs":[],"outputs":[{"name":"","type":"uint256"}]}],
  "functionName": "currentEpoch",
  "args": []
}' --dry-run
```

### Check remaining votes

```bash
agw contract write --json '{
  "address": "0x3b50de27506f0a8c1f4122a1e6f470009a76ce2a",
  "abi": [{"type":"function","name":"userVotesRemaining","stateMutability":"view","inputs":[{"name":"user","type":"address"}],"outputs":[{"name":"","type":"uint256"}]}],
  "functionName": "userVotesRemaining",
  "args": ["<YOUR_ADDRESS>"]
}' --dry-run
```

### Vote for an app

Replace `<APP_ID>` with the Portal app ID (e.g., `25` for Onchain Heroes) and `<VOTE_COST>` with the value from `voteCost()`:

```bash
agw contract write --json '{
  "address": "0x3b50de27506f0a8c1f4122a1e6f470009a76ce2a",
  "abi": [{"type":"function","name":"voteForApp","stateMutability":"payable","inputs":[{"name":"appId","type":"uint256"}],"outputs":[]}],
  "functionName": "voteForApp",
  "args": ["<APP_ID>"],
  "value": "<VOTE_COST>"
}' --dry-run
```

Execute only after confirming the preview: replace `--dry-run` with `--execute`.

### Check votes for a specific app

```bash
agw contract write --json '{
  "address": "0x3b50de27506f0a8c1f4122a1e6f470009a76ce2a",
  "abi": [{"type":"function","name":"getVotesForApp","stateMutability":"view","inputs":[{"name":"appId","type":"uint256"},{"name":"epoch","type":"uint256"}],"outputs":[{"name":"","type":"uint256"}]}],
  "functionName": "getVotesForApp",
  "args": ["<APP_ID>", "<EPOCH>"]
}' --dry-run
```

Use `currentEpoch()` to get the current epoch number first.

### Check which apps a user voted for

```bash
agw contract write --json '{
  "address": "0x3b50de27506f0a8c1f4122a1e6f470009a76ce2a",
  "abi": [{"type":"function","name":"getUserVotes","stateMutability":"view","inputs":[{"name":"user","type":"address"},{"name":"epoch","type":"uint256"}],"outputs":[{"name":"","type":"uint256[]"}]}],
  "functionName": "getUserVotes",
  "args": ["<USER_ADDRESS>", "<EPOCH>"]
}' --dry-run
```

Returns an array of app IDs the user has voted for this epoch.

## Voting Workflow

1. Check vote cost: `voteCost()` → returns cost in wei
2. Check remaining votes: `userVotesRemaining(address)` → returns count
3. Find the app ID via `agw portal apps list` or `agw app list`
4. Preview the vote: `voteForApp(appId)` with `--dry-run` and `value` set to vote cost
5. Execute after confirmation: `--execute`
6. Verify: `getUserVotes(address, epoch)` to confirm your vote was recorded

## Error Handling

| Error | Cause | Fix |
|-------|-------|-----|
| `InvalidValue` | Sent wrong ETH amount | Send exactly `voteCost()` as `value` |
| `VotingNotActive` | Voting not open this epoch | Wait for next epoch |
| `AppNotActive` | App not eligible for votes | Verify app ID via Portal |
| `AlreadyVotedFor` | Already voted for this app this epoch | Choose a different app |
| `UsedAllVotes` | No remaining votes this epoch | Wait for next epoch |

## Escalation

- Route app discovery to `discovering-abstract-portal`.
- Route wallet balance checks to `reading-agw-wallet`.
- Route transaction safety to `executing-agw-transactions`.
