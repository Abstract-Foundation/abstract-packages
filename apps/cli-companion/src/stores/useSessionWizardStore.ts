'use client';

import { create } from 'zustand';
import type { PolicyPreview, SecurityAssessment, SessionPolicyPresetId } from '@/lib/policy-types';
import {
  DEFAULT_POLICY_EXPIRY_SECONDS,
  DEFAULT_POLICY_FEE_LIMIT,
  DEFAULT_POLICY_MAX_VALUE_PER_USE,
} from '@/lib/config';

export type SessionWizardStep =
  | 'not_logged_in'
  | 'select_policy'
  | 'review_policy'
  | 'creating'
  | 'success'
  | 'error';

interface SessionWizardState {
  currentStep: SessionWizardStep;
  agwAddress: string | null;
  selectedPreset: SessionPolicyPresetId;
  customPolicyJson: string;
  policyPreview: PolicyPreview | null;
  riskAssessment: SecurityAssessment | null;
  error: string | null;
  transactionHash: string | null;
  redirectUrl: string | null;
  syncConnection: (input: { isConnected: boolean; address: string | null }) => void;
  selectPreset: (preset: SessionPolicyPresetId) => void;
  updateCustomPolicyJson: (value: string) => void;
  setValidationError: (error: string | null) => void;
  proceedToReview: (preview: PolicyPreview, risk: SecurityAssessment) => void;
  backToPolicySelection: () => void;
  startCreating: () => void;
  markCreationSuccess: (input: { transactionHash: string | null; redirectUrl: string }) => void;
  markCreationError: (error: string) => void;
}

const DEFAULT_CUSTOM_POLICY = JSON.stringify(
  {
    expiresInSeconds: DEFAULT_POLICY_EXPIRY_SECONDS,
    sessionConfig: {
      feeLimit: DEFAULT_POLICY_FEE_LIMIT,
      maxValuePerUse: DEFAULT_POLICY_MAX_VALUE_PER_USE,
      callPolicies: [],
      transferPolicies: [],
    },
  },
  null,
  2,
);

const useSessionWizardStore = create<SessionWizardState>((set, get) => ({
  currentStep: 'not_logged_in',
  agwAddress: null,
  selectedPreset: 'transfer',
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
  selectPreset: selectedPreset =>
    set({
      selectedPreset,
      policyPreview: null,
      riskAssessment: null,
      error: null,
    }),
  updateCustomPolicyJson: customPolicyJson =>
    set({
      customPolicyJson,
      policyPreview: null,
      riskAssessment: null,
      error: null,
    }),
  setValidationError: error => set({ error }),
  proceedToReview: (policyPreview, riskAssessment) =>
    set({
      currentStep: 'review_policy',
      policyPreview,
      riskAssessment,
      error: null,
    }),
  backToPolicySelection: () =>
    set({
      currentStep: 'select_policy',
      policyPreview: null,
      riskAssessment: null,
      error: null,
      transactionHash: null,
      redirectUrl: null,
    }),
  startCreating: () => {
    const state = get();
    if (!state.policyPreview || !state.riskAssessment) {
      throw new Error('Policy preview is missing. Re-run policy review before creating a session.');
    }

    set({
      currentStep: 'creating',
      error: null,
      transactionHash: null,
      redirectUrl: null,
    });
  },
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
