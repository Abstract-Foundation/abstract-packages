export interface SessionCallPolicy {
  target: string;
  selector?: string;
}

export interface SessionTransferPolicy {
  tokenAddress: string;
  maxAmountBaseUnit: string;
}

export interface SessionPolicyConfig {
  feeLimit: string;
  maxValuePerUse: string;
  callPolicies: SessionCallPolicy[];
  transferPolicies: SessionTransferPolicy[];
}

export type BuiltInSessionPolicyPresetId =
  | "read_only"
  | "transfer"
  | "swap"
  | "contract_write"
  | "read_and_sign"
  | "limited_spend";
export type SessionPolicyPresetId = BuiltInSessionPolicyPresetId | "custom";

export interface SessionPolicyPresetTemplate {
  id: SessionPolicyPresetId;
  label: string;
  description: string;
  customMode: boolean;
  expiresInSeconds: number;
  sessionConfig: SessionPolicyConfig;
}

export const READ_ONLY_PRESET: SessionPolicyPresetTemplate = {
  id: "read_only",
  label: "Read Only",
  description: "Short-lived session for read/sign flows with zero transfer allowance.",
  customMode: false,
  expiresInSeconds: 1800,
  sessionConfig: {
    feeLimit: "500000000000000",
    maxValuePerUse: "0",
    callPolicies: [],
    transferPolicies: [],
  },
};

export const TRANSFER_PRESET: SessionPolicyPresetTemplate = {
  id: "transfer",
  label: "Transfer",
  description: "Session preset for bounded native transfers.",
  customMode: false,
  expiresInSeconds: 3600,
  sessionConfig: {
    feeLimit: "1500000000000000",
    maxValuePerUse: "5000000000000000",
    callPolicies: [],
    transferPolicies: [
      {
        tokenAddress: "0x0000000000000000000000000000000000000000",
        maxAmountBaseUnit: "5000000000000000",
      },
    ],
  },
};

export const SWAP_PRESET: SessionPolicyPresetTemplate = {
  id: "swap",
  label: "Swap",
  description: "Session preset for swap workflows with explicit call + value limits.",
  customMode: false,
  expiresInSeconds: 3600,
  sessionConfig: {
    feeLimit: "2000000000000000",
    maxValuePerUse: "10000000000000000",
    callPolicies: [],
    transferPolicies: [
      {
        tokenAddress: "0x0000000000000000000000000000000000000000",
        maxAmountBaseUnit: "10000000000000000",
      },
    ],
  },
};

export const CONTRACT_WRITE_PRESET: SessionPolicyPresetTemplate = {
  id: "contract_write",
  label: "Contract Write",
  description: "Session preset for contract writes with strict expiry and explicit policy customization.",
  customMode: false,
  expiresInSeconds: 1800,
  sessionConfig: {
    feeLimit: "2000000000000000",
    maxValuePerUse: "1000000000000000",
    callPolicies: [],
    transferPolicies: [],
  },
};

export const READ_AND_SIGN_PRESET: SessionPolicyPresetTemplate = {
  id: "read_and_sign",
  label: "Read + Sign",
  description: "Short-lived session that allows signing but no value transfer.",
  customMode: false,
  expiresInSeconds: 1800,
  sessionConfig: {
    feeLimit: "1000000000000000",
    maxValuePerUse: "0",
    callPolicies: [],
    transferPolicies: [],
  },
};

export const LIMITED_SPEND_PRESET: SessionPolicyPresetTemplate = {
  id: "limited_spend",
  label: "Limited Spend",
  description: "Short-lived session with a strict native token spend cap.",
  customMode: false,
  expiresInSeconds: 3600,
  sessionConfig: {
    feeLimit: "2000000000000000",
    maxValuePerUse: "10000000000000000",
    callPolicies: [],
    transferPolicies: [
      {
        tokenAddress: "0x0000000000000000000000000000000000000000",
        maxAmountBaseUnit: "10000000000000000",
      },
    ],
  },
};

export const CUSTOM_PRESET: Omit<SessionPolicyPresetTemplate, "sessionConfig" | "expiresInSeconds"> = {
  id: "custom",
  label: "Custom",
  description: "Define a custom policy template with explicit limits.",
  customMode: true,
};

export const DEFAULT_CUSTOM_TEMPLATE: SessionPolicyPresetTemplate = {
  ...CUSTOM_PRESET,
  expiresInSeconds: 900,
  sessionConfig: {
    feeLimit: "1000000000000000",
    maxValuePerUse: "1000000000000000",
    callPolicies: [],
    transferPolicies: [],
  },
};

export const BUILT_IN_POLICY_PRESETS: Readonly<Record<BuiltInSessionPolicyPresetId, SessionPolicyPresetTemplate>> = {
  read_only: READ_ONLY_PRESET,
  transfer: TRANSFER_PRESET,
  swap: SWAP_PRESET,
  contract_write: CONTRACT_WRITE_PRESET,
  read_and_sign: READ_AND_SIGN_PRESET,
  limited_spend: LIMITED_SPEND_PRESET,
};
