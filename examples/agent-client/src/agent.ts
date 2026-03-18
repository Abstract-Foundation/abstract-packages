/**
 * Example: Autonomous agent that pays for API access using Abstract MPP.
 *
 * The agent uses the mppx client SDK to automatically:
 *   1. Detect a 402 Payment Required challenge from the server
 *   2. Sign an ERC-3009 authorization (charge) or open/send a voucher (session)
 *   3. Retry the request with the credential in the Authorization header
 *   4. Receive content with a Payment-Receipt confirming settlement
 *
 * Run:
 *   AGENT_PRIVATE_KEY=0x... \
 *   SERVER_URL=http://localhost:3000 \
 *   ESCROW_CONTRACT=0x... \
 *   tsx src/agent.ts
 */

import { Mppx } from 'mppx/client'
import { privateKeyToAccount } from 'viem/accounts'
import { abstractCharge, abstractSession } from 'mppx-abstract/client'

const AGENT_PRIVATE_KEY = process.env.AGENT_PRIVATE_KEY as `0x${string}` | undefined
const SERVER_URL = process.env.SERVER_URL ?? 'http://localhost:3000'
const ESCROW_CONTRACT = process.env.ESCROW_CONTRACT as `0x${string}` | undefined

if (!AGENT_PRIVATE_KEY) throw new Error('AGENT_PRIVATE_KEY required')

// ── Account ────────────────────────────────────────────────────────────────

const agentAccount = privateKeyToAccount(AGENT_PRIVATE_KEY)
console.log('Agent account:', agentAccount.address)

// ── MPP client ─────────────────────────────────────────────────────────────

const mppx = Mppx.create({
  methods: [
    // Charge method: sign ERC-3009 authorization on 402
    abstractCharge({ account: agentAccount }),

    // Session method: open payment channel, send vouchers per-request
    ...(ESCROW_CONTRACT
      ? [
          abstractSession({
            account: agentAccount,
            deposit: '5', // pre-fund 5 USDC.e into the channel
            escrowContract: ESCROW_CONTRACT,
          }),
        ]
      : []),
  ],
})

// ── Demo: Charge request ───────────────────────────────────────────────────

async function demoCharge() {
  console.log('\n── Charge demo ────────────────────────────────────────')
  console.log(`Fetching ${SERVER_URL}/api/data (0.01 USDC.e charge)...`)

  // mppx.fetch() automatically handles the 402 → sign → retry flow
  const response = await mppx.fetch(`${SERVER_URL}/api/data`)

  if (!response.ok) {
    console.error('Request failed:', response.status, await response.text())
    return
  }

  const receipt = response.headers.get('Payment-Receipt')
  const body = await response.json()

  console.log('✅ Response:', JSON.stringify(body, null, 2))
  if (receipt) {
    console.log('🧾 Payment-Receipt:', receipt)
  }
}

// ── Demo: Session requests ──────────────────────────────────────────────────

async function demoSession() {
  if (!ESCROW_CONTRACT) {
    console.log('\nSkipping session demo (ESCROW_CONTRACT not set)')
    return
  }

  console.log('\n── Session demo ────────────────────────────────────────')
  console.log('Opening payment channel and sending 3 requests...')

  for (let i = 1; i <= 3; i++) {
    console.log(`\nRequest ${i}: ${SERVER_URL}/api/stream (0.001 USDC.e)`)

    const response = await mppx.fetch(`${SERVER_URL}/api/stream`)

    if (!response.ok) {
      console.error(`Request ${i} failed:`, response.status, await response.text())
      continue
    }

    const receipt = response.headers.get('Payment-Receipt')
    const body = await response.json()

    console.log(`  ✅ Response:`, JSON.stringify(body))
    if (receipt) {
      try {
        const parsed = JSON.parse(
          Buffer.from(receipt.replace('Payment ', ''), 'base64url').toString(),
        )
        console.log(`  🧾 Cumulative paid: ${parsed.acceptedCumulative} (${i} unit(s))`)
      } catch {
        console.log(`  🧾 Receipt: ${receipt}`)
      }
    }
  }
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  try {
    await demoCharge()
    await demoSession()
    console.log('\n✅ Demo complete')
  } catch (err) {
    console.error('Error:', err)
    process.exit(1)
  }
}

main()
