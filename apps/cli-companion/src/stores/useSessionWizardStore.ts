'use client';

import { create } from 'zustand';

export type SessionWizardStep =
  | 'not_logged_in'
  | 'creating'
  | 'success'
  | 'error';

interface SessionWizardState {
  currentStep: SessionWizardStep;
  agwAddress: string | null;
  error: string | null;
  redirectUrl: string | null;
  syncConnection: (input: { isConnected: boolean; address: string | null }) => void;
  markCreationSuccess: (input: { redirectUrl: string }) => void;
  markCreationError: (error: string) => void;
  backToStart: () => void;
}

const useSessionWizardStore = create<SessionWizardState>(set => ({
  currentStep: 'not_logged_in',
  agwAddress: null,
  error: null,
  redirectUrl: null,
  syncConnection: ({ isConnected, address }) =>
    set(state => {
      if (!isConnected || !address) {
        return {
          agwAddress: null,
          currentStep: state.currentStep === 'success' ? state.currentStep : 'not_logged_in',
        };
      }

      return {
        agwAddress: address,
        currentStep: state.currentStep === 'not_logged_in' ? 'creating' : state.currentStep,
      };
    }),
  markCreationSuccess: ({ redirectUrl }) =>
    set({
      currentStep: 'success',
      redirectUrl,
      error: null,
    }),
  markCreationError: error =>
    set({
      currentStep: 'error',
      error,
    }),
  backToStart: () =>
    set({
      currentStep: 'not_logged_in',
      error: null,
      redirectUrl: null,
    }),
}));

export default useSessionWizardStore;
