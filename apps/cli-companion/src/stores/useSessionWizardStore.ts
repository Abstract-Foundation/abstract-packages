'use client';

import { create } from 'zustand';
import { buildDefaultCustomTemplateJson } from '@/lib/policy-compiler';
import { BUILT_IN_POLICY_PRESETS } from '@/lib/policy-presets';
import type { PolicyMode, PolicyPreview, SecurityAssessment, SessionPolicyPresetId } from '@/lib/policy-types';

export type SessionWizardStep =
  | 'not_logged_in'
  | 'select_policy'
  | 'creating'
  | 'success'
  | 'error';

interface SessionWizardState {
  currentStep: SessionWizardStep;
  agwAddress: string | null;
  policyMode: PolicyMode;
  selectedPreset: SessionPolicyPresetId;
  selectedAppIds: string[];
  transferTargets: string[];
  expiresInSeconds: number;
  feeLimit: string;
  maxValuePerUse: string;
  dangerAcknowledged: boolean;
  customPolicyJson: string;
  policyPreview: PolicyPreview | null;
  riskAssessment: SecurityAssessment | null;
  error: string | null;
  transactionHash: string | null;
  redirectUrl: string | null;
  syncConnection: (input: { isConnected: boolean; address: string | null }) => void;
  setPolicyMode: (mode: PolicyMode) => void;
  selectPreset: (preset: SessionPolicyPresetId) => void;
  toggleAppSelection: (appId: string) => void;
  setTransferTargets: (targets: string[]) => void;
  setExpiresInSeconds: (value: number) => void;
  setFeeLimit: (value: string) => void;
  setMaxValuePerUse: (value: string) => void;
  setDangerAcknowledged: (value: boolean) => void;
  updateCustomPolicyJson: (value: string) => void;
  setValidationError: (error: string | null) => void;
  proceedToCreating: (preview: PolicyPreview, risk: SecurityAssessment) => void;
  backToPolicySelection: () => void;
  markCreationSuccess: (input: { transactionHash: string | null; redirectUrl: string }) => void;
  markCreationError: (error: string) => void;
}

const DEFAULT_PRESET = BUILT_IN_POLICY_PRESETS.payments;
const DEFAULT_CUSTOM_POLICY = buildDefaultCustomTemplateJson();

const useSessionWizardStore = create<SessionWizardState>(set => ({
  currentStep: 'not_logged_in',
  agwAddress: null,
  policyMode: 'guided',
  selectedPreset: DEFAULT_PRESET.id,
  selectedAppIds: [],
  transferTargets: [],
  expiresInSeconds: DEFAULT_PRESET.defaultLimits.expiresInSeconds,
  feeLimit: DEFAULT_PRESET.defaultLimits.feeLimit,
  maxValuePerUse: DEFAULT_PRESET.defaultLimits.maxValuePerUse,
  dangerAcknowledged: false,
  customPolicyJson: DEFAULT_CUSTOM_POLICY,
  policyPreview: null,
  riskAssessment: null,
  error: null,
  transactionHash: null,
  redirectUrl: null,
  syncConnection: ({ isConnected, address }) =>
    set(state => {
      if (!isConnected || !address) {
        return {
          agwAddress: null,
          currentStep: state.currentStep === 'creating' || state.currentStep === 'success' ? state.currentStep : 'not_logged_in',
        };
      }

      return {
        agwAddress: address,
        currentStep: state.currentStep === 'not_logged_in' ? 'select_policy' : state.currentStep,
      };
    }),
  setPolicyMode: policyMode =>
    set({
      policyMode,
      policyPreview: null,
      riskAssessment: null,
      error: null,
    }),
  selectPreset: selectedPreset =>
    set(state => {
      if (selectedPreset === 'custom') {
        return {
          ...state,
          selectedPreset,
          policyMode: 'advanced',
          policyPreview: null,
          riskAssessment: null,
          error: null,
        };
      }

      const preset = BUILT_IN_POLICY_PRESETS[selectedPreset];
      return {
        ...state,
        selectedPreset,
        policyMode: 'guided',
        expiresInSeconds: preset.defaultLimits.expiresInSeconds,
        feeLimit: preset.defaultLimits.feeLimit,
        maxValuePerUse: preset.defaultLimits.maxValuePerUse,
        dangerAcknowledged: false,
        policyPreview: null,
        riskAssessment: null,
        error: null,
      };
    }),
  toggleAppSelection: appId =>
    set(state => {
      const alreadySelected = state.selectedAppIds.includes(appId);
      return {
        selectedAppIds: alreadySelected
          ? state.selectedAppIds.filter(id => id !== appId)
          : [...state.selectedAppIds, appId],
        policyPreview: null,
        riskAssessment: null,
        error: null,
      };
    }),
  setTransferTargets: transferTargets =>
    set({
      transferTargets,
      policyPreview: null,
      riskAssessment: null,
      error: null,
    }),
  setExpiresInSeconds: expiresInSeconds =>
    set({
      expiresInSeconds,
      policyPreview: null,
      riskAssessment: null,
      error: null,
    }),
  setFeeLimit: feeLimit =>
    set({
      feeLimit,
      policyPreview: null,
      riskAssessment: null,
      error: null,
    }),
  setMaxValuePerUse: maxValuePerUse =>
    set({
      maxValuePerUse,
      policyPreview: null,
      riskAssessment: null,
      error: null,
    }),
  setDangerAcknowledged: dangerAcknowledged =>
    set({
      dangerAcknowledged,
    }),
  updateCustomPolicyJson: customPolicyJson =>
    set({
      policyMode: 'advanced',
      customPolicyJson,
      policyPreview: null,
      riskAssessment: null,
      error: null,
    }),
  setValidationError: error => set({ error }),
  proceedToCreating: (policyPreview, riskAssessment) =>
    set({
      currentStep: 'creating',
      policyPreview,
      riskAssessment,
      error: null,
      transactionHash: null,
      redirectUrl: null,
    }),
  backToPolicySelection: () =>
    set(state => ({
      ...state,
      currentStep: 'select_policy',
      policyPreview: null,
      riskAssessment: null,
      error: null,
      transactionHash: null,
      redirectUrl: null,
    })),
  markCreationSuccess: ({ transactionHash, redirectUrl }) =>
    set({
      currentStep: 'success',
      transactionHash,
      redirectUrl,
      error: null,
    }),
  markCreationError: error =>
    set({
      currentStep: 'error',
      error,
    }),
}));

export default useSessionWizardStore;
