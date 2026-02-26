---
name: myriad-on-abstract
description: Integrate Myriad Protocol prediction markets on Abstract — REST API for market data, polkamarkets-js SDK for trading, builder revenue sharing via referralBuy, and contract addresses. Use this skill when working with Myriad API, prediction markets on Abstract, polkamarkets-js, buying/selling prediction shares, builder codes, referralBuy, or Myriad Protocol integration.
---

# Myriad on Abstract

Myriad Protocol is a prediction market platform live on Abstract (and Linea, BNB Chain). Integrate it to show market data, let users trade outcome shares, and earn revenue from buy volume.

## Architecture

| Layer | Tool | Use For |
|-------|------|---------|
| **Read-only data** | REST API V2 | Market listings, prices, charts, portfolio, events |
| **Trading** | polkamarkets-js SDK | Buy/sell shares, claim winnings, ERC-20 approvals |
| **Revenue** | `referralBuy` + builder code | Earn distributor fee (typically 1%) on buy volume |

## Quick Start

### API Setup

```
Base URL: https://api-v2.myriadprotocol.com/
Auth: x-api-key: <your_api_key>  (or ?api_key=<your_api_key>)
Rate limit: 50 req/s per IP/key
```

Contact the Myriad team to obtain an API key.

### Common Flow: Fetch Markets → Get Quote → Execute Trade

```typescript
// 1. Fetch open markets on Abstract
const res = await fetch(
  "https://api-v2.myriadprotocol.com/markets?network_id=2741&state=open&sort=volume_24h&limit=10",
  { headers: { "x-api-key": "<your_api_key>" } }
);
const { data: markets } = await res.json();

// 2. Get a buy quote for a specific outcome
const quote = await fetch("https://api-v2.myriadprotocol.com/markets/quote", {
  method: "POST",
  headers: { "Content-Type": "application/json", "x-api-key": "<your_api_key>" },
  body: JSON.stringify({
    market_id: 164,
    outcome_id: 0,
    network_id: 2741,
    action: "buy",
    value: 100,
    slippage: 0.01,
  }),
});
// Returns: shares, price_before, price_after, calldata, fees

// 3. Execute via SDK (see references/sdk.md) or send calldata directly
```

### Common Flow: Claim Winnings

```typescript
const claim = await fetch("https://api-v2.myriadprotocol.com/markets/claim", {
  method: "POST",
  headers: { "Content-Type": "application/json", "x-api-key": "<your_api_key>" },
  body: JSON.stringify({ market_id: 164, network_id: 2741 }),
});
// Returns: action ("claim_winnings" | "claim_voided"), outcome_id, calldata
```

## Decision: API vs SDK

| Task | Use |
|------|-----|
| Display market listings, prices, charts | **API** — `GET /markets` |
| Show user portfolio / positions | **API** — `GET /users/:address/portfolio` |
| Get trade quotes + calldata | **API** — `POST /markets/quote` |
| Execute trades from a backend/agent | **SDK** — `pm.buy()` / `pm.sell()` |
| Execute trades from a dapp with wallet | **API** calldata + wallet `sendTransaction` |
| Earn revenue on buy volume | **SDK** — `pm.referralBuy()` with builder code |
| Claim winnings after resolution | **SDK** — `pm.claimWinnings()` or **API** calldata |

## Abstract Contract Addresses

| Contract | Mainnet | Testnet |
|----------|---------|---------|
| PredictionMarket | `0x3e0F5F8F5Fb043aBFA475C0308417Bf72c463289` | `0x6c44Abf72085E5e71EeB7C951E3079073B1E7312` |
| PredictionMarketQuerier | `0x1d5773Cd0dC74744C1F7a19afEeECfFE64f233Ff` | `0xa30c60107f9011dd49fc9e04ebe15963064eecc1` |

| Token | Mainnet | Testnet |
|-------|---------|---------|
| USDC.e | `0x84A71ccD554Cc1b02749b35d22F684CC8ec987e1` | `0x8820c84FD53663C2e2EA26e7a4c2b79dCc479765` |
| PENGU | `0x9eBe3A824Ca958e4b3Da772D2065518F009CBa62` | `0x6ccDDCf494182a3A237ac3f33A303a57961FaF55` |
| PTS | `0x0b07cf011b6e2b7e0803b892d97f751659940f23` | `0x6cC39C1149aed1fdbf6b11Fd60C18b96446cBc96` |

## Revenue Sharing

Builders earn the `distributor_fee` (typically 1%) on eligible buy trades by using `referralBuy` with a whitelisted builder code. Must apply for whitelisting with the Myriad team.

See `references/revenue-sharing.md` for full integration details.

## Feature Reference

| Topic | Where to look |
|-------|--------------|
| Full REST API reference | `references/api-v2.md` |
| polkamarkets-js SDK | `references/sdk.md` |
| Revenue sharing integration | `references/revenue-sharing.md` |
| All contract addresses (multi-chain) | `references/contracts.md` |
