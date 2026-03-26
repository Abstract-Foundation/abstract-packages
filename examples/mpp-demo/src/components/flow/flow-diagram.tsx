'use client'

import { useState } from 'react'

interface Step {
  from: number
  to: number
  label: string
  sublabel?: string
  tooltip: string
}

const CHARGE_STEPS: Step[] = [
  {
    from: 0,
    to: 1,
    label: 'GET /api/charge',
    tooltip:
      'Client sends a standard HTTP request to the paid endpoint — no special headers required.',
  },
  {
    from: 1,
    to: 0,
    label: '402 Payment Required',
    sublabel: 'WWW-Authenticate',
    tooltip:
      'Server responds with 402 and a WWW-Authenticate header containing the payment challenge: method, amount, currency, and recipient.',
  },
  {
    from: 0,
    to: 0,
    label: 'Sign ERC-3009',
    sublabel: 'TransferWithAuthorization',
    tooltip:
      'Client wallet signs an EIP-3009 TransferWithAuthorization message, authorizing the exact payment without sending a transaction.',
  },
  {
    from: 0,
    to: 1,
    label: 'Retry with credential',
    sublabel: 'Authorization header',
    tooltip:
      'Client retries the request with the signed credential in the Authorization header.',
  },
  {
    from: 1,
    to: 2,
    label: 'Settle on-chain',
    sublabel: 'transferWithAuthorization tx',
    tooltip:
      'Server broadcasts the transferWithAuthorization call on-chain, executing the USDC.e transfer from the payer to the recipient.',
  },
  {
    from: 1,
    to: 0,
    label: '200 OK + data',
    sublabel: 'Payment-Receipt',
    tooltip:
      'Server returns the paid content along with a Payment-Receipt header containing the settlement tx hash.',
  },
]

const SESSION_FIRST_STEPS: Step[] = [
  {
    from: 0,
    to: 1,
    label: 'GET /api/session',
    tooltip: 'Client sends a request to the session-priced endpoint.',
  },
  {
    from: 1,
    to: 0,
    label: '402 Payment Required',
    sublabel: 'WWW-Authenticate',
    tooltip:
      'Server responds 402 with session payment details: escrow contract, per-request amount, and suggested deposit.',
  },
  {
    from: 0,
    to: 2,
    label: 'Open channel',
    sublabel: 'approve + open tx',
    tooltip:
      'Client approves the ERC-20 and calls open() on the escrow contract, depositing tokens into the payment channel.',
  },
  {
    from: 0,
    to: 0,
    label: 'Sign voucher',
    sublabel: 'EIP-712 cumulative amount',
    tooltip:
      'Client signs an EIP-712 voucher for the cumulative amount owed so far. No on-chain transaction — just a signature.',
  },
  {
    from: 0,
    to: 1,
    label: 'Retry with voucher',
    sublabel: 'Authorization header',
    tooltip:
      'Client retries with the signed voucher credential in the Authorization header.',
  },
  {
    from: 1,
    to: 0,
    label: '200 OK + data',
    sublabel: 'Payment-Receipt',
    tooltip:
      'Server verifies the voucher, stores the highest cumulative amount, and returns the content.',
  },
]

const SESSION_SUBSEQUENT_STEPS: Step[] = [
  {
    from: 0,
    to: 1,
    label: 'GET /api/session',
    tooltip: 'Client sends another request to the session endpoint.',
  },
  {
    from: 1,
    to: 0,
    label: '402 Payment Required',
    sublabel: 'WWW-Authenticate',
    tooltip: 'Server responds 402 with a fresh challenge.',
  },
  {
    from: 0,
    to: 0,
    label: 'Sign voucher',
    sublabel: 'cumulative += amount',
    tooltip:
      'Client increments the cumulative total and signs a new EIP-712 voucher. No on-chain tx — just off-chain signing.',
  },
  {
    from: 0,
    to: 1,
    label: 'Retry with voucher',
    sublabel: 'Authorization header',
    tooltip: 'Client sends the new voucher in the Authorization header.',
  },
  {
    from: 1,
    to: 0,
    label: '200 OK + data',
    sublabel: 'Payment-Receipt',
    tooltip:
      'Server accepts the voucher (highest cumulative wins) and returns content.',
  },
]

const ACTORS = ['Client', 'Server', 'Blockchain']
const COL_CENTER = [16.67, 50, 83.33]

type FlowTab = 'charge' | 'session-first' | 'session-next'

export function FlowDiagram() {
  const [activeTab, setActiveTab] = useState<FlowTab>('charge')
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  const steps =
    activeTab === 'charge'
      ? CHARGE_STEPS
      : activeTab === 'session-first'
        ? SESSION_FIRST_STEPS
        : SESSION_SUBSEQUENT_STEPS

  return (
    <div className="relative w-full lg:flex">
      <div className="bg-white/5 border border-white/10 rounded-lg p-4 sm:p-6 backdrop-blur-sm w-full h-full">
        <h2 className="text-lg font-semibold font-mono text-accent mb-4">
          Protocol Flow
        </h2>

        {/* Flow tabs */}
        <div className="flex rounded-lg overflow-hidden border border-white/10 mb-5 text-[11px] font-mono">
          <TabButton
            active={activeTab === 'charge'}
            onClick={() => {
              setActiveTab('charge')
              setHoveredIdx(null)
            }}
            label="Charge"
          />
          <TabButton
            active={activeTab === 'session-first'}
            onClick={() => {
              setActiveTab('session-first')
              setHoveredIdx(null)
            }}
            label="Session (1st)"
          />
          <TabButton
            active={activeTab === 'session-next'}
            onClick={() => {
              setActiveTab('session-next')
              setHoveredIdx(null)
            }}
            label="Session (2nd+)"
          />
        </div>

        {/* Actors */}
        <div className="pl-9">
          <div className="grid grid-cols-3 gap-4 mb-2">
            {ACTORS.map((actor) => (
              <div key={actor} className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg border border-white/20 bg-white/5 flex items-center justify-center">
                  <span className="text-gray-500 text-xs font-mono">
                    {actor[0]}
                  </span>
                </div>
                <span className="text-[10px] sm:text-xs font-mono text-gray-400">
                  {actor}
                </span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 mb-1">
            {ACTORS.map((a) => (
              <div key={a} className="flex justify-center">
                <div className="w-px h-3 bg-white/10" />
              </div>
            ))}
          </div>
        </div>

        {/* Steps */}
        <div className="flex flex-col">
          {steps.map((step, i) => {
            const isHovered = hoveredIdx === i

            const lineColor = isHovered ? 'bg-accent' : 'bg-white/10'
            const textColor = isHovered ? 'text-accent' : 'text-gray-400'
            const subColor = isHovered ? 'text-accent/60' : 'text-gray-600'
            const numColor = isHovered ? 'text-accent' : 'text-gray-600'
            const arrowColor = isHovered ? '#00ff00' : 'rgba(255,255,255,0.1)'

            const isSelf = step.from === step.to
            const fromPct = COL_CENTER[step.from]
            const toPct = COL_CENTER[step.to]
            const leftPct = Math.min(fromPct, toPct)
            const rightPct = Math.max(fromPct, toPct)
            const goesRight = step.to > step.from

            return (
              <div
                key={`${step.label}-${i}`}
                className="flex items-center transition-all duration-200 cursor-default opacity-60 hover:opacity-100"
                style={{ height: 52 }}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                <span
                  className={`w-6 shrink-0 text-sm font-mono text-right mr-3 ${numColor}`}
                >
                  {i + 1}
                </span>

                <div className="relative flex-1 h-full">
                  {isHovered && (
                    <div className="absolute inset-0 bg-white/[0.03] rounded-md pointer-events-none" />
                  )}

                  {isSelf ? (
                    <div
                      className="absolute top-0 bottom-0 flex items-center"
                      style={{ left: `${fromPct - 15}%` }}
                    >
                      <div
                        className={`rounded px-2.5 py-1 border transition-colors duration-200 ${
                          isHovered
                            ? 'bg-accent/10 border-accent/30'
                            : 'bg-transparent border-white/5'
                        }`}
                      >
                        <span
                          className={`text-[10px] sm:text-[11px] font-sans block text-center whitespace-nowrap ${textColor}`}
                        >
                          {step.label}
                        </span>
                        {step.sublabel && (
                          <span
                            className={`text-[9px] sm:text-[10px] font-sans block text-center whitespace-nowrap ${subColor}`}
                          >
                            {step.sublabel}
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div
                      className="absolute top-0 bottom-0 flex flex-col justify-center"
                      style={{
                        left: `${leftPct}%`,
                        width: `${rightPct - leftPct}%`,
                      }}
                    >
                      <span
                        className={`text-[10px] sm:text-[11px] font-sans text-center whitespace-nowrap ${textColor} mb-0.5`}
                      >
                        {step.label}
                      </span>

                      <div className="flex items-center w-full">
                        {!goesRight && (
                          <svg
                            width="7"
                            height="10"
                            viewBox="0 0 7 10"
                            className="shrink-0"
                          >
                            <polygon
                              points="7,0 0,5 7,10"
                              fill={arrowColor}
                            />
                          </svg>
                        )}
                        <div className={`h-px flex-1 ${lineColor}`} />
                        {goesRight && (
                          <svg
                            width="7"
                            height="10"
                            viewBox="0 0 7 10"
                            className="shrink-0"
                          >
                            <polygon
                              points="0,0 7,5 0,10"
                              fill={arrowColor}
                            />
                          </svg>
                        )}
                      </div>

                      {step.sublabel && (
                        <span
                          className={`text-[9px] sm:text-[10px] font-sans text-center whitespace-nowrap ${subColor} mt-0.5`}
                        >
                          {step.sublabel}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Tooltip */}
      {hoveredIdx !== null && (
        <div className="absolute left-0 right-0 top-full mt-2 z-30 pointer-events-none">
          <div className="bg-black/90 border border-accent/20 rounded-lg p-3 animate-fade-in-up backdrop-blur-sm">
            <div className="flex items-start gap-2.5">
              <span className="text-accent text-xs font-mono shrink-0 pt-px">
                Step {hoveredIdx + 1}
              </span>
              <p className="text-xs leading-relaxed text-gray-300 font-sans">
                {steps[hoveredIdx].tooltip}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function TabButton({
  active,
  onClick,
  label,
}: {
  active: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      className={`flex-1 py-1.5 transition-colors ${
        active
          ? 'bg-accent/20 text-accent'
          : 'bg-white/5 text-gray-400 hover:bg-white/10'
      }`}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  )
}
