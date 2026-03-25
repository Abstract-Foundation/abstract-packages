import { Mppx } from 'mppx/server'
import { payment } from 'mppx/nextjs'
import { abstract } from '@abstract-foundation/mpp/server'
import { privateKeyToAccount } from 'viem/accounts'
import {
  USDC_E_TESTNET,
  CHARGE_AMOUNT,
  SESSION_AMOUNT,
  SESSION_DEPOSIT,
} from './constants'

const FACTS = [
  'Abstract is built on ZKsync technology, using zero-knowledge proofs for scalability.',
  'MPP stands for Machine Payments Protocol — HTTP-native paid APIs.',
  'ERC-3009 allows gasless token transfers via signed authorizations.',
  'Payment channels let you make many micro-payments with only one on-chain transaction.',
  'The 402 HTTP status code was reserved for "Payment Required" since 1999.',
  'Abstract uses USDC.e as its primary stablecoin with 6 decimal places.',
]

let _mppx: ReturnType<typeof Mppx.create> | null = null

function getMppx() {
  if (_mppx) return _mppx

  const SECRET_KEY = process.env.MPP_SECRET_KEY
  const SERVER_PRIVATE_KEY = process.env.SERVER_PRIVATE_KEY as `0x${string}` | undefined
  const PAY_TO = process.env.NEXT_PUBLIC_PAY_TO as `0x${string}` | undefined
  const PAYMASTER_ADDRESS = process.env.PAYMASTER_ADDRESS as `0x${string}` | undefined
  if (!SECRET_KEY) throw new Error('MPP_SECRET_KEY required')
  if (!SERVER_PRIVATE_KEY) throw new Error('SERVER_PRIVATE_KEY required')
  if (!PAY_TO) throw new Error('NEXT_PUBLIC_PAY_TO required')
  if (!PAYMASTER_ADDRESS) throw new Error('PAYMASTER_ADDRESS required')

  const serverAccount = privateKeyToAccount(SERVER_PRIVATE_KEY)

  const chargeMethods = [
    abstract.charge({
      account: serverAccount,
      recipient: PAY_TO,
      currency: USDC_E_TESTNET,
      amount: CHARGE_AMOUNT,
      decimals: 6,
      testnet: true,
      paymasterAddress: PAYMASTER_ADDRESS,
      paymasterInput: '0x',
    }),
  ]

  const sessionMethods = [
    abstract.session({
      account: serverAccount,
      recipient: PAY_TO,
      currency: USDC_E_TESTNET,
      amount: SESSION_AMOUNT,
      suggestedDeposit: SESSION_DEPOSIT,
      unitType: 'request',
      decimals: 6,
      testnet: true,
      paymasterAddress: PAYMASTER_ADDRESS,
      paymasterInput: '0x',
    }),
  ]

  _mppx = Mppx.create({
    realm: 'mpp-demo.abs.xyz',
    secretKey: SECRET_KEY,
    methods: [...chargeMethods, ...sessionMethods],
  })

  return _mppx
}

function getEnv(key: string): string {
  const val = process.env[key]
  if (!val) throw new Error(`${key} required`)
  return val
}

export function chargeHandler(request: Request) {
  const handler = payment(
    (getMppx() as Record<string, unknown>)['abstract/charge'] as Parameters<typeof payment>[0],
    {
      amount: CHARGE_AMOUNT,
      currency: USDC_E_TESTNET,
      decimals: 6,
      recipient: getEnv('NEXT_PUBLIC_PAY_TO') as `0x${string}`,
      description: `Premium data — ${CHARGE_AMOUNT} USDC.e`,
    },
    () =>
      Response.json({
        message: 'Payment successful!',
        timestamp: new Date().toISOString(),
        fact: FACTS[Math.floor(Math.random() * FACTS.length)],
        intent: 'charge',
        chain: 'Abstract Testnet',
      }),
  )

  return handler(request)
}

export function sessionHandler(request: Request) {
  const handler = payment(
    (getMppx() as Record<string, unknown>)['abstract/session'] as Parameters<typeof payment>[0],
    {
      amount: SESSION_AMOUNT,
      currency: USDC_E_TESTNET,
      decimals: 6,
      recipient: getEnv('NEXT_PUBLIC_PAY_TO') as `0x${string}`,
      unitType: 'request',
      suggestedDeposit: SESSION_DEPOSIT,
      description: `Streaming data — ${SESSION_AMOUNT} USDC.e per request`,
    },
    () =>
      Response.json({
        message: 'Session payment accepted!',
        timestamp: new Date().toISOString(),
        fact: FACTS[Math.floor(Math.random() * FACTS.length)],
        intent: 'session',
        chain: 'Abstract Testnet',
      }),
  )

  return handler(request)
}
