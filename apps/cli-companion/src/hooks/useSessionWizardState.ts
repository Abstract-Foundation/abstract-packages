'use client';

import { useCallback, useEffect } from 'react';
import { useAccount, useConnect } from 'wagmi';
import useSessionWizardStore from '@/stores/useSessionWizardStore';

export function useSessionWizardState() {
  const { isConnected, address } = useAccount();
  const { connect, connectors, isPending: isLoginPending } = useConnect();

  const login = useCallback(() => {
    const connector = connectors.find(c => c.id === 'xyz.abs.privy');
    if (!connector) {
      throw new Error('Abstract connector not found');
    }
    connect({ connector });
  }, [connect, connectors]);

  const currentStep = useSessionWizardStore(state => state.currentStep);
  const agwAddress = useSessionWizardStore(state => state.agwAddress);
  const error = useSessionWizardStore(state => state.error);
  const redirectUrl = useSessionWizardStore(state => state.redirectUrl);

  const syncConnection = useSessionWizardStore(state => state.syncConnection);
  const markCreationSuccess = useSessionWizardStore(state => state.markCreationSuccess);
  const markCreationError = useSessionWizardStore(state => state.markCreationError);
  const backToStart = useSessionWizardStore(state => state.backToStart);

  useEffect(() => {
    syncConnection({
      isConnected,
      address: address ?? null,
    });
  }, [isConnected, address, syncConnection]);

  return {
    currentStep,
    agwAddress,
    error,
    redirectUrl,
    markCreationSuccess,
    markCreationError,
    backToStart,
    isConnected,
    isLoginPending,
    login,
  };
}
