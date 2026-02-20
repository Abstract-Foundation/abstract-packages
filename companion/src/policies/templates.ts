export interface SessionCallPolicy {
  target: string;
  selector?: string;
}

export interface SessionTransferPolicy {
  target: string;
  maxValuePerUse: string;
}

export interface SessionPolicyConfig {
  feeLimit: string;
  maxValuePerUse: string;
  callPolicies: SessionCallPolicy[];
  transferPolicies: SessionTransferPolicy[];
}

export type BuiltInSessionPolicyPresetId = "transfer";
export type SessionPolicyPresetId = BuiltInSessionPolicyPresetId | "custom";

export interface SessionPolicyPresetTemplate {
  id: SessionPolicyPresetId;
  label: string;
  description: string;
  customMode: boolean;
  expiresInSeconds: number;
  sessionConfig: SessionPolicyConfig;
}

export const TRANSFER_PRESET: SessionPolicyPresetTemplate = {
  id: "transfer",
  label: "Transfer",
  description: "Native ETH transfers with a per-transaction cap. Specify allowed recipients.",
  customMode: false,
  expiresInSeconds: 3600,
  sessionConfig: {
    feeLimit: "2000000000000000",
    maxValuePerUse: "10000000000000000",
    callPolicies: [],
    transferPolicies: [],
  },
};

export const CUSTOM_PRESET: Omit<SessionPolicyPresetTemplate, "sessionConfig" | "expiresInSeconds"> = {
  id: "custom",
  label: "Custom",
  description: "Define exact call targets, transfer recipients, and limits.",
  customMode: true,
};

export const DEFAULT_CUSTOM_TEMPLATE: SessionPolicyPresetTemplate = {
  ...CUSTOM_PRESET,
  expiresInSeconds: 3600,
  sessionConfig: {
    feeLimit: "2000000000000000",
    maxValuePerUse: "10000000000000000",
    callPolicies: [],
    transferPolicies: [],
  },
};

export const BUILT_IN_POLICY_PRESETS: Readonly<Record<BuiltInSessionPolicyPresetId, SessionPolicyPresetTemplate>> = {
  transfer: TRANSFER_PRESET,
};
