export type SessionToolName =
  | "get_wallet_address"
  | "get_balances"
  | "get_token_list"
  | "get_session_status"
  | "sign_message"
  | "sign_transaction"
  | "transfer_token"
  | "swap_tokens"
  | "preview_transaction"
  | "revoke_session"
  | "send_transaction"
  | "send_calls"
  | "write_contract"
  | "deploy_contract";

export type PolicyMode = "guided" | "advanced";

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

export interface SessionPolicyMeta {
  version: 1;
  mode: PolicyMode;
  presetId: SessionPolicyPresetId;
  presetLabel: string;
  enabledTools: SessionToolName[];
  selectedAppIds: string[];
  selectedContractAddresses: string[];
  unverifiedAppIds: string[];
  warnings: string[];
  generatedAt: number;
}

export type BuiltInSessionPolicyPresetId =
  | "payments"
  | "trading"
  | "gaming"
  | "contract_write"
  | "deploy"
  | "signing"
  | "full_app_control";
export type SessionPolicyPresetId = BuiltInSessionPolicyPresetId | "custom";

export interface SessionPolicyLimitInputs {
  expiresInSeconds: number;
  feeLimit: string;
  maxValuePerUse: string;
}

export interface GuidedSessionPolicyDraft extends SessionPolicyLimitInputs {
  presetId: BuiltInSessionPolicyPresetId;
  selectedAppIds: string[];
  transferTargets: string[];
}

export interface SessionPolicyPresetTemplate {
  id: BuiltInSessionPolicyPresetId;
  label: string;
  description: string;
  customMode: false;
  riskHint: "low" | "medium" | "high" | "critical";
  requiresDangerAcknowledgement: boolean;
  defaultLimits: SessionPolicyLimitInputs;
  enabledTools: SessionToolName[];
}

export interface CustomPolicyPresetDescriptor {
  id: "custom";
  label: string;
  description: string;
  customMode: true;
}

export interface PolicyPreview {
  presetId: SessionPolicyPresetId;
  label: string;
  description: string;
  policyPayload: {
    expiresAt: number;
    sessionConfig: SessionPolicyConfig;
    policyMeta?: SessionPolicyMeta;
  };
}

export interface SecurityAssessment {
  level: "low" | "medium" | "high" | "critical";
  requiresConfirmation: boolean;
  reasons: string[];
}
