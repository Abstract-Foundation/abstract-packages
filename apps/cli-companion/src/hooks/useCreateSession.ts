'use client';

import { useAbstractClient } from '@abstract-foundation/agw-react';
import { useCallback, useState } from 'react';
import type { Address } from 'viem';
import type { Chain } from 'viem/chains';
import { toSdkSessionConfig } from '@/lib/session-config';
import type { PolicyPreview } from '@/lib/policy-types';

export function useCreateSession(chain: Chain) {
  const { data: abstractClient, isLoading: isClientLoading } = useAbstractClient();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createSession = useCallback(
    async ({
      accountAddress,
      signerAddress,
      policyPayload,
    }: {
      accountAddress: Address;
      signerAddress: Address;
      policyPayload: PolicyPreview['policyPayload'];
    }) => {
      if (!abstractClient) {
        throw new Error('Abstract client is not ready yet.');
      }

      setIsPending(true);
      setError(null);

      try {
        const sdkSessionConfig = toSdkSessionConfig(signerAddress, policyPayload);

        const result = await abstractClient.createSession({
          session: sdkSessionConfig,
          account: accountAddress,
          chain,
        });

        return {
          transactionHash: result.transactionHash,
          sessionConfig: result.session,
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
        throw new Error(message);
      } finally {
        setIsPending(false);
      }
    },
    [abstractClient, chain],
  );

  return {
    createSession,
    isClientReady: Boolean(abstractClient),
    isClientLoading,
    isPending,
    error,
  };
}
