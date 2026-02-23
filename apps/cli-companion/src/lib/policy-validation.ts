import {
  BUILT_IN_POLICY_PRESETS,
  CUSTOM_PRESET,
  ALL_SESSION_TOOLS,
} from './policy-presets';
import {
  compileGuidedPolicy,
  toPolicyPreview,
  buildDefaultCustomTemplateJson,
} from './policy-compiler';
import { POLICY_MAX_EXPIRY_SECONDS, POLICY_MIN_EXPIRY_SECONDS } from './config';
import type {
  GuidedSessionPolicyDraft,
  PolicyMode,
  PolicyPreview,
  SessionCallPolicy,
  SessionPolicyConfig,
  SessionPolicyMeta,
  SessionPolicyPresetId,
  SessionPolicyPresetTemplate,
  SessionToolName,
  SessionTransferPolicy,
} from './policy-types';

const ADDRESS_PATTERN = /^0x[0-9a-fA-F]{40}$/;
const SELECTOR_PATTERN = /^0x[0-9a-fA-F]{8}$/;
const UINT_PATTERN = /^\d+$/;
const PRESET_IDS = new Set<SessionPolicyPresetId>([
  ...Object.keys(BUILT_IN_POLICY_PRESETS),
  CUSTOM_PRESET.id,
] as SessionPolicyPresetId[]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function validateAllowedKeys(value: Record<string, unknown>, allowedKeys: readonly string[], fieldName: string): void {
  for (const key of Object.keys(value)) {
    if (!allowedKeys.includes(key)) {
      throw new Error(`${fieldName}. Unexpected key: ${key}.`);
    }
  }
}

function validateUint(value: unknown, fieldName: string): void {
  if (typeof value !== 'string' || !UINT_PATTERN.test(value)) {
    throw new Error(`${fieldName} must be a base-10 integer string.`);
  }
}

function validateCallPolicy(policy: unknown, index: number): void {
  if (!isRecord(policy)) {
    throw new Error(`callPolicies[${index}] must be an object.`);
  }
  validateAllowedKeys(policy, ['target', 'selector'], `callPolicies[${index}]`);

  if (typeof policy.target !== 'string' || !ADDRESS_PATTERN.test(policy.target)) {
    throw new Error(`callPolicies[${index}].target must be a 20-byte 0x-prefixed hex address.`);
  }

  if (policy.selector !== undefined && (typeof policy.selector !== 'string' || !SELECTOR_PATTERN.test(policy.selector))) {
    throw new Error(`callPolicies[${index}].selector must be a 4-byte 0x-prefixed hex selector.`);
  }
}

function validateTransferPolicy(policy: unknown, index: number): void {
  if (!isRecord(policy)) {
    throw new Error(`transferPolicies[${index}] must be an object.`);
  }
  validateAllowedKeys(policy, ['target', 'maxValuePerUse'], `transferPolicies[${index}]`);

  if (typeof policy.target !== 'string' || !ADDRESS_PATTERN.test(policy.target)) {
    throw new Error(`transferPolicies[${index}].target must be a 20-byte 0x-prefixed hex address.`);
  }

  validateUint(policy.maxValuePerUse, `transferPolicies[${index}].maxValuePerUse`);
}

function validateToolList(value: unknown, fieldName: string): void {
  if (!Array.isArray(value)) {
    throw new Error(`${fieldName} must be an array.`);
  }

  for (const [index, tool] of value.entries()) {
    if (typeof tool !== 'string' || !(ALL_SESSION_TOOLS as string[]).includes(tool)) {
      throw new Error(`${fieldName}[${index}] is not a supported MCP tool.`);
    }
  }
}

export function validateSessionPolicyConfig(sessionConfig: SessionPolicyConfig): void {
  if (!isRecord(sessionConfig)) {
    throw new Error('sessionConfig must be an object.');
  }

  validateAllowedKeys(sessionConfig, ['feeLimit', 'maxValuePerUse', 'callPolicies', 'transferPolicies'], 'sessionConfig');

  validateUint(sessionConfig.feeLimit, 'feeLimit');
  validateUint(sessionConfig.maxValuePerUse, 'maxValuePerUse');

  if (!Array.isArray(sessionConfig.callPolicies)) {
    throw new Error('callPolicies must be an array.');
  }

  if (!Array.isArray(sessionConfig.transferPolicies)) {
    throw new Error('transferPolicies must be an array.');
  }

  for (const [index, policy] of sessionConfig.callPolicies.entries()) {
    validateCallPolicy(policy, index);
  }

  for (const [index, policy] of sessionConfig.transferPolicies.entries()) {
    validateTransferPolicy(policy, index);
  }
}

export function validateSessionPolicyMeta(policyMeta: SessionPolicyMeta): void {
  if (!isRecord(policyMeta)) {
    throw new Error('policyMeta must be an object.');
  }

  validateAllowedKeys(
    policyMeta,
    [
      'version',
      'mode',
      'presetId',
      'presetLabel',
      'enabledTools',
      'selectedAppIds',
      'selectedContractAddresses',
      'unverifiedAppIds',
      'warnings',
      'generatedAt',
    ],
    'policyMeta',
  );

  if (policyMeta.version !== 1) {
    throw new Error('policyMeta.version must equal 1.');
  }

  if (policyMeta.mode !== 'guided' && policyMeta.mode !== 'advanced') {
    throw new Error('policyMeta.mode must be either "guided" or "advanced".');
  }

  if (typeof policyMeta.presetId !== 'string' || !PRESET_IDS.has(policyMeta.presetId as SessionPolicyPresetId)) {
    throw new Error('policyMeta.presetId is invalid.');
  }

  if (typeof policyMeta.presetLabel !== 'string' || policyMeta.presetLabel.trim() === '') {
    throw new Error('policyMeta.presetLabel must be a non-empty string.');
  }

  validateToolList(policyMeta.enabledTools, 'policyMeta.enabledTools');

  if (!Array.isArray(policyMeta.selectedAppIds) || !policyMeta.selectedAppIds.every(entry => typeof entry === 'string')) {
    throw new Error('policyMeta.selectedAppIds must be a string array.');
  }
  if (
    !Array.isArray(policyMeta.selectedContractAddresses) ||
    !policyMeta.selectedContractAddresses.every(entry => typeof entry === 'string' && ADDRESS_PATTERN.test(entry))
  ) {
    throw new Error('policyMeta.selectedContractAddresses must be an address array.');
  }
  if (
    !Array.isArray(policyMeta.unverifiedAppIds) ||
    !policyMeta.unverifiedAppIds.every(entry => typeof entry === 'string')
  ) {
    throw new Error('policyMeta.unverifiedAppIds must be a string array.');
  }
  if (!Array.isArray(policyMeta.warnings) || !policyMeta.warnings.every(entry => typeof entry === 'string')) {
    throw new Error('policyMeta.warnings must be a string array.');
  }
  if (!Number.isInteger(policyMeta.generatedAt) || policyMeta.generatedAt <= 0) {
    throw new Error('policyMeta.generatedAt must be a positive unix timestamp in seconds.');
  }
}

export function validateSessionPolicyPresetTemplate(template: SessionPolicyPresetTemplate): void {
  if (!isRecord(template)) {
    throw new Error('template must be an object.');
  }

  validateAllowedKeys(
    template,
    ['id', 'label', 'description', 'customMode', 'riskHint', 'requiresDangerAcknowledgement', 'defaultLimits', 'enabledTools'],
    'template',
  );

  if (typeof template.id !== 'string' || !PRESET_IDS.has(template.id as SessionPolicyPresetId)) {
    throw new Error('template.id is invalid.');
  }
  if (template.customMode !== false) {
    throw new Error('template.customMode must be false for built-in templates.');
  }
  if (typeof template.label !== 'string' || template.label.trim() === '') {
    throw new Error('template.label must be a non-empty string.');
  }
  if (typeof template.description !== 'string' || template.description.trim() === '') {
    throw new Error('template.description must be a non-empty string.');
  }
  if (!['low', 'medium', 'high', 'critical'].includes(template.riskHint)) {
    throw new Error('template.riskHint is invalid.');
  }
  if (typeof template.requiresDangerAcknowledgement !== 'boolean') {
    throw new Error('template.requiresDangerAcknowledgement must be a boolean.');
  }
  if (!isRecord(template.defaultLimits)) {
    throw new Error('template.defaultLimits must be an object.');
  }
  validateUint(template.defaultLimits.feeLimit, 'template.defaultLimits.feeLimit');
  validateUint(template.defaultLimits.maxValuePerUse, 'template.defaultLimits.maxValuePerUse');
  if (
    !Number.isInteger(template.defaultLimits.expiresInSeconds) ||
    template.defaultLimits.expiresInSeconds < POLICY_MIN_EXPIRY_SECONDS ||
    template.defaultLimits.expiresInSeconds > POLICY_MAX_EXPIRY_SECONDS
  ) {
    throw new Error(`template.defaultLimits.expiresInSeconds must be between ${POLICY_MIN_EXPIRY_SECONDS} and ${POLICY_MAX_EXPIRY_SECONDS}.`);
  }
  validateToolList(template.enabledTools, 'template.enabledTools');
}

function parsePositiveInteger(value: unknown, fieldName: string): number {
  const parsed =
    typeof value === 'number'
      ? value
      : typeof value === 'string' && UINT_PATTERN.test(value.trim())
        ? Number.parseInt(value, 10)
        : Number.NaN;

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Invalid ${fieldName}. Expected a positive integer.`);
  }

  return parsed;
}

function parseSessionPolicyConfig(value: unknown): SessionPolicyConfig {
  if (!isRecord(value)) {
    throw new Error('Invalid custom policy sessionConfig.');
  }

  validateAllowedKeys(value, ['feeLimit', 'maxValuePerUse', 'callPolicies', 'transferPolicies'], 'Invalid custom policy sessionConfig');

  const callPoliciesRaw = value.callPolicies;
  const transferPoliciesRaw = value.transferPolicies;

  if (!Array.isArray(callPoliciesRaw) || !Array.isArray(transferPoliciesRaw)) {
    throw new Error('Invalid custom policy sessionConfig. callPolicies and transferPolicies must be arrays.');
  }

  const callPolicies: SessionCallPolicy[] = callPoliciesRaw.map((entry, index) => {
    if (!isRecord(entry) || typeof entry.target !== 'string') {
      throw new Error(`Invalid custom policy callPolicies[${index}].`);
    }
    validateAllowedKeys(entry, ['target', 'selector'], `Invalid custom policy callPolicies[${index}]`);

    const parsed: SessionCallPolicy = {
      target: entry.target.trim(),
    };

    if (entry.selector !== undefined) {
      if (typeof entry.selector !== 'string') {
        throw new Error(`Invalid custom policy callPolicies[${index}].selector.`);
      }
      parsed.selector = entry.selector.trim();
    }

    return parsed;
  });

  const transferPolicies: SessionTransferPolicy[] = transferPoliciesRaw.map((entry, index) => {
    if (!isRecord(entry) || typeof entry.target !== 'string' || typeof entry.maxValuePerUse !== 'string') {
      throw new Error(`Invalid custom policy transferPolicies[${index}].`);
    }
    validateAllowedKeys(entry, ['target', 'maxValuePerUse'], `Invalid custom policy transferPolicies[${index}]`);

    return {
      target: entry.target.trim(),
      maxValuePerUse: entry.maxValuePerUse.trim(),
    };
  });

  const feeLimit = value.feeLimit;
  const maxValuePerUse = value.maxValuePerUse;
  if (typeof feeLimit !== 'string' || typeof maxValuePerUse !== 'string') {
    throw new Error('Invalid custom policy sessionConfig. feeLimit and maxValuePerUse must be strings.');
  }

  const parsedConfig: SessionPolicyConfig = {
    feeLimit: feeLimit.trim(),
    maxValuePerUse: maxValuePerUse.trim(),
    callPolicies,
    transferPolicies,
  };

  validateSessionPolicyConfig(parsedConfig);
  return parsedConfig;
}

function parseSessionPolicyMeta(value: unknown): SessionPolicyMeta {
  if (!isRecord(value)) {
    throw new Error('Invalid custom policy policyMeta.');
  }

  const parsed: SessionPolicyMeta = {
    version: value.version as 1,
    mode: value.mode as PolicyMode,
    presetId: value.presetId as SessionPolicyPresetId,
    presetLabel: value.presetLabel as string,
    enabledTools: value.enabledTools as SessionToolName[],
    selectedAppIds: value.selectedAppIds as string[],
    selectedContractAddresses: value.selectedContractAddresses as string[],
    unverifiedAppIds: value.unverifiedAppIds as string[],
    warnings: value.warnings as string[],
    generatedAt: value.generatedAt as number,
  };
  validateSessionPolicyMeta(parsed);
  return parsed;
}

export function parseCustomTemplateInput(value: unknown): {
  expiresInSeconds: number;
  sessionConfig: SessionPolicyConfig;
  policyMeta?: SessionPolicyMeta;
} {
  if (!isRecord(value)) {
    throw new Error('Invalid custom policy. Expected JSON object.');
  }
  validateAllowedKeys(value, ['expiresInSeconds', 'sessionConfig', 'policyMeta'], 'Invalid custom policy');

  return {
    expiresInSeconds: parsePositiveInteger(value.expiresInSeconds, 'expiresInSeconds'),
    sessionConfig: parseSessionPolicyConfig(value.sessionConfig),
    policyMeta: value.policyMeta === undefined ? undefined : parseSessionPolicyMeta(value.policyMeta),
  };
}

function normalizeCustomMeta(policyMeta: SessionPolicyMeta | undefined): SessionPolicyMeta {
  if (policyMeta) {
    return policyMeta;
  }

  return {
    version: 1,
    mode: 'advanced',
    presetId: 'custom',
    presetLabel: CUSTOM_PRESET.label,
    enabledTools: [...ALL_SESSION_TOOLS],
    selectedAppIds: [],
    selectedContractAddresses: [],
    unverifiedAppIds: [],
    warnings: [],
    generatedAt: Math.floor(Date.now() / 1000),
  };
}

export function parseCustomPolicyTemplate(rawInput: string): {
  presetId: SessionPolicyPresetId;
  label: string;
  description: string;
  expiresInSeconds: number;
  sessionConfig: SessionPolicyConfig;
  policyMeta: SessionPolicyMeta;
} {
  let parsed: unknown;

  try {
    parsed = JSON.parse(rawInput);
  } catch {
    throw new Error('Invalid custom policy. Expected JSON input.');
  }

  let customTemplateInput: {
    expiresInSeconds: number;
    sessionConfig: SessionPolicyConfig;
    policyMeta?: SessionPolicyMeta;
  };
  try {
    customTemplateInput = parseCustomTemplateInput(parsed);
  } catch (error) {
    throw new Error(`Invalid custom policy: ${error instanceof Error ? error.message : String(error)}`);
  }

  return {
    presetId: CUSTOM_PRESET.id,
    label: CUSTOM_PRESET.label,
    description: CUSTOM_PRESET.description,
    expiresInSeconds: customTemplateInput.expiresInSeconds,
    sessionConfig: customTemplateInput.sessionConfig,
    policyMeta: normalizeCustomMeta(customTemplateInput.policyMeta),
  };
}

function parseTransferTargets(raw: string[]): string[] {
  const deduped = new Set<string>();
  const parsed: string[] = [];
  for (const entry of raw) {
    const normalized = entry.trim();
    if (!normalized) {
      continue;
    }
    if (!ADDRESS_PATTERN.test(normalized)) {
      throw new Error(`transferTargets contains invalid address: ${entry}`);
    }
    const key = normalized.toLowerCase();
    if (deduped.has(key)) {
      continue;
    }
    deduped.add(key);
    parsed.push(normalized);
  }
  return parsed;
}

function normalizeGuidedDraft(
  presetId: SessionPolicyPresetId,
  guidedDraft?: Partial<GuidedSessionPolicyDraft>,
): GuidedSessionPolicyDraft {
  if (presetId === 'custom') {
    throw new Error('Guided draft normalization does not support custom preset.');
  }

  const defaults = BUILT_IN_POLICY_PRESETS[presetId].defaultLimits;
  const selectedAppIds = guidedDraft?.selectedAppIds ?? [];
  const transferTargets = parseTransferTargets(guidedDraft?.transferTargets ?? []);
  const expiresInSeconds = guidedDraft?.expiresInSeconds ?? defaults.expiresInSeconds;
  const feeLimit = guidedDraft?.feeLimit ?? defaults.feeLimit;
  const maxValuePerUse = guidedDraft?.maxValuePerUse ?? defaults.maxValuePerUse;

  if (!Number.isInteger(expiresInSeconds)) {
    throw new Error('expiresInSeconds must be an integer.');
  }
  if (expiresInSeconds < POLICY_MIN_EXPIRY_SECONDS || expiresInSeconds > POLICY_MAX_EXPIRY_SECONDS) {
    throw new Error(`expiresInSeconds must be between ${POLICY_MIN_EXPIRY_SECONDS} and ${POLICY_MAX_EXPIRY_SECONDS}.`);
  }
  validateUint(feeLimit, 'feeLimit');
  validateUint(maxValuePerUse, 'maxValuePerUse');

  return {
    presetId,
    selectedAppIds,
    transferTargets,
    expiresInSeconds,
    feeLimit,
    maxValuePerUse,
  };
}

export function getPolicyPreview(options: {
  presetId: SessionPolicyPresetId;
  customPolicyJson?: string;
  policyMode?: PolicyMode;
  guidedDraft?: Partial<GuidedSessionPolicyDraft>;
  nowUnixSeconds?: number;
}): PolicyPreview {
  const nowUnixSeconds = options.nowUnixSeconds ?? Math.floor(Date.now() / 1000);
  const mode = options.policyMode ?? (options.presetId === 'custom' ? 'advanced' : 'guided');

  if (options.presetId === 'custom' || mode === 'advanced') {
    const customInput = options.customPolicyJson?.trim() || buildDefaultCustomTemplateJson();
    const template = parseCustomPolicyTemplate(customInput);
    return {
      presetId: template.presetId,
      label: template.label,
      description: template.description,
      policyPayload: {
        expiresAt: nowUnixSeconds + template.expiresInSeconds,
        sessionConfig: template.sessionConfig,
        policyMeta: {
          ...template.policyMeta,
          mode: 'advanced',
          generatedAt: nowUnixSeconds,
        },
      },
    };
  }

  const draft = normalizeGuidedDraft(options.presetId, options.guidedDraft);
  const compiled = compileGuidedPolicy(draft);
  return toPolicyPreview(compiled, nowUnixSeconds);
}
