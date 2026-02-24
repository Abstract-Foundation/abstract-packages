'use client';

import SessionWizard from '@/components/SessionWizard';
import { resolveChain, type SupportedChainId } from '@/lib/chains';
import AbstractProvider from '@/providers/AbstractProvider';

export default function SessionFlowClient({
  callbackUrl,
  chainId,
}: {
  callbackUrl: string;
  chainId: SupportedChainId;
}) {
  const chain = resolveChain(chainId);

  return (
    <AbstractProvider chain={chain}>
      <SessionWizard callbackUrl={callbackUrl} chain={chain} />
    </AbstractProvider>
  );
}
