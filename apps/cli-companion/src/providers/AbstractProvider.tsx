'use client';

import { AbstractWalletProvider } from '@abstract-foundation/agw-react';
import type { Chain } from 'viem/chains';

export default function AbstractProvider({
  chain,
  children,
}: {
  chain: Chain;
  children: React.ReactNode;
}) {
  return <AbstractWalletProvider chain={chain}>{children}</AbstractWalletProvider>;
}
