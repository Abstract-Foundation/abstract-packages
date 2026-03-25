'use client'

import { useState, useRef, useCallback } from 'react'
import { useAccount, useWalletClient } from 'wagmi'
import { createSessionClient } from '@/lib/mpp-client'
import { SESSION_AMOUNT } from '@/lib/constants'
import type { Account, Transport, WalletClient } from 'viem'
import type { ChainEIP712 } from 'viem/zksync'


interface SessionResponse {
  message: string
  timestamp: string
  fact: string
  intent: string
  chain: string
}

interface SessionState {
  requestCount: number
  cumulativeAmount: string
  channelOpen: boolean
  responses: SessionResponse[]
}

export function SessionDemo() {
  const { address } = useAccount()
  const { data: walletClient } = useWalletClient()

  const [loading, setLoading] = useState(false)
  const [state, setState] = useState<SessionState>({
    requestCount: 0,
    cumulativeAmount: '0',
    channelOpen: false,
    responses: [],
  })
  const [error, setError] = useState<string | null>(null)

  const mppxRef = useRef<ReturnType<typeof createSessionClient> | null>(null)
  const walletRef = useRef<string | null>(null)

  const getOrCreateClient = useCallback(() => {
    if (!walletClient?.account) return null

    const walletKey = walletClient.account.address
    if (walletRef.current !== walletKey) {
      mppxRef.current = createSessionClient(
        walletClient as WalletClient<Transport, ChainEIP712, Account>,
      )
      walletRef.current = walletKey
    }

    return mppxRef.current
  }, [walletClient])

  const handleSessionRequest = async () => {
    const mppx = getOrCreateClient()
    if (!mppx) return

    setLoading(true)
    setError(null)

    try {
      const response = await mppx.fetch('/api/session')

      if (!response.ok) {
        const text = await response.text()
        throw new Error(
          `Request failed (${response.status}): ${text.slice(0, 200)}`,
        )
      }

      const data = (await response.json()) as SessionResponse
      const receipt = response.headers.get('Payment-Receipt')

      let cumulativeAmount = state.cumulativeAmount
      if (receipt) {
        try {
          const payload = receipt.startsWith('Payment ')
            ? receipt.slice('Payment '.length)
            : receipt
          const decoded = atob(
            payload.replace(/-/g, '+').replace(/_/g, '/'),
          )
          const parsed = JSON.parse(decoded)
          if (parsed.acceptedCumulative) {
            cumulativeAmount = parsed.acceptedCumulative
          }
        } catch {
          /* receipt parsing is best-effort */
        }
      }

      setState((prev) => ({
        requestCount: prev.requestCount + 1,
        cumulativeAmount,
        channelOpen: true,
        responses: [data, ...prev.responses].slice(0, 5),
      }))
    } catch (err) {
      setError(
        err instanceof Error ? err.message.split('\n')[0] : 'Unknown error',
      )
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    mppxRef.current = null
    walletRef.current = null
    setState({
      requestCount: 0,
      cumulativeAmount: '0',
      channelOpen: false,
      responses: [],
    })
    setError(null)
  }

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <p className="text-xs text-gray-500 text-center font-sans">
        Payment channel. First request opens on-chain, then sends off-chain
        vouchers.
      </p>

      {state.channelOpen && (
        <div className="flex gap-4 text-xs font-mono w-full justify-center">
          <div className="text-center">
            <span className="text-gray-500 block">Requests</span>
            <p className="text-white">{state.requestCount}</p>
          </div>
          <div className="text-center">
            <span className="text-gray-500 block">Cumulative</span>
            <p className="text-accent">{state.cumulativeAmount}</p>
          </div>
        </div>
      )}

      <div className="flex gap-2 w-full">
        <button
          className="flex-1 rounded-lg border border-accent/30 bg-accent/10 text-accent transition-colors flex items-center justify-center gap-2 hover:bg-accent/20 cursor-pointer text-sm px-5 h-10 font-sans disabled:opacity-40 disabled:cursor-not-allowed"
          onClick={handleSessionRequest}
          disabled={!address || !walletClient || loading}
          type="button"
        >
          {loading ? (
            <>
              <span className="w-3 h-3 border border-accent border-t-transparent rounded-full animate-spin" />
              {state.requestCount === 0
                ? 'Opening channel...'
                : 'Signing voucher...'}
            </>
          ) : state.requestCount === 0 ? (
            `Open Channel + Pay ${SESSION_AMOUNT}`
          ) : (
            `Send Voucher (${SESSION_AMOUNT})`
          )}
        </button>

        {state.channelOpen && (
          <button
            className="rounded-lg border border-white/20 bg-white/10 text-gray-400 transition-colors hover:bg-white/20 cursor-pointer text-xs px-3 h-10 font-sans"
            onClick={handleReset}
            type="button"
          >
            Reset
          </button>
        )}
      </div>

      {state.responses.length > 0 && (
        <div className="bg-white/5 border border-accent/20 rounded-lg p-4 w-full animate-fade-in-up">
          <p className="text-xs text-accent font-mono mb-2">
            {state.requestCount === 1 ? 'Channel opened' : 'Voucher accepted'}
          </p>
          <div className="space-y-1.5 text-sm font-sans">
            <p className="text-white">{state.responses[0].message}</p>
            <p className="text-gray-400 text-xs">{state.responses[0].fact}</p>
            <p className="text-gray-500 text-[10px] font-mono">
              {state.responses[0].timestamp}
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-3 w-full overflow-hidden">
          <p className="text-xs text-red-400 break-words">{error}</p>
        </div>
      )}
    </div>
  )
}
