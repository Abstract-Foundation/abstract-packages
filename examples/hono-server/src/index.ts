/**
 * Example: Hono server with Abstract MPP payments.
 *
 * Exposes two paid endpoints:
 *   GET /api/data     — charges 0.01 USDC.e per request (ERC-3009, one-shot)
 *   GET /api/stream   — charges 0.001 USDC.e per request (session channel)
 *
 * Run:
 *   MPP_SECRET_KEY=your-secret \
 *   SERVER_PRIVATE_KEY=0x... \
 *   PAY_TO=0x... \
 *   ESCROW_CONTRACT=0x... \
 *   tsx src/index.ts
 */

import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { Mppx, payment } from 'mppx/hono'
import { privateKeyToAccount } from 'viem/accounts'
import { abstract } from 'mppx-abstract/server'
import { USDC_E_TESTNET } from 'mppx-abstract'

// ── Config ─────────────────────────────────────────────────────────────────

const SECRET_KEY = process.env.MPP_SECRET_KEY
const SERVER_PRIVATE_KEY = process.env.SERVER_PRIVATE_KEY as `0x${string}` | undefined
const PAY_TO = process.env.PAY_TO as `0x${string}` | undefined
const ESCROW_CONTRACT = process.env.ESCROW_CONTRACT as `0x${string}` | undefined
const PORT = Number(process.env.PORT ?? 3000)

if (!SECRET_KEY) throw new Error('MPP_SECRET_KEY required')
if (!SERVER_PRIVATE_KEY) throw new Error('SERVER_PRIVATE_KEY required')
if (!PAY_TO) throw new Error('PAY_TO required')

// ── Account ────────────────────────────────────────────────────────────────

const serverAccount = privateKeyToAccount(SERVER_PRIVATE_KEY)
console.log('Server account:', serverAccount.address)

// ── MPP setup ──────────────────────────────────────────────────────────────

const mppx = Mppx.create({
  realm: 'example.abs.xyz',
  secretKey: SECRET_KEY,
  methods: [
    // Charge: one-time ERC-3009 authorization per request
    abstract.charge({
      account: serverAccount,
      recipient: PAY_TO,
      currency: USDC_E_TESTNET,
      amount: '0.01',
      decimals: 6,
      testnet: true,
      // Optionally sponsor gas with a paymaster:
      // paymasterAddress: process.env.PAYMASTER as `0x${string}`,
    }),

    // Session: payment channel backed by AbstractStreamChannel
    ...(ESCROW_CONTRACT
      ? [
          abstract.session({
            account: serverAccount,
            recipient: PAY_TO,
            currency: USDC_E_TESTNET,
            escrowContract: ESCROW_CONTRACT,
            amount: '0.001',
            suggestedDeposit: '1',
            unitType: 'request',
            decimals: 6,
            testnet: true,
          }),
        ]
      : []),
  ],
})

// ── Routes ─────────────────────────────────────────────────────────────────

const app = new Hono()

// Free health check
app.get('/health', (c) => c.json({ ok: true }))

// Paid: one-time ERC-3009 charge
app.get(
  '/api/data',
  payment(mppx.charge, {
    amount: '0.01',
    currency: USDC_E_TESTNET,
    decimals: 6,
    recipient: PAY_TO,
    description: 'Premium data — 0.01 USDC.e',
  }),
  (c) =>
    c.json({
      data: 'Here is your premium content!',
      timestamp: new Date().toISOString(),
      block: 'Abstract Testnet',
    }),
)

// Paid: session channel (lower per-request cost via vouchers)
app.get(
  '/api/stream',
  ...(ESCROW_CONTRACT
    ? [
        payment(mppx.session, {
          amount: '0.001',
          currency: USDC_E_TESTNET,
          decimals: 6,
          recipient: PAY_TO,
          escrowContract: ESCROW_CONTRACT,
          unitType: 'request',
          suggestedDeposit: '1',
          description: 'Streaming data — 0.001 USDC.e / request',
        }),
      ]
    : []),
  (c) =>
    c.json({
      stream: 'Streaming content via payment channel',
      timestamp: new Date().toISOString(),
    }),
)

// ── Start ───────────────────────────────────────────────────────────────────

serve({ fetch: app.fetch, port: PORT }, () => {
  console.log(`\n🚀 MPP Abstract example server running on http://localhost:${PORT}`)
  console.log(`   GET /health        — free`)
  console.log(`   GET /api/data      — 0.01 USDC.e (charge / ERC-3009)`)
  if (ESCROW_CONTRACT) {
    console.log(`   GET /api/stream    — 0.001 USDC.e (session / payment channel)`)
  }
  console.log(`\n   Testnet chain: Abstract Testnet (chainId 11124)`)
  console.log(`   Token:         USDC.e ${USDC_E_TESTNET}`)
})
