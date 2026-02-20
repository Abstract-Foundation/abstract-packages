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

export type BuiltInSessionPolicyPresetId = 'transfer';
export type SessionPolicyPresetId = BuiltInSessionPolicyPresetId | 'custom';

export interface SessionPolicyPresetTemplate {
  id: SessionPolicyPresetId;
  label: string;
  description: string;
  customMode: boolean;
  expiresInSeconds: number;
  sessionConfig: SessionPolicyConfig;
}

export interface PolicyPreview {
  presetId: SessionPolicyPresetId;
  label: string;
  description: string;
  policyPayload: {
    expiresAt: number;
    sessionConfig: SessionPolicyConfig;
  };
}

export interface SecurityAssessment {
  level: 'low' | 'high';
  requiresConfirmation: boolean;
  reasons: string[];
}
