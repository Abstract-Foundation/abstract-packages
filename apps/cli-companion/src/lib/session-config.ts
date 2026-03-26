import type { SessionPolicyMeta } from './policy-types';

export type SessionCallbackAction = 'init' | 'revoke';

export interface DelegatedCapabilitySummary {
  chainId: number;
  expiresAt: number;
  feeLimit: string;
  maxValuePerUse: string;
  enabledTools: string[];
  notes: string[];
}

export interface PrivySignerInitBundle {
  version: 2;
  action: 'init';
  accountAddress: string;
  underlyingSignerAddress: string;
  chainId: number;
  walletId: string;
  signerType: 'device_authorization_key';
  signerId: string;
  policyIds: string[];
  signerFingerprint: string;
  signerLabel: string;
  signerCreatedAt: number;
  policyMeta: SessionPolicyMeta;
  capabilitySummary: DelegatedCapabilitySummary;
}

export interface PrivySignerRevokeBundle {
  version: 2;
  action: 'revoke';
  accountAddress: string;
  underlyingSignerAddress: string;
  chainId: number;
  walletId: string;
  signerType: 'device_authorization_key';
  signerId: string;
  revokedAt: number;
}

export type PrivySignerBundle = PrivySignerInitBundle | PrivySignerRevokeBundle;

export interface ExistingAgwMcpSignerSummary {
  signerId: string;
  signerLabel: string;
  signerFingerprint: string;
  signerCreatedAt: number;
}

export interface ProvisionedSignerResult {
  walletId: string;
  agwAccountAddress: string;
  signerAddress: string;
  signerType: 'device_authorization_key';
  signerId: string;
  provisionAttestation: string;
  policyIds: string[];
  signerFingerprint: string;
  signerLabel: string;
  signerCreatedAt: number;
  policyMeta: SessionPolicyMeta;
  capabilitySummary: DelegatedCapabilitySummary;
  existingSigners: ExistingAgwMcpSignerSummary[];
}
