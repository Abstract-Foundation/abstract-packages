# Myriad Protocol Revenue Sharing for Builders

Builders earn a percentage of buy volume they generate on eligible markets. The revenue sharing logic is built into the protocol's smart contracts.

## How It Works

- **Eligible markets:** Markets with a non-zero `distributor_fee` (check via API or `getMarketFees(marketId)`)
- **Referral rate:** The `distributor_fee` value — typically **1%** of trade value
- **Eligible trades:** Only `buy` actions (`sell`, `claim_winnings`, `claim_voided` are not eligible)
- **Eligible builders:** Must apply for whitelisting with the Myriad team

## How to Apply

1. Contact the Myriad team to request whitelisting
2. Provide a short ASCII string as your **referral code** (identifies your app)
3. Provide an **EVM wallet address** for receiving rewards

Whitelisting is granted and revoked at Myriad's discretion.

## Integration

### Check Market Eligibility

**Via API:**

```javascript
const market = await fetch("https://api-v2.myriadprotocol.com/markets/164?network_id=2741", {
  headers: { "x-api-key": "<your_api_key>" },
}).then((r) => r.json());

if (market.fees.distributor_fee > 0) {
  // Eligible for revenue sharing
}
```

**Via smart contract:**

```javascript
const fees = await pmContract.getMarketFees(marketId);
// fees[2] (third element of buyFees tuple) is distributor_fee
if (fees[2] > 0n) {
  // Eligible
}
```

### Use referralBuy Instead of buy

**Via SDK:**

```javascript
await pm.referralBuy({
  marketId,
  outcomeId,
  value,
  minOutcomeSharesToBuy,
  code: "YOUR_BUILDER_CODE",
});
```

**Via smart contract directly:**

Call `referralBuy` on the PredictionMarket contract with the same arguments as `buy`, plus your whitelisted referral code.

> You can call `referralBuy` on non-eligible markets safely — it just won't generate rewards.

## On-Chain Verification

The smart contract emits a `Referral` event when `referralBuy` is used:

**Event signature:** `0xc993f9a8447446a00c879dadbeefa69111000411f1a1a9f67cf75a12ec08a3ec`

**Topics:**
- `[0]`: Event signature
- `[1]`: `user` — trader's wallet address
- `[2]`: `marketId` — market ID

**Data fields:**
- `code` — builder's referral code
- `action` — `0` for buys
- `outcomeId` — outcome purchased
- `value` — trade amount (in market token decimals)
- `timestamp` — Unix timestamp

Example tx: [abscan.org/tx/0x5b8b5fa...](https://abscan.org/tx/0x5b8b5fa23e78896a520f883c4eed21b3a880f4158d78fb02e8f66b4026f362d8)

## Payouts

- Monthly payouts on the **first Monday of each month**
- Minimum threshold: **$500** accumulated
- Below threshold: amount carries over to the next period
- Self-service claiming from a smart contract is coming soon (daily basis)
