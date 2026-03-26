import { describe, expect, it } from 'vitest';
import { buildDefaultPolicyMeta, buildDefaultCapabilitySummary, DEFAULT_ENABLED_TOOLS } from '../server/default-policy';

describe('default-policy', () => {
  describe('buildDefaultPolicyMeta', () => {
    it('returns guided mode with full_app_control preset', () => {
      // #given
      const now = 1_800_000_000;

      // #when
      const meta = buildDefaultPolicyMeta(now);

      // #then
      expect(meta.mode).toBe('guided');
      expect(meta.presetId).toBe('full_app_control');
      expect(meta.enabledTools).toEqual(DEFAULT_ENABLED_TOOLS);
      expect(meta.generatedAt).toBe(now);
    });
  });

  describe('buildDefaultCapabilitySummary', () => {
    it('sets expiry to 30 days from now with correct chain and limits', () => {
      // #given
      const now = 1_800_000_000;
      const thirtyDays = 30 * 24 * 60 * 60;

      // #when
      const summary = buildDefaultCapabilitySummary(11124, now);

      // #then
      expect(summary.chainId).toBe(11124);
      expect(summary.expiresAt).toBe(now + thirtyDays);
      expect(summary.feeLimit).toBe('2000000000000000');
      expect(summary.maxValuePerUse).toBe('10000000000000000');
    });
  });
});
