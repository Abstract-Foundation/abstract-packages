'use client';

import { useEffect, useMemo } from 'react';
import { getSmartAccountAddressFromInitialSigner, isAGWAccount } from '@abstract-foundation/agw-client';
import { usePrivy } from '@privy-io/react-auth';
import { createPublicClient, http, type Address } from 'viem';
import { resolveChain, isSupportedChainId, type SupportedChainId } from '@/lib/chains';
import useSessionWizardStore from '@/stores/useSessionWizardStore';

export function useSessionWizardState() {
  const { ready, authenticated, user } = usePrivy();

  const privyWallet = user?.linkedAccounts
    .filter(account => account.type === 'wallet')
    .find(account => account.walletClientType === 'privy');
  const signerAddress = (privyWallet?.address ?? null) as `0x${string}` | null;

  const currentStep = useSessionWizardStore(state => state.currentStep);
  const chainId = useSessionWizardStore(state => state.chainId);
  const agwAddress = useSessionWizardStore(state => state.agwAddress);
  const storedSignerAddress = useSessionWizardStore(state => state.signerAddress);
  const dangerAcknowledged = useSessionWizardStore(state => state.dangerAcknowledged);
  const policyPreview = useSessionWizardStore(state => state.policyPreview);
  const error = useSessionWizardStore(state => state.error);
  const redirectUrl = useSessionWizardStore(state => state.redirectUrl);
  const provisionedSigner = useSessionWizardStore(state => state.provisionedSigner);
  const existingSigners = useSessionWizardStore(state => state.existingSigners);

  const resolutionAttempt = useSessionWizardStore(state => state.resolutionAttempt);
  const markResolving = useSessionWizardStore(state => state.markResolving);
  const syncConnection = useSessionWizardStore(state => state.syncConnection);
  const setDangerAcknowledged = useSessionWizardStore(state => state.setDangerAcknowledged);
  const setValidationError = useSessionWizardStore(state => state.setValidationError);
  const proceedToCreating = useSessionWizardStore(state => state.proceedToCreating);
  const backToPolicySelection = useSessionWizardStore(state => state.backToPolicySelection);
  const markCreationSuccess = useSessionWizardStore(state => state.markCreationSuccess);
  const markCreationError = useSessionWizardStore(state => state.markCreationError);
  const retryResolution = useSessionWizardStore(state => state.retryResolution);

  const validChainId = chainId && isSupportedChainId(chainId) ? chainId : null;

  const publicClient = useMemo(() => {
    if (!validChainId) return null;
    return createPublicClient({
      chain: resolveChain(validChainId as SupportedChainId),
      transport: http(),
    });
  }, [validChainId]);

  useEffect(() => {
    if (!ready) return;

    if (!authenticated) {
      syncConnection({ isConnected: false, agwAddress: null, signerAddress: null });
      return;
    }

    if (!signerAddress || !validChainId || !publicClient) {
      markResolving();
      return;
    }

    let cancelled = false;
    markResolving();

    void (async () => {
      try {
        const derivedAgwAddress = await getSmartAccountAddressFromInitialSigner(signerAddress, publicClient);
        const agwRegistered = await isAGWAccount(publicClient, derivedAgwAddress);
        if (cancelled) return;

        if (!agwRegistered) {
          markCreationError(
            `No Abstract Global Wallet found for signer ${signerAddress}. ` +
            'Create an AGW at abs.xyz before running this flow.',
          );
          return;
        }

        syncConnection({
          isConnected: true,
          agwAddress: derivedAgwAddress as Address,
          signerAddress,
        });
      } catch (err) {
        if (cancelled) return;
        markCreationError(
          `Failed to verify AGW on-chain: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    })();

    return () => { cancelled = true; };
  }, [ready, authenticated, signerAddress, validChainId, publicClient, resolutionAttempt, markResolving, syncConnection, markCreationError]);

  return {
    currentStep,
    agwAddress,
    signerAddress: storedSignerAddress,
    dangerAcknowledged,
    policyPreview,
    error,
    redirectUrl,
    provisionedSigner,
    existingSigners,
    setDangerAcknowledged,
    setValidationError,
    proceedToCreating,
    backToPolicySelection,
    markCreationSuccess,
    markCreationError,
    retryResolution,
    isConnected: Boolean(ready && authenticated && agwAddress && storedSignerAddress),
  };
}
