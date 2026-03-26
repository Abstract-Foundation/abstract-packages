# Myriad Protocol API V2 Reference

Base URL: `https://api-v2.myriadprotocol.com/`
Staging: `https://api-v2.staging.myriadprotocol.com/`

## Authentication

All endpoints (except health) require an API key:

- Header: `x-api-key: <your_api_key>`
- Query: `?api_key=<your_api_key>`

## Rate Limiting

50 requests/second per IP and/or API key. Response headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`.

## Pagination

All list endpoints support:

- `page` (default: 1)
- `limit` (default: 20, max: 100)

Response includes: `pagination: { page, limit, total, totalPages, hasNext, hasPrev }`

---

## Questions

A question is the canonical proposition — the same question can have markets across multiple chains.

### GET /questions

| Param | Description |
|-------|-------------|
| `page`, `limit` | Pagination |
| `keyword` | Search in question title |
| `min_markets` | Minimum linked markets |
| `max_markets` | Maximum linked markets |

Response: `id`, `title`, `expiresAt`, `marketCount`, `markets[]` (with `outcomes[]`)

### GET /questions/:id

Single question with all markets and outcomes.

---

## Markets

### GET /markets

| Param | Description |
|-------|-------------|
| `sort` | `volume` \| `volume_24h` \| `liquidity` \| `expires_at` \| `published_at` \| `featured` |
| `order` | `asc` \| `desc` |
| `network_id` | Comma-separated (e.g., `2741,59144`) |
| `state` | `open` \| `closed` \| `resolved` |
| `token_address` | Filter by token |
| `topics` | Comma-separated topics |
| `keyword` | Full-text search title/description/outcomes |
| `ids` | Comma-separated on-chain market IDs |
| `in_play` | `true`/`false` |
| `moneyline` | `true`/`false` |
| `min_duration` | Minimum duration in seconds |
| `max_duration` | Maximum duration in seconds |

**Fee filters** — decimal values (0.01 = 1%):

- `{action}_{component}_fee_{operator}` — e.g., `buy_lp_fee_lte=0.01`
- `{action}_fee_{operator}` — total fee, e.g., `sell_fee_lt=0.02`
- Components: `lp`, `dt` (distributor), `tr` (treasury), `total`
- Actions: `buy`, `sell`
- Operators: `lt`, `lte`, `gt`, `gte`, `eq`

Response per market: `id`, `networkId`, `slug`, `title`, `description`, `state`, `fees`, `token`, `liquidity`, `volume`, `volume24h`, `outcomes[]` (with `price`, `shares`, `priceChange24h`)

### GET /markets/:id

Single market by slug or by `marketId + network_id`.

Includes `outcomes[*].price_charts` with timeframes:

| Timeframe | Bucket | Max points |
|-----------|--------|------------|
| `24h` | 5 min | 288 |
| `7d` | 30 min | 336 |
| `30d` | 4 hours | 180 |
| `all` | 4 hours | — |

### GET /markets/:id/events

Trade/liquidity/claim actions for a market.

| Param | Description |
|-------|-------------|
| `since` | Unix seconds (inclusive) |
| `until` | Unix seconds (inclusive) |

Response: `user`, `action` (`buy` \| `sell` \| `add_liquidity` \| `remove_liquidity` \| `claim_winnings` \| `claim_liquidity` \| `claim_fees` \| `claim_voided`), `shares`, `value`, `timestamp`, `token`

### GET /markets/:id/referrals

Referral trades for a market. Params: `since`, `until`, `code`. Response includes `fees: { lp, treasury, distributor }`.

### GET /markets/:id/holders

Holders grouped by outcome. `limit` applies per outcome.

### POST /markets/quote

Get a trade quote with execution calldata.

```json
{
  "market_id": 164,
  "outcome_id": 0,
  "network_id": 2741,
  "action": "buy",
  "value": 100,
  "slippage": 0.01
}
```

- **Buy:** provide only `value`; `shares` must be omitted
- **Sell:** provide exactly one of `value` or `shares`
- Market must be `open` with sufficient liquidity

Response: `value`, `shares`, `shares_threshold`, `price_average`, `price_before`, `price_after`, `calldata`, `net_amount`, `fees: { treasury, distributor, fee }`

### POST /markets/quote_with_fee

For integrators charging a **frontend fee** via EIP-5792 bundled transactions. Requires whitelisting.

Additional request fields: `fee` (decimal, max 0.05), `from_wallet`, `to_wallet`

Returns same as quote plus `fees.frontend`, `approval`, and `calldata` as EIP-5792 `wallet_sendCalls` params.

### POST /markets/claim

Get claim calldata for a resolved market.

```json
{
  "market_id": 164,
  "network_id": 2741
}
```

Response: `action` (`claim_winnings` \| `claim_voided`), `outcome_id`, `calldata`

---

## Users

### GET /users/:address/events

User's trade history across markets. Params: `market_id`, `market_slug`, `network_id`, `since`, `until`.

### GET /users/:address/referrals

Referrals attributed to a user. Same params as events plus `code`.

### GET /users/:address/portfolio

Aggregated positions per market/outcome. Params: `min_shares`, `market_slug`, `market_id`, `network_id`, `token_address`.

Response: `marketId`, `outcomeId`, `shares`, `price` (avg buy), `value` (current), `profit`, `roi`, `status` (`ongoing` \| `lost` \| `won` \| `claimed` \| `sold`), `winningsToClaim`, `winningsClaimed`

### GET /users/:address/markets

Portfolio grouped by market. Includes full market object + positions + liquidity.

---

## Errors

| Code | Meaning |
|------|---------|
| `401` | Missing/invalid API key |
| `429` | Rate limit exceeded |
| `400` | Invalid parameters |
| `404` | Resource not found |
| `500` | Server error |

## Network IDs

| Network | ID |
|---------|-----|
| Abstract | `2741` |
| Linea | `59144` |
| BNB Chain | `56` |
