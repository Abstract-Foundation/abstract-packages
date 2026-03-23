import { DEFAULT_POLICY_EXPIRY_SECONDS, DEFAULT_POLICY_FEE_LIMIT, DEFAULT_POLICY_MAX_VALUE_PER_USE } from '../config';
import type { DelegatedCapabilitySummary } from '../session-config';
import type { SessionPolicyMeta, SessionToolName } from '../policy-types';

export const DEFAULT_ENABLED_TOOLS: SessionToolName[] = [
  'get_wallet_address',
  'get_balances',
  'get_token_list',
  'get_session_status',
  'preview_transaction',
  'sign_transaction',
  'send_transaction',
  'send_calls',
  'write_contract',
  'deploy_contract',
  'revoke_session',
];

export function buildDefaultPolicyMeta(nowUnixSeconds = Math.floor(Date.now() / 1000)): SessionPolicyMeta {
  return {
    version: 1,
    mode: 'guided',
    presetId: 'full_app_control',
    presetLabel: 'AGW MCP Default',
    enabledTools: [...DEFAULT_ENABLED_TOOLS],
    selectedAppIds: [],
    selectedContractAddresses: [],
    unverifiedAppIds: [],
    warnings: [
      'This signer can submit transactions and typed-data signatures within the remote spend and time limits.',
      'Plain personal_sign requests are not enabled in the default policy.',
    ],
    generatedAt: nowUnixSeconds,
  };
}

export function buildDefaultCapabilitySummary(
  chainId: number,
  nowUnixSeconds = Math.floor(Date.now() / 1000),
): DelegatedCapabilitySummary {
  return {
    chainId,
    expiresAt: nowUnixSeconds + DEFAULT_POLICY_EXPIRY_SECONDS,
    feeLimit: DEFAULT_POLICY_FEE_LIMIT,
    maxValuePerUse: DEFAULT_POLICY_MAX_VALUE_PER_USE,
    enabledTools: [...DEFAULT_ENABLED_TOOLS],
    notes: [
      'Transaction submission is enabled with a native value cap per request.',
      'Typed-data signing is enabled for the selected chain.',
      'Plain personal_sign is disabled in the default policy.',
    ],
  };
}

