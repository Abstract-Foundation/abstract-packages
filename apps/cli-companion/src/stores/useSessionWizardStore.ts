"use client";

import { create } from "zustand";
import type { PolicyPreview } from "@/lib/policy-types";
import type {
  ExistingAgwMcpSignerSummary,
  ProvisionedSignerResult,
} from "@/lib/session-config";

export type SessionWizardStep =
  | "not_logged_in"
  | "resolving"
  | "select_policy"
  | "creating"
  | "success"
  | "error";

interface SessionWizardState {
  currentStep: SessionWizardStep;
  resolutionAttempt: number;
  chainId: number | null;
  agwAddress: string | null;
  signerAddress: string | null;
  dangerAcknowledged: boolean;
  policyPreview: PolicyPreview | null;
  error: string | null;
  redirectUrl: string | null;
  provisionedSigner: ProvisionedSignerResult | null;
  existingSigners: ExistingAgwMcpSignerSummary[];
  setChainId: (chainId: number) => void;
  markResolving: () => void;
  syncConnection: (input: {
    isConnected: boolean;
    agwAddress: string | null;
    signerAddress: string | null;
  }) => void;
  setDangerAcknowledged: (value: boolean) => void;
  setValidationError: (error: string | null) => void;
  proceedToCreating: (preview: PolicyPreview) => void;
  backToPolicySelection: () => void;
  markCreationSuccess: (input: {
    redirectUrl: string;
    provisionedSigner: ProvisionedSignerResult;
  }) => void;
  markCreationError: (error: string) => void;
  retryResolution: () => void;
}

const useSessionWizardStore = create<SessionWizardState>((set) => ({
  currentStep: "not_logged_in",
  resolutionAttempt: 0,
  chainId: null,
  agwAddress: null,
  signerAddress: null,
  dangerAcknowledged: false,
  policyPreview: null,
  error: null,
  redirectUrl: null,
  provisionedSigner: null,
  existingSigners: [],
  setChainId: (chainId) => set({ chainId }),
  markResolving: () =>
    set((state) => {
      if (
        state.currentStep === "not_logged_in" ||
        state.currentStep === "error"
      ) {
        return { currentStep: "resolving", error: null };
      }
      return state;
    }),
  syncConnection: ({ isConnected, agwAddress, signerAddress }) =>
    set((state) => {
      if (!isConnected || !agwAddress || !signerAddress) {
        const terminalSteps: SessionWizardStep[] = ["creating", "success"];
        return {
          agwAddress: null,
          signerAddress: null,
          currentStep: terminalSteps.includes(state.currentStep)
            ? state.currentStep
            : "not_logged_in",
        };
      }

      const promotableSteps: SessionWizardStep[] = [
        "not_logged_in",
        "resolving",
        "error",
      ];
      return {
        agwAddress,
        signerAddress,
        currentStep: promotableSteps.includes(state.currentStep)
          ? "select_policy"
          : state.currentStep,
      };
    }),
  setDangerAcknowledged: (dangerAcknowledged) =>
    set({
      dangerAcknowledged,
    }),
  setValidationError: (error) => set({ error }),
  proceedToCreating: (policyPreview) =>
    set({
      currentStep: "creating",
      policyPreview,
      error: null,
      redirectUrl: null,
      provisionedSigner: null,
    }),
  backToPolicySelection: () =>
    set({
      currentStep: "select_policy",
      policyPreview: null,
      error: null,
      redirectUrl: null,
      provisionedSigner: null,
    }),
  markCreationSuccess: ({ redirectUrl, provisionedSigner }) =>
    set({
      currentStep: "success",
      redirectUrl,
      provisionedSigner,
      existingSigners: provisionedSigner.existingSigners,
      error: null,
    }),
  markCreationError: (error) =>
    set({
      currentStep: "error",
      error,
    }),
  retryResolution: () =>
    set((state) => ({
      currentStep: "not_logged_in",
      agwAddress: null,
      signerAddress: null,
      error: null,
      resolutionAttempt: state.resolutionAttempt + 1,
    })),
}));

export default useSessionWizardStore;
