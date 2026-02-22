'use client';

import { useLoginWithAbstract } from '@abstract-foundation/agw-react';
import { useAccount } from 'wagmi';
import { useEffect } from 'react';
import useSessionWizardStore from '@/stores/useSessionWizardStore';

export function useSessionWizardState() {
  const { login } = useLoginWithAbstract();
  const { isConnected, address } = useAccount();

  const currentStep = useSessionWizardStore(state => state.currentStep);
  const agwAddress = useSessionWizardStore(state => state.agwAddress);
  const selectedPreset = useSessionWizardStore(state => state.selectedPreset);
  const customPolicyJson = useSessionWizardStore(state => state.customPolicyJson);
  const policyPreview = useSessionWizardStore(state => state.policyPreview);
  const riskAssessment = useSessionWizardStore(state => state.riskAssessment);
  const error = useSessionWizardStore(state => state.error);
  const transactionHash = useSessionWizardStore(state => state.transactionHash);
  const redirectUrl = useSessionWizardStore(state => state.redirectUrl);

  const syncConnection = useSessionWizardStore(state => state.syncConnection);
  const selectPreset = useSessionWizardStore(state => state.selectPreset);
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
    selectedPreset,
    customPolicyJson,
    policyPreview,
    riskAssessment,
    error,
    transactionHash,
    redirectUrl,
    selectPreset,
    updateCustomPolicyJson,
    setValidationError,
    proceedToCreating,
    backToPolicySelection,
    markCreationSuccess,
    markCreationError,
    isConnected,
    login,
  };
}
