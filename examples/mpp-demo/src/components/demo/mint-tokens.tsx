'use client'

import { useState } from 'react'
import { useAccount, useWaitForTransactionReceipt } from 'wagmi'
import { parseUnits } from 'viem'
import { useWriteContractSponsored } from '@abstract-foundation/agw-react'
import { getGeneralPaymasterInput } from 'viem/zksync'
import {
  OPEN_MINTER_TESTNET,
  OPEN_MINTER_ABI,
  PAYMASTER_ADDRESS,
} from '@/lib/constants'

const MINT_AMOUNT = parseUnits('5', 6)

export function MintTokens() {
  const { address } = useAccount()
  const [minted, setMinted] = useState(false)

  const {
    writeContractSponsored,
    data: hash,
    isPending,
    error,
  } = useWriteContractSponsored()

  const { isLoading: isConfirming, isSuccess } =
    useWaitForTransactionReceipt({ hash })

  const handleMint = () => {
    if (!address) return
    setMinted(false)
    writeContractSponsored({
      address: OPEN_MINTER_TESTNET,
      abi: OPEN_MINTER_ABI,
      functionName: 'mint',
      args: [address, MINT_AMOUNT],
      paymaster: PAYMASTER_ADDRESS,
      paymasterInput: getGeneralPaymasterInput({ innerInput: '0x' }),
    })
  }

  if (isSuccess && !minted) {
    setMinted(true)
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        className="rounded-lg border border-white/20 transition-colors flex items-center justify-center bg-white/10 text-white gap-2 hover:bg-white/20 cursor-pointer text-sm px-4 h-9 font-sans disabled:opacity-40 disabled:cursor-not-allowed"
        onClick={handleMint}
        disabled={!address || isPending || isConfirming}
        type="button"
      >
        {isPending
          ? 'Confirm in wallet...'
          : isConfirming
            ? 'Minting...'
            : 'Mint 5 USDC.e'}
      </button>
      {minted && (
        <p className="text-xs text-accent animate-fade-in-up">
          Minted 5 USDC.e
        </p>
      )}
      {error && (
        <p className="text-xs text-red-400 max-w-xs text-center">
          {error.message.split('\n')[0]}
        </p>
      )}
    </div>
  )
}
