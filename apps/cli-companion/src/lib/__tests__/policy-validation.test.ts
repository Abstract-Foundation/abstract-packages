import { describe, expect, it } from 'vitest';
import { getPolicyPreview } from '../policy-validation';

describe('policy validation', () => {
  it('builds transfer preset preview', () => {
    const preview = getPolicyPreview({ presetId: 'transfer', nowUnixSeconds: 1_700_000_000 });

    expect(preview.presetId).toBe('transfer');
    expect(preview.policyPayload.expiresAt).toBe(1_700_003_600);
    expect(preview.policyPayload.sessionConfig.maxValuePerUse).toBe('10000000000000000');
  });

  it('parses custom policy json', () => {
    const customPolicyJson = JSON.stringify({
      expiresInSeconds: 900,
      sessionConfig: {
        feeLimit: '1000',
        maxValuePerUse: '7',
        callPolicies: [],
        transferPolicies: [],
      },
    });

    const preview = getPolicyPreview({
      presetId: 'custom',
      customPolicyJson,
      nowUnixSeconds: 1_700_000_000,
    });

    expect(preview.presetId).toBe('custom');
    expect(preview.policyPayload.expiresAt).toBe(1_700_000_900);
    expect(preview.policyPayload.sessionConfig.maxValuePerUse).toBe('7');
  });

  it('throws for malformed custom policy', () => {
    expect(() => getPolicyPreview({ presetId: 'custom', customPolicyJson: '{invalid-json' })).toThrow(
      'Invalid custom policy',
    );
  });

  it('rejects custom policy with invalid call policy target', () => {
    const customPolicyJson = JSON.stringify({
      expiresInSeconds: 900,
      sessionConfig: {
        feeLimit: '1000',
        maxValuePerUse: '7',
        callPolicies: [{ target: 'not-an-address', selector: '0x12345678' }],
        transferPolicies: [],
      },
    });

    expect(() => getPolicyPreview({ presetId: 'custom', customPolicyJson })).toThrow('Invalid custom policy');
  });

  it('rejects custom policy with invalid selector format', () => {
    const customPolicyJson = JSON.stringify({
      expiresInSeconds: 900,
      sessionConfig: {
        feeLimit: '1000',
        maxValuePerUse: '7',
        callPolicies: [{ target: '0x1111111111111111111111111111111111111111', selector: '0x12' }],
        transferPolicies: [],
      },
    });

    expect(() => getPolicyPreview({ presetId: 'custom', customPolicyJson })).toThrow('Invalid custom policy');
  });
});
