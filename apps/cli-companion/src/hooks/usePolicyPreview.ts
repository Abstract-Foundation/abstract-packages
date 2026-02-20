'use client';

import { useMemo } from 'react';
import { getPolicyPreview } from '@/lib/policy-validation';
import { assessPolicyRisk } from '@/lib/risk-assessment';
import type { PolicyPreview, SecurityAssessment, SessionPolicyPresetId } from '@/lib/policy-types';

export interface PolicyPreviewState {
  preview: PolicyPreview | null;
  risk: SecurityAssessment | null;
  error: string | null;
}

export function usePolicyPreview(
  selectedPreset: SessionPolicyPresetId,
  customPolicyJson: string,
): PolicyPreviewState {
  return useMemo(() => {
    try {
      const preview = getPolicyPreview({
        presetId: selectedPreset,
        customPolicyJson,
      });
      const risk = assessPolicyRisk(preview);
      return {
        preview,
        risk,
        error: null,
      };
    } catch (error) {
      return {
        preview: null,
        risk: null,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }, [selectedPreset, customPolicyJson]);
}
