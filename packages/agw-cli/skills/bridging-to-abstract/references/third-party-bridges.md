# Third-Party Bridges Reference

## Contents
- Relay (Recommended for Programmatic Use)
- Jumper / LI.FI
- Stargate (LayerZero)
- deBridge
- Symbiosis
- thirdweb Universal Bridge

## Relay (Recommended for Programmatic Use)

Intent-based bridge, near-instant, 85+ chains. Best REST API for programmatic bridging.

### Get a Quote

```
POST https://api.relay.link/quote/v2
Content-Type: application/json

{
  "user": "0x03508bb71268bba25ecacc8f620e01866650532c",
  "originChainId": 1,
  "destinationChainId": 2741,
  "originCurrency": "0x0000000000000000000000000000000000000000",
  "destinationCurrency": "0x0000000000000000000000000000000000000000",
  "amount": "1000000000000000000"
}
```

**Key parameters:**

| Parameter | Description |
|-----------|-------------|
| `user` | Sender address on origin chain |
| `recipient` | Recipient on destination (defaults to user) |
| `originChainId` | Source chain ID (1 = Ethereum, 8453 = Base, etc.) |
| `destinationChainId` | `2741` for Abstract mainnet, `11124` for testnet |
| `originCurrency` | Token address on origin (0x0 = native ETH) |
| `destinationCurrency` | Token address on destination (0x0 = native ETH) |
| `amount` | Amount in wei (origin token decimals) |

The response contains `steps` with transaction data to sign and submit on the origin chain.

**Important:** Never pass `x-api-key` in headers from client-side code. Only use it server-side.

### Relay SDK

```typescript
import { getClient } from "@reservoir0x/relay-sdk";

const client = getClient();
const quote = await client.actions.getQuote({
  chainId: 1,
  toChainId: 2741,
  currency: "0x0000000000000000000000000000000000000000",
  toCurrency: "0x0000000000000000000000000000000000000000",
  amount: "1000000000000000000",
  wallet: walletClient,
});
```

### Relay Docs

Full API reference: `https://docs.relay.link/references/api/get-quote`

## Jumper / LI.FI

Bridge + DEX aggregator. 60+ chains, 18+ underlying bridges. Finds the best route.

**URL:** `https://jumper.exchange`

**API:** LI.FI REST API — `https://li.quest/v1/quote`

```bash
curl "https://li.quest/v1/quote?fromChain=1&toChain=2741&fromToken=0x0000000000000000000000000000000000000000&toToken=0x0000000000000000000000000000000000000000&fromAmount=1000000000000000000&fromAddress=0x..."
```

Best for finding the cheapest or fastest route across multiple bridge backends.

## Stargate (LayerZero)

LayerZero V2-based bridge. Uses Hydra mechanism for Abstract. Abstract's bridged USDC via Stargate appears as "Bridged USDC (Stargate)".

**URL:** `https://stargate.finance/bridge`

**Solidity interface:**

```solidity
interface IOFT {
    function quoteSend(SendParam calldata _sendParam, bool _payInLzToken)
        external view returns (MessagingFee memory);

    function send(SendParam calldata _sendParam, MessagingFee calldata _fee, address _refundAddress)
        external payable returns (MessagingReceipt memory, OFTReceipt memory);
}
```

Best for cross-L2 transfers using the LayerZero messaging layer.

## deBridge

Intent-based market orders. Single endpoint returns both quote and ready-to-sign transaction.

**URL:** `https://app.debridge.com`

**API:** `https://api.dln.trade/v1.0/dln/order/create-tx`

No separate lightweight quote endpoint — the `create-tx` endpoint serves as both.

## Symbiosis

Cross-chain AMM with sTokens. Has Abstract-specific routes and guides.

**URL:** `https://symbiosis.finance`

**API + SDK:** JavaScript SDK and REST API available.

## thirdweb Universal Bridge

Aggregator with 30K+ routes. Clean TypeScript SDK.

**URL:** `https://thirdweb.com/bridge`

```typescript
import { Bridge } from "thirdweb";

const quote = await Bridge.getQuote({
  originChainId: 1,
  destinationChainId: 2741,
  originToken: "0x0000000000000000000000000000000000000000",
  destinationToken: "0x0000000000000000000000000000000000000000",
  amount: "1000000000000000000",
});
```

Handles approvals automatically. Good for SDK-first integration.

## Provider Comparison

| Provider | Speed | API Quality | Non-Ethereum Sources | Notes |
|----------|-------|-------------|---------------------|-------|
| Relay | Seconds | Excellent REST | Yes (85+ chains) | Best for programmatic use |
| Jumper | Minutes | Good REST | Yes (60+ chains) | Best route aggregation |
| Stargate | Minutes | Solidity | Yes (LayerZero chains) | Best for cross-L2 |
| deBridge | Minutes | REST | Yes | No separate quote endpoint |
| Symbiosis | Minutes | SDK + REST | Yes | Abstract-specific guides |
| thirdweb | Varies | TypeScript SDK | Yes (30K+ routes) | Best SDK DX |
