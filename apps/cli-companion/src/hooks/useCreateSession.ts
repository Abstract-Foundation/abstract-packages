'use client';

import { useCallback, useState } from 'react';
import type { Address } from 'viem';
import type { SessionBundle } from '@/lib/session-config';

export function useCreateSession() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createSession = useCallback(
    async ({
      accountAddress,
      chainId,
    }: {
      accountAddress: Address;
      chainId: number;
    }): Promise<SessionBundle> => {
      setIsPending(true);
      setError(null);

      try {
        return {
          accountAddress,
          chainId,
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
        throw new Error(message);
      } finally {
        setIsPending(false);
      }
    },
    [],
  );

  return {
    createSession,
    isPending,
    error,
  };
}
