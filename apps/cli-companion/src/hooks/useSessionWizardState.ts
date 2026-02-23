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
  const policyMode = useSessionWizardStore(state => state.policyMode);
  const selectedPreset = useSessionWizardStore(state => state.selectedPreset);
  const selectedAppIds = useSessionWizardStore(state => state.selectedAppIds);
  const transferTargets = useSessionWizardStore(state => state.transferTargets);
  const expiresInSeconds = useSessionWizardStore(state => state.expiresInSeconds);
  const feeLimit = useSessionWizardStore(state => state.feeLimit);
  const maxValuePerUse = useSessionWizardStore(state => state.maxValuePerUse);
  const dangerAcknowledged = useSessionWizardStore(state => state.dangerAcknowledged);
  const customPolicyJson = useSessionWizardStore(state => state.customPolicyJson);
  const policyPreview = useSessionWizardStore(state => state.policyPreview);
  const riskAssessment = useSessionWizardStore(state => state.riskAssessment);
  const error = useSessionWizardStore(state => state.error);
  const transactionHash = useSessionWizardStore(state => state.transactionHash);
  const redirectUrl = useSessionWizardStore(state => state.redirectUrl);

  const syncConnection = useSessionWizardStore(state => state.syncConnection);
  const setPolicyMode = useSessionWizardStore(state => state.setPolicyMode);
  const selectPreset = useSessionWizardStore(state => state.selectPreset);
  const toggleAppSelection = useSessionWizardStore(state => state.toggleAppSelection);
  const setTransferTargets = useSessionWizardStore(state => state.setTransferTargets);
  const setExpiresInSeconds = useSessionWizardStore(state => state.setExpiresInSeconds);
  const setFeeLimit = useSessionWizardStore(state => state.setFeeLimit);
  const setMaxValuePerUse = useSessionWizardStore(state => state.setMaxValuePerUse);
  const setDangerAcknowledged = useSessionWizardStore(state => state.setDangerAcknowledged);
  const updateCustomPolicyJson = useSessionWizardStore(state => state.updateCustomPolicyJson);
  const setValidationError = useSessionWizardStore(state => state.setValidationError);
  const proceedToCreating = useSessionWizardStore(state => state.proceedToCreating);
  const backToPolicySelection = useSessionWizardStore(state => state.backToPolicySelection);
  const markCreationSuccess = useSessionWizardStore(state => state.markCreationSuccess);
  const markCreationError = useSessionWizardStore(state => state.markCreationError);

  useEffect(() => {
    syncConnection({
      isConnected,
      address: address ?? null,
    });
  }, [isConnected, address, syncConnection]);

  return {
    currentStep,
    agwAddress,
    policyMode,
    selectedPreset,
    selectedAppIds,
    transferTargets,
    expiresInSeconds,
    feeLimit,
    maxValuePerUse,
    dangerAcknowledged,
    customPolicyJson,
    policyPreview,
    riskAssessment,
    error,
    transactionHash,
    redirectUrl,
    setPolicyMode,
    selectPreset,
    toggleAppSelection,
    setTransferTargets,
    setExpiresInSeconds,
    setFeeLimit,
    setMaxValuePerUse,
    setDangerAcknowledged,
    updateCustomPolicyJson,
    setValidationError,
    proceedToCreating,
    backToPolicySelection,
    markCreationSuccess,
    markCreationError,
    isConnected,
    isLoginPending,
    login,
  };
}
