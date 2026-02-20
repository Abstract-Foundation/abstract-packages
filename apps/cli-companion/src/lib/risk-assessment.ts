import type { PolicyPreview, SecurityAssessment } from './policy-types';
import { HIGH_RISK_EXPIRY_SECONDS, HIGH_RISK_MAX_VALUE_PER_USE } from './config';

export function assessPolicyRisk(preview: PolicyPreview): SecurityAssessment {
  const reasons: string[] = [];
  const { policyPayload } = preview;
  const maxValuePerUse = BigInt(policyPayload.sessionConfig.maxValuePerUse);

  if (policyPayload.expiresAt - Math.floor(Date.now() / 1000) > HIGH_RISK_EXPIRY_SECONDS) {
    reasons.push('Session expiry exceeds recommended short-lived window (4h).');
  }

  if (maxValuePerUse > HIGH_RISK_MAX_VALUE_PER_USE) {
    reasons.push('maxValuePerUse exceeds default safety cap.');
  }

  if (policyPayload.sessionConfig.callPolicies.some(policy => !policy.selector)) {
    reasons.push('One or more call policies are not selector-scoped.');
  }

  const requiresConfirmation = reasons.length > 0;

  return {
    level: requiresConfirmation ? 'high' : 'low',
    requiresConfirmation,
    reasons,
  };
}
