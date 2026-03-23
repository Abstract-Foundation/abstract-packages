'use client';

import { useCallback, useState } from 'react';
import type { Address } from 'viem';
import { useSessionSigners } from '@privy-io/react-auth';
import type { ProvisionedSignerResult } from '@/lib/session-config';

export interface CreateAgentSignerInput {
  agwAccountAddress: Address;
  signerAddress: Address;
  chainId: number;
  authPublicKey: string;
  callbackUrl: string;
}

export function useCreateAgentSigner() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addSessionSigners } = useSessionSigners();

  const createAgentSigner = useCallback(
    async ({
      agwAccountAddress,
      signerAddress,
      chainId,
      authPublicKey,
      callbackUrl,
    }: CreateAgentSignerInput): Promise<{ redirectUrl: string; provisionedSigner: ProvisionedSignerResult }> => {
      setIsPending(true);
      setError(null);

      try {
        const provisionResponse = await fetch('/api/session/provision', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            agwAccountAddress,
            signerAddress,
            chainId,
            authPublicKey,
          }),
        });
        const provisionBody = (await provisionResponse.json()) as ProvisionedSignerResult & { error?: string };
        if (!provisionResponse.ok) {
          throw new Error(provisionBody.error ?? 'Failed to provision AGW MCP signer.');
        }

        await addSessionSigners({
          address: signerAddress,
          signers: [
            {
              signerId: provisionBody.signerId,
              policyIds: provisionBody.policyIds,
            },
          ],
        });

        const finalizeResponse = await fetch('/api/session/finalize-init', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            callbackUrl,
            provisionAttestation: provisionBody.provisionAttestation,
          }),
        });
        const finalized = (await finalizeResponse.json()) as { redirectUrl?: string; error?: string };
        if (!finalizeResponse.ok || !finalized.redirectUrl) {
          throw new Error(finalized.error ?? 'Failed to finalize AGW MCP signer provisioning.');
        }

        return {
          redirectUrl: finalized.redirectUrl,
          provisionedSigner: provisionBody,
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
        throw new Error(message);
      } finally {
        setIsPending(false);
      }
    },
    [addSessionSigners],
  );

  return {
    createAgentSigner,
    isPending,
    error,
  };
}
