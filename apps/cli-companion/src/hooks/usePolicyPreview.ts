'use client';

import { useMemo } from 'react';
import { buildGuidedTemplateJson } from '@/lib/policy-compiler';
import { getPolicyPreview } from '@/lib/policy-validation';
import { assessPolicyRisk } from '@/lib/risk-assessment';
import type {
  GuidedSessionPolicyDraft,
  PolicyMode,
  PolicyPreview,
  SecurityAssessment,
  SessionPolicyPresetId,
} from '@/lib/policy-types';

export interface PolicyPreviewState {
  preview: PolicyPreview | null;
  risk: SecurityAssessment | null;
  error: string | null;
  guidedTemplateJson: string;
}

export function usePolicyPreview(
  input: {
    selectedPreset: SessionPolicyPresetId;
    policyMode: PolicyMode;
    customPolicyJson: string;
    guidedDraft: Partial<GuidedSessionPolicyDraft>;
  },
): PolicyPreviewState {
  return useMemo(() => {
    let guidedTemplateJson = '';

    try {
      if (input.selectedPreset !== 'custom') {
        const draftPresetId = input.selectedPreset;
        const draft: GuidedSessionPolicyDraft = {
          presetId: draftPresetId,
          expiresInSeconds: input.guidedDraft.expiresInSeconds ?? 3600,
          feeLimit: input.guidedDraft.feeLimit ?? '2000000000000000',
          maxValuePerUse: input.guidedDraft.maxValuePerUse ?? '10000000000000000',
          selectedAppIds: input.guidedDraft.selectedAppIds ?? [],
          transferTargets: input.guidedDraft.transferTargets ?? [],
        };
        guidedTemplateJson = buildGuidedTemplateJson(draft);
      }

      const preview = getPolicyPreview({
        presetId: input.selectedPreset,
        policyMode: input.policyMode,
        customPolicyJson: input.customPolicyJson,
        guidedDraft: input.guidedDraft,
      });
      const risk = assessPolicyRisk(preview);
      return {
        preview,
        risk,
        error: null,
        guidedTemplateJson,
      };
    } catch (error) {
      return {
        preview: null,
        risk: null,
        error: error instanceof Error ? error.message : String(error),
        guidedTemplateJson,
      };
    }
  }, [input]);
}
