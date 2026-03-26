# @abstract-foundation/mpp

[MPP](https://github.com/anthropics/mppx) payment method plugin for the [Abstract](https://abs.xyz) blockchain. Enables paid API access via two settlement mechanisms: one-time ERC-3009 charges and ERC-20 payment channel sessions.

## Install

```bash
npm install @abstract-foundation/mpp mppx viem zod
```

## How it works

Both payment methods follow the same HTTP protocol:

1. Client requests a resource
2. Server responds `402 Payment Required` with `WWW-Authenticate: Payment method="abstract"`
3. Client signs and retries with `Authorization: Payment <credential>`
4. Server verifies, settles on-chain, responds `200 OK` with `Payment-Receipt`

The `mppx` framework handles the 402 negotiation loop. This package implements the Abstract-specific signing and settlement logic on top.

## Payment methods

### Charge (ERC-3009)

One-time payments. The client signs ERC-3009 `TransferWithAuthorization` typed data — no transaction from the client side. The server broadcasts `transferWithAuthorization()` on USDC.e, paying gas (optionally via an Abstract paymaster).

### Session (Payment channels)

Streaming payments via `AbstractStreamChannel.sol`. The client opens a channel once (approve + `open()`), depositing USDC.e into escrow. Each subsequent request exchanges a signed EIP-712 voucher with a cumulative amount. The server accumulates the highest voucher and calls `settle()` or `close()` to finalize.

## Usage

### Server

```ts
import { Mppx } from 'mppx/server'
import { abstract } from '@abstract-foundation/mpp/server'
import { privateKeyToAccount } from 'viem/accounts'

const mppx = Mppx.create({
  methods: [
    abstract.charge({
      account: privateKeyToAccount(process.env.SERVER_PRIVATE_KEY),
      recipient: '0xYourRecipientAddress',
      amount: '0.01',
      testnet: true,
    }),
    abstract.session({
      account: privateKeyToAccount(process.env.SERVER_PRIVATE_KEY),
      recipient: '0xYourRecipientAddress',
      amount: '0.001',
      suggestedDeposit: '1',
      testnet: true,
    }),
  ],
  secretKey: process.env.MPP_SECRET_KEY,
})
```

### Client

```ts
import { abstractCharge, abstractSession } from '@abstract-foundation/mpp/client'
import { privateKeyToAccount } from 'viem/accounts'

const account = privateKeyToAccount('0x...')

const charge = abstractCharge({ account })
const session = abstractSession({ account, deposit: '10' })
```

Both return `mppx` method objects that plug directly into the `mppx` client.

## Exports

| Entry point | Description |
|---|---|
| `@abstract-foundation/mpp` | All exports (client + server + constants) |
| `@abstract-foundation/mpp/client` | Client-side charge and session methods |
| `@abstract-foundation/mpp/server` | Server-side charge and session handlers |

## Chain support

| | Testnet (11124) | Mainnet (2741) |
|---|---|---|
| USDC.e | `0xbd28...008C61` | `0x84A7...987e1` |
| AbstractStreamChannel | `0x2963...0923c` | `0x2963...0923c` |

The plugin defaults to mainnet. Pass `testnet: true` on the server or let the server challenge dictate the chain on the client.

## Paymaster support

Abstract uses ZKsync-native paymasters. Pass `paymasterAddress` to sponsor gas:

```ts
abstract.charge({
  account,
  recipient: '0x...',
  amount: '0.01',
  paymasterAddress: '0xYourPaymasterContract',
})
```

## Smart wallet support

Client-side signing supports both EOA and ERC-1271 smart wallets via `viem`'s typed data signing.

## License

[MIT](./LICENSE)
