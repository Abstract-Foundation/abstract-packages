import type { PolicyPreview, SecurityAssessment } from './policy-types';
import { HIGH_RISK_EXPIRY_SECONDS, HIGH_RISK_MAX_VALUE_PER_USE } from './config';

export function assessPolicyRisk(preview: PolicyPreview): SecurityAssessment {
  const reasons: string[] = [];
  const { policyPayload } = preview;
  const nowUnixSeconds = Math.floor(Date.now() / 1000);
  const maxValuePerUse = BigInt(policyPayload.sessionConfig.maxValuePerUse);
  const lifetime = policyPayload.expiresAt - nowUnixSeconds;
  const presetId = policyPayload.policyMeta?.presetId;
  const enabledTools = new Set(policyPayload.policyMeta?.enabledTools ?? []);
  let score = 0;

  if (lifetime > HIGH_RISK_EXPIRY_SECONDS) {
    score += 1;
    reasons.push('Session expiry exceeds recommended short-lived window (4h).');
  }
  if (lifetime > 12 * 60 * 60) {
    score += 1;
    reasons.push('Session expiry exceeds 12h and may be too broad for unattended workflows.');
  }

  if (maxValuePerUse > HIGH_RISK_MAX_VALUE_PER_USE) {
    score += 2;
    reasons.push('maxValuePerUse exceeds 1 ETH safety cap.');
  } else if (maxValuePerUse > 100_000_000_000_000_000n) {
    score += 1;
    reasons.push('maxValuePerUse exceeds 0.1 ETH moderate safety cap.');
  }

  if (policyPayload.sessionConfig.callPolicies.some(policy => !policy.selector)) {
    score += 1;
    reasons.push('One or more call policies are not selector-scoped.');
  }

  if (enabledTools.has('deploy_contract')) {
    score += 2;
    reasons.push('Deployment permissions are enabled.');
  }
  if (enabledTools.has('sign_message') || enabledTools.has('sign_transaction')) {
    score += 1;
    reasons.push('Off-chain signing capabilities are enabled.');
  }
  if (presetId === 'full_app_control') {
    score += 2;
    reasons.push('Preset grants full control over selected app contracts.');
  }

  if (policyPayload.policyMeta?.mode === 'advanced') {
    score += 1;
    reasons.push('Advanced mode bypasses guided guardrails.');
  }
  if ((policyPayload.policyMeta?.unverifiedAppIds.length ?? 0) > 0) {
    score += 1;
    reasons.push('One or more selected apps have unverified contract mappings.');
  }
  if ((policyPayload.policyMeta?.warnings.length ?? 0) > 0) {
    score += 1;
    reasons.push(...policyPayload.policyMeta!.warnings);
  }

  const level: SecurityAssessment['level'] =
    score >= 5 ? 'critical' : score >= 3 ? 'high' : score >= 1 ? 'medium' : 'low';
  const requiresConfirmation = level === 'high' || level === 'critical';

  return { level, requiresConfirmation, reasons };
}
