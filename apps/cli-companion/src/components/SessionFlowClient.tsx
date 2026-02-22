'use client';

import SessionWizard from '@/components/SessionWizard';
import { resolveChain, type SupportedChainId } from '@/lib/chains';
import AbstractProvider from '@/providers/AbstractProvider';

export default function SessionFlowClient({
  callbackUrl,
  chainId,
  signerAddress,
}: {
  callbackUrl: string;
  chainId: SupportedChainId;
  signerAddress: `0x${string}`;
}) {
  const chain = resolveChain(chainId);

  return (
    <AbstractProvider chain={chain}>
      <SessionWizard callbackUrl={callbackUrl} chain={chain} signerAddress={signerAddress} />
    </AbstractProvider>
  );
}
