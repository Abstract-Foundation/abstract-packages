import type {
  BuiltInSessionPolicyPresetId,
  SessionPolicyPresetId,
  SessionPolicyPresetTemplate,
} from './policy-types';
import {
  DEFAULT_POLICY_EXPIRY_SECONDS,
  DEFAULT_POLICY_FEE_LIMIT,
  DEFAULT_POLICY_MAX_VALUE_PER_USE,
} from './config';

export const TRANSFER_PRESET: SessionPolicyPresetTemplate = {
  id: 'transfer',
  label: 'Transfer',
  description: 'Native ETH transfers with a per-transaction cap. Specify allowed recipients.',
  customMode: false,
  expiresInSeconds: DEFAULT_POLICY_EXPIRY_SECONDS,
  sessionConfig: {
    feeLimit: DEFAULT_POLICY_FEE_LIMIT,
    maxValuePerUse: DEFAULT_POLICY_MAX_VALUE_PER_USE,
    callPolicies: [],
    transferPolicies: [],
  },
};

export const CUSTOM_PRESET: Omit<SessionPolicyPresetTemplate, 'sessionConfig' | 'expiresInSeconds'> = {
  id: 'custom',
  label: 'Custom',
  description: 'Define exact call targets, transfer recipients, and limits.',
  customMode: true,
};

export const DEFAULT_CUSTOM_TEMPLATE: SessionPolicyPresetTemplate = {
  ...CUSTOM_PRESET,
  expiresInSeconds: DEFAULT_POLICY_EXPIRY_SECONDS,
  sessionConfig: {
    feeLimit: DEFAULT_POLICY_FEE_LIMIT,
    maxValuePerUse: DEFAULT_POLICY_MAX_VALUE_PER_USE,
    callPolicies: [],
    transferPolicies: [],
  },
};

export const BUILT_IN_POLICY_PRESETS: Readonly<
  Record<BuiltInSessionPolicyPresetId, SessionPolicyPresetTemplate>
> = {
  transfer: TRANSFER_PRESET,
};

export const POLICY_PRESET_OPTIONS: Array<{ id: SessionPolicyPresetId; label: string; description: string }> = [
  {
    id: 'transfer',
    label: TRANSFER_PRESET.label,
    description: TRANSFER_PRESET.description,
  },
  {
    id: 'custom',
    label: CUSTOM_PRESET.label,
    description: CUSTOM_PRESET.description,
  },
];
