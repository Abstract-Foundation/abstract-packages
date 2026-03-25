'use client'

import { Mppx } from 'mppx/client'
import { abstractCharge, abstractSession } from '@abstract-foundation/mpp/client'
import type { Account, Transport, WalletClient } from 'viem'
import type { ChainEIP712 } from 'viem/zksync'

type AgwWalletClient = WalletClient<Transport, ChainEIP712, Account>

export function createChargeClient(walletClient: AgwWalletClient) {
  return Mppx.create({
    methods: [
      abstractCharge({
        account: walletClient.account,
        getClient: () => walletClient,
      }),
    ],
  })
}

export function createSessionClient(
  walletClient: AgwWalletClient,
  options?: { onChannelOpened?: (channelId: string) => void | Promise<void> },
) {
  return Mppx.create({
    methods: [
      abstractSession({
        account: walletClient.account,
        getClient: () => walletClient,
        onChannelOpened: options?.onChannelOpened,
      }),
    ],
  })
}
