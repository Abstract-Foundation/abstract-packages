'use client'

import { ProtocolOverview } from '@/components/overview/protocol-overview'
import { FlowDiagram } from '@/components/flow/flow-diagram'
import { DemoPanel } from '@/components/demo/demo-panel'
import { HeaderExplainer } from '@/components/headers/header-explainer'
import { USDC_E_TESTNET, CHARGE_AMOUNT, SESSION_AMOUNT } from '@/lib/constants'

const PAY_TO = process.env.NEXT_PUBLIC_PAY_TO ?? '—'
const ESCROW_CONTRACT = process.env.NEXT_PUBLIC_ESCROW_CONTRACT

export default function Home() {
  return (
    <div className="relative grid grid-rows-[1fr_auto] min-h-screen p-6 pb-20 sm:p-12 font-mono bg-black overflow-hidden">
      <main className="relative flex flex-col items-center z-10 text-white gap-10 sm:gap-14 max-w-4xl mx-auto w-full pt-8 sm:pt-16">
        {/* Hero */}
        <div className="flex flex-col items-center gap-4 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold">
            MPP: Machine Payments Protocol
          </h1>
          <p className="text-sm text-gray-400 font-sans max-w-md">
            HTTP-native paid APIs on Abstract. Clients pay per-request via
            charge or stream micro-payments through session channels — no
            middleman, no subscriptions, just cryptographic payments.
          </p>
        </div>

        <ProtocolOverview />

        {/* Flow Diagram + Demo Panel */}
        <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
          <FlowDiagram />
          <div className="w-full lg:w-80 lg:shrink-0">
            <DemoPanel />
          </div>
        </div>

        <HeaderExplainer />

        {/* Configuration */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-5 backdrop-blur-sm w-full">
          <h2 className="text-lg font-semibold text-accent mb-3">
            Configuration
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm font-sans">
            <ConfigItem label="Network" value="Abstract Testnet (11124)" />
            <ConfigItem label="Recipient" value={PAY_TO} mono />
            <ConfigItem label="USDC.e" value={USDC_E_TESTNET} mono />
            <ConfigItem
              label="Charge Amount"
              value={`${CHARGE_AMOUNT} USDC.e`}
            />
            <ConfigItem
              label="Session Rate"
              value={`${SESSION_AMOUNT} USDC.e / request`}
            />
            {ESCROW_CONTRACT && (
              <ConfigItem
                label="Escrow Contract"
                value={ESCROW_CONTRACT}
                mono
              />
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

function ConfigItem({
  label,
  value,
  mono,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div>
      <span className="text-gray-500 text-[13px]">{label}</span>
      <p
        className={`text-gray-300 text-[13px] break-all ${mono ? 'font-mono' : ''}`}
      >
        {value}
      </p>
    </div>
  )
}
