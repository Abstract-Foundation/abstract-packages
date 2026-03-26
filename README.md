# mpp-abstract

**Machine Payments Protocol (MPP) implementation for Abstract chain.**

Custom `mppx` payment method plugin that settles on Abstract using standard
ERC-20 / ERC-3009 — no TIP-20 tokens or Tempo-specific infrastructure required.

Implements two payment intents:

| Intent | Mechanism | Settlement |
|--------|-----------|------------|
| `charge` | ERC-3009 `TransferWithAuthorization` | Client signs, server broadcasts |
| `session` | `AbstractStreamChannel` escrow + EIP-712 vouchers | Cumulative off-chain, final on-chain |

---

## Architecture

```mermaid
sequenceDiagram
    participant Client
    participant Server

    Client->>Server: GET resource
    Server-->>Client: 402 payment required
    Note over Client: Receive payment challenge
    Note over Client: Sign payment authorization
    Client->>Server: Retry request with payment proof
    Note over Server: Verify proof and settle payment
    Server-->>Client: 200 OK with receipt
```

```mermaid
flowchart TD
    root["mpp-abstract/"]
    root --> packages["packages/"]
    root --> examples["examples/"]
    packages --> contracts["contracts/<br/>Solidity: AbstractStreamChannel.sol"]
    packages --> plugin["mppx-abstract/<br/>TypeScript plugin (client + server)"]
    examples --> hono["hono-server/<br/>Hono server with paid routes"]
    examples --> agent["agent-client/<br/>Autonomous agent that pays on-demand"]
```

---

## How Charge Works (ERC-3009)

```mermaid
sequenceDiagram
    participant Client
    participant Chain
    participant Server

    Server-->>Client: 402 challenge
    Note over Client: Sign TransferWithAuthorization data
    Client->>Server: Send payment authorization
    Note over Server: Recover address and verify nonce
    Server->>Chain: Call transferWithAuthorization
    Note over Server: Pay gas directly or via paymaster
    Server-->>Client: 200 with receipt
```

Key properties:
- **No client transaction** — client only signs typed data (gasless for payer)
- **Server broadcasts** the `transferWithAuthorization` call
- **Replay protection** — each authorization has a unique `nonce`
- **Expiry** — `validBefore` timestamp prevents stale authorizations

---

## How Session Works (Payment Channels)

```mermaid
sequenceDiagram
    participant Client
    participant Channel
    participant Server

    Client->>Channel: Open channel and escrow deposit
    Client->>Server: Send open authorization
    Note over Server: Verify open transaction and voucher
    Server-->>Client: 200 with receipt
    loop For each subsequent request
        Client->>Server: Send updated voucher
        Note over Server: Verify EIP 712 signature and accept voucher
        Server-->>Client: 200 with receipt
    end
    Client->>Server: Send close authorization
    Server->>Channel: Close channel
    Note over Server: Verify final voucher and refund remainder
    Server-->>Client: 204
```

Key properties:
- **Single on-chain open** amortizes gas across many requests
- **Off-chain vouchers** — only signatures exchanged per request
- **Cumulative accounting** — server tracks highest accepted voucher
- **Server-initiated close** — server calls `close()` with final voucher
- **Payer-initiated escape** — `requestClose()` + grace period + `withdraw()`

---

## Gas Sponsorship: Tempo vs Abstract

| | Tempo | Abstract |
|---|---|---|
| **Mechanism** | Hosted fee-payer service (`feePayerUrl`) | Native ZKsync paymaster (`paymasterParams`) |
| **Infrastructure** | Separate HTTP service to sign & broadcast | Just a contract address in the tx |
| **Config** | `feePayerUrl: 'https://feepayer.example.com'` | `paymasterAddress: '0x...'` |
| **Transaction type** | Tempo TIP-20 tx with `feePayer` flag | ZKsync EIP-712 tx with `customData` |
| **Dependencies** | Requires running & securing a service | Contract deployed on Abstract |

When `paymasterAddress` is set, the server includes:

```ts
customData: {
  paymasterParams: {
    paymaster: paymasterAddress,
    paymasterInput: '0x',
  },
}
```

No additional infrastructure needed — Abstract's native AA handles the rest.

---

## Contract Deployment

### Prerequisites

```bash
cd packages/contracts
forge install
```

### Test (standard Foundry — no zksolc required)

```bash
forge test -v
# 17 tests, all pass
```

### Deploy to Abstract Testnet

> **Note:** Abstract uses the ZKsync VM. For actual on-chain deployment you need
> `foundry-zksync` or the `hardhat-zksync` toolchain. The standard `forge build`
> compiles contracts for testing purposes.

```bash
# Install foundry-zksync
curl -L https://raw.githubusercontent.com/matter-labs/foundry-zksync/main/install-foundry-zksync | bash

# Set env
export ABSTRACT_TESTNET_RPC=https://api.testnet.abs.xyz
export DEPLOYER_PRIVATE_KEY=0x...

# Deploy
forge script script/Deploy.s.sol \
  --rpc-url abstract_testnet \
  --broadcast \
  --private-key $DEPLOYER_PRIVATE_KEY \
  --zksync
```

### Deployed addresses

| Network | AbstractStreamChannel |
|---------|-----------------------|
| Testnet (11124) | _Deploy and set here_ |
| Mainnet (2741) | _Deploy and set here_ |

---

## Using the Plugin

### Installation

```bash
npm install mppx mppx-abstract viem
```

### Server (Hono)

```ts
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { Mppx, payment } from 'mppx/hono'
import { privateKeyToAccount } from 'viem/accounts'
import { abstract } from 'mppx-abstract/server'
import { USDC_E_TESTNET } from 'mppx-abstract'

const serverAccount = privateKeyToAccount(process.env.SERVER_PRIVATE_KEY as `0x${string}`)

const mppx = Mppx.create({
  realm: 'api.myapp.xyz',
  secretKey: process.env.MPP_SECRET_KEY!,
  methods: [
    abstract.charge({
      account: serverAccount,
      recipient: '0xYourRecipient',
      currency: USDC_E_TESTNET,
      amount: '0.01',
      decimals: 6,
      testnet: true,
      // Optional: sponsor gas via Abstract paymaster
      paymasterAddress: '0xYourPaymaster',
    }),
    abstract.session({
      account: serverAccount,
      recipient: '0xYourRecipient',
      currency: USDC_E_TESTNET,
      amount: '0.001',
      suggestedDeposit: '1',
      unitType: 'request',
      testnet: true,
    }),
  ],
})

const app = new Hono()

// One-time payment per request
app.get('/api/data',
  payment(mppx.charge, { amount: '0.01', currency: USDC_E_TESTNET, decimals: 6, recipient: '0x...' }),
  (c) => c.json({ data: 'premium content' }),
)

// Payment channel — lower cost per request
app.get('/api/stream',
  payment(mppx.session, {
    amount: '0.001',
    currency: USDC_E_TESTNET,
    decimals: 6,
    recipient: '0x...',
    unitType: 'request',
    suggestedDeposit: '1',
  }),
  (c) => c.json({ stream: 'streaming content' }),
)

serve({ fetch: app.fetch, port: 3000 })
```

### Client (autonomous agent)

```ts
import { Mppx } from 'mppx/client'
import { privateKeyToAccount } from 'viem/accounts'
import { abstractCharge, abstractSession } from 'mppx-abstract/client'

const account = privateKeyToAccount(process.env.AGENT_PRIVATE_KEY as `0x${string}`)

const mppx = Mppx.create({
  methods: [
    // Sign ERC-3009 authorizations for charge requests
    abstractCharge({ account }),

    // Open payment channel, send vouchers for session requests
    abstractSession({
      account,
      deposit: '5', // pre-fund 5 USDC.e
    }),
  ],
})

// Automatically handles 402 → sign → retry
const response = await mppx.fetch('https://api.myapp.xyz/api/data')
const data = await response.json()
console.log('Receipt:', response.headers.get('Payment-Receipt'))
```

---

## Getting Testnet Tokens

USDC.e on Abstract Testnet supports minting via the Open Minter contract:

```ts
import { createWalletClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { writeContract } from 'viem/actions'
const OPEN_MINTER_TESTNET = '0x86C3FA1c8d7dcDebAC1194531d080e6e6fF9afF5'

const account = privateKeyToAccount('0x...')
const client = createWalletClient({
  account,
  chain: { id: 11124, name: 'Abstract Testnet', nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 }, rpcUrls: { default: { http: ['https://api.testnet.abs.xyz'] } } },
  transport: http('https://api.testnet.abs.xyz'),
})

// Mint 100 USDC.e to your address
await writeContract(client, {
  account,
  address: OPEN_MINTER_TESTNET,
  abi: [{ name: 'mint', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [] }],
  functionName: 'mint',
  args: [account.address, 100_000_000n], // 100 USDC.e (6 decimals)
  chain: null,
})
```

---

## Quickstart

```bash
# 1. Clone and install
git clone https://github.com/spectra-the-bot/mpp-abstract
cd mpp-abstract
npm install

# 2. Build the plugin
cd packages/mppx-abstract && npx tsc

# 3. Run contract tests
cd packages/contracts && forge test -v

# 4. Run the example server
cd examples/hono-server
MPP_SECRET_KEY=dev-secret \
SERVER_PRIVATE_KEY=0x... \
PAY_TO=0x... \
tsx src/index.ts

# 5. Run the agent client (in another terminal)
cd examples/agent-client
AGENT_PRIVATE_KEY=0x... \
SERVER_URL=http://localhost:3000 \
tsx src/agent.ts
```

---

## Chain Info

| | Abstract Testnet | Abstract Mainnet |
|---|---|---|
| Chain ID | 11124 | 2741 |
| RPC | `https://api.testnet.abs.xyz` | `https://api.mainnet.abs.xyz` |
| USDC.e | `0xbd28Bd5A3Ef540d1582828CE2A1a657353008C61` | `0x84A71ccD554Cc1b02749b35d22F684CC8ec987e1` |
| AbstractStreamChannel | `0x29635C384f451a72ED2e2a312BCeb8b0bDC0923c` | `0x29635C384f451a72ED2e2a312BCeb8b0bDC0923c` |
| Explorer | https://explorer.testnet.abs.xyz | https://explorer.abs.xyz |
| VM | ZKsync (native AA, FCFS sequencer) | ZKsync |

---

## Tempo vs Abstract Comparison

| Feature | Tempo | Abstract |
|---------|-------|----------|
| Token standard | TIP-20 (Tempo-specific) | ERC-20 / ERC-3009 (standard) |
| Charge mechanism | Tempo-signed tx bundle | ERC-3009 `transferWithAuthorization` |
| Escrow contract | `TempoStreamChannel` | `AbstractStreamChannel` (port) |
| Gas sponsorship | Hosted fee-payer service | Native ZKsync paymaster |
| Fee-payer infra | Separate HTTP service required | Just a contract address |
| Chain | Tempo mainnet | Abstract (ZKsync-based) |
| Method name in MPP | `"tempo"` | `"abstract"` |
| EIP-712 domain | "Tempo Stream Channel" | "Abstract Stream Channel" |

`AbstractStreamChannel.sol` is a direct port of `TempoStreamChannel.sol` with three changes:
1. `ITIP20` → `IERC20` (OpenZeppelin)
2. `TempoUtilities.isTIP20()` → `require(token != address(0))`
3. EIP-712 domain name → `"Abstract Stream Channel"`

All function signatures, events, errors, and business logic are identical.
