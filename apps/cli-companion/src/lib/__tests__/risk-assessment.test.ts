import { describe, expect, it } from 'vitest';
import { assessPolicyRisk } from '../risk-assessment';

describe('risk assessment', () => {
  it('returns low risk for short-lived low-value policy', () => {
    const preview = {
      presetId: 'transfer' as const,
      label: 'Transfer',
      description: 'Transfer',
      policyPayload: {
        expiresAt: Math.floor(Date.now() / 1000) + 900,
        sessionConfig: {
          feeLimit: '1000',
          maxValuePerUse: '0',
          callPolicies: [],
          transferPolicies: [],
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
      },
    };

    const risk = assessPolicyRisk(preview);
    expect(risk.level).toBe('high');
    expect(risk.requiresConfirmation).toBe(true);
    expect(risk.reasons.length).toBeGreaterThan(0);
  });
});
