import { describe, expect, it } from 'vitest';
import { assessPolicyRisk } from '../risk-assessment';
import type { SessionToolName } from '../policy-types';

describe('risk assessment', () => {
  it('returns low risk for short-lived low-value policy', () => {
    const preview = {
      presetId: 'payments' as const,
      label: 'Payments',
      description: 'Payments',
      policyPayload: {
        expiresAt: Math.floor(Date.now() / 1000) + 900,
        sessionConfig: {
          feeLimit: '1000',
          maxValuePerUse: '0',
          callPolicies: [],
          transferPolicies: [],
        },
        policyMeta: {
          version: 1 as const,
          mode: 'guided' as const,
          presetId: 'payments' as const,
          presetLabel: 'Payments',
          enabledTools: ['get_session_status', 'revoke_session'] as SessionToolName[],
          selectedAppIds: [],
          selectedContractAddresses: [],
          unverifiedAppIds: [],
          warnings: [],
          generatedAt: Math.floor(Date.now() / 1000),
        },
      },
    };

    const risk = assessPolicyRisk(preview);
    expect(risk.level).toBe('low');
    expect(risk.requiresConfirmation).toBe(false);
    expect(risk.reasons).toEqual([]);
  });

  it('returns high risk when policy exceeds safety thresholds', () => {
    const preview = {
      presetId: 'custom' as const,
      label: 'Custom',
      description: 'Custom',
      policyPayload: {
        expiresAt: Math.floor(Date.now() / 1000) + 25_000,
        sessionConfig: {
          feeLimit: '1000',
          maxValuePerUse: '2000000000000000000',
          callPolicies: [{ target: '0x1111111111111111111111111111111111111111' }],
          transferPolicies: [],
        },
        policyMeta: {
          version: 1 as const,
          mode: 'advanced' as const,
          presetId: 'full_app_control' as const,
          presetLabel: 'Full App Control',
          enabledTools: ['deploy_contract', 'sign_message'] as SessionToolName[],
          selectedAppIds: ['213'],
          selectedContractAddresses: ['0x1111111111111111111111111111111111111111'],
          unverifiedAppIds: ['213'],
          warnings: ['Unverified app'],
          generatedAt: Math.floor(Date.now() / 1000),
        },
      },
    };

    const risk = assessPolicyRisk(preview);
    expect(risk.level).toBe('critical');
    expect(risk.requiresConfirmation).toBe(true);
    expect(risk.reasons.length).toBeGreaterThan(0);
  });
});
