# Polkamarkets SDK (polkamarkets-js)

JavaScript SDK for on-chain interactions with Myriad Protocol prediction markets. Handles wallet connection, ERC-20 approvals, buying/selling shares, claiming winnings, and portfolio queries.

## Installation

```bash
npm install polkamarkets-js
```

## Initialization

```javascript
import * as polkamarketsjs from "polkamarkets-js";

const polkamarkets = new polkamarketsjs.Application({
  web3Provider: "https://api.mainnet.abs.xyz",
  web3PrivateKey: process.env.MYRIAD_PRIVATE_KEY, // optional — skip for browser wallet flow
  web3EventsProvider: "<events_rpc>", // optional — for event subscriptions
});
```

| Field | Type | Description |
|-------|------|-------------|
| `web3Provider` | `string` | RPC endpoint or provider object |
| `web3PrivateKey` | `string` | Private key for direct signing (skip `login()` if set) |
| `web3EventsProvider` | `string` | Optional events RPC endpoint |

## Login

```javascript
await polkamarkets.login(); // triggers wallet popup (not needed if web3PrivateKey is set)
const address = await polkamarkets.getAddress();
```

## Prediction Market Contract

```javascript
const pm = polkamarkets.getPredictionMarketV3PlusContract({
  contractAddress: "0x3e0F5F8F5Fb043aBFA475C0308417Bf72c463289", // Abstract mainnet
  querierContractAddress: "0x1d5773Cd0dC74744C1F7a19afEeECfFE64f233Ff", // optional
});
```

## Buying

```javascript
const minShares = await pm.calcBuyAmount({ marketId, outcomeId, value });

await pm.buy({
  marketId,
  outcomeId,
  value,
  minOutcomeSharesToBuy: minShares,
  wrapped: false, // true if using ETH instead of ERC20
});
```

### Buying with Referral (Revenue Sharing)

```javascript
await pm.referralBuy({
  marketId,
  outcomeId,
  value,
  minOutcomeSharesToBuy: minShares,
  code: "YOUR_BUILDER_CODE",
});
```

## Selling

```javascript
const maxShares = await pm.calcSellAmount({ marketId, outcomeId, value });

await pm.sell({
  marketId,
  outcomeId,
  value,
  maxOutcomeSharesToSell: maxShares,
  wrapped: false,
});

// With referral
await pm.referralSell({ marketId, outcomeId, value, maxOutcomeSharesToSell: maxShares, code: "YOUR_CODE" });
```

## Claiming Winnings

```javascript
// After market resolves in your favor
await pm.claimWinnings({ marketId, wrapped: false });

// If market was voided (canceled)
await pm.claimVoidedOutcomeShares({ marketId, outcomeId, wrapped: false });
```

## Portfolio

```javascript
const portfolio = await pm.getPortfolio({ user: address });
// Returns: { [marketId]: { outcomes: { [outcomeId]: { shares, price, ... } }, liquidity, claimStatus } }
```

## Market Prices

```javascript
const prices = await pm.getMarketPrices({ marketId });
// Returns: { liquidity: 0.618, outcomes: { "0": 0.893, "1": 0.107 } }
```

## Querier Contract

Use `querierContractAddress` to batch-fetch data (decimals, positions, prices) across multiple markets in a single RPC call instead of N calls.

## ERC-20 Contract

```javascript
const erc20 = polkamarkets.getERC20Contract({
  contractAddress: "0x84A71ccD554Cc1b02749b35d22F684CC8ec987e1", // USDC.e on Abstract
});

// Check approval
const approved = await erc20.isApproved({
  address: userAddress,
  amount: "100000000",
  spenderAddress: "0x3e0F5F8F5Fb043aBFA475C0308417Bf72c463289", // PM contract
});

// Approve if needed
if (!approved) {
  await erc20.approve({
    address: userAddress,
    amount: "100000000",
    spenderAddress: "0x3e0F5F8F5Fb043aBFA475C0308417Bf72c463289",
  });
}
```

## Full Example (Abstract Mainnet)

```javascript
import * as polkamarketsjs from "polkamarkets-js";

const polkamarkets = new polkamarketsjs.Application({
  web3Provider: "https://api.mainnet.abs.xyz",
  web3PrivateKey: process.env.MYRIAD_PRIVATE_KEY,
});

const pm = polkamarkets.getPredictionMarketV3PlusContract({
  contractAddress: "0x3e0F5F8F5Fb043aBFA475C0308417Bf72c463289",
  querierContractAddress: "0x1d5773Cd0dC74744C1F7a19afEeECfFE64f233Ff",
});

const erc20 = polkamarkets.getERC20Contract({
  contractAddress: "0x84A71ccD554Cc1b02749b35d22F684CC8ec987e1",
});

await polkamarkets.login();
const userAddress = await polkamarkets.getAddress();

// Check + approve
const approved = await erc20.isApproved({
  address: userAddress,
  spenderAddress: "0x3e0F5F8F5Fb043aBFA475C0308417Bf72c463289",
  amount: "100000000",
});
if (!approved) {
  await erc20.approve({
    address: userAddress,
    amount: "100000000",
    spenderAddress: "0x3e0F5F8F5Fb043aBFA475C0308417Bf72c463289",
  });
}

// Buy
const marketId = 123;
const outcomeId = 0;
const value = 10;
const minShares = await pm.calcBuyAmount({ marketId, outcomeId, value });
await pm.buy({ marketId, outcomeId, value, minOutcomeSharesToBuy: minShares });

// Check portfolio
const portfolio = await pm.getPortfolio({ user: userAddress });
```
