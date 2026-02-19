import {
  BUILT_IN_POLICY_PRESETS,
  type BuiltInSessionPolicyPresetId,
  CUSTOM_PRESET,
  DEFAULT_CUSTOM_TEMPLATE,
  type SessionPolicyConfig,
  type SessionPolicyPresetId,
  type SessionPolicyPresetTemplate,
} from "./templates.js";
import { parseCustomTemplateInput, validateSessionPolicyPresetTemplate } from "./validate.js";

export type { SessionPolicyPresetId, SessionPolicyPresetTemplate };

export interface PolicyPresetSummary {
  id: SessionPolicyPresetId;
  label: string;
  description: string;
  customMode: boolean;
}

export interface PolicyPreview {
  presetId: SessionPolicyPresetId;
  label: string;
  description: string;
  policyPayload: {
    expiresAt: number;
    sessionConfig: SessionPolicyConfig;
  };
}

export interface BuildPolicyPreviewOptions {
  presetId: string;
  customTemplate?: SessionPolicyPresetTemplate;
  nowUnixSeconds?: number;
}

const SAFE_PRESET_IDS: readonly BuiltInSessionPolicyPresetId[] = [
  "read_only",
  "transfer",
  "swap",
  "contract_write",
  "read_and_sign",
  "limited_spend",
];
const CUSTOM_PRESET_METADATA_KEYS = ["id", "label", "description", "customMode"] as const;
const CUSTOM_TEMPLATE_ALLOWED_KEYS = [
  "id",
  "label",
  "description",
  "customMode",
  "expiresInSeconds",
  "sessionConfig",
] as const;

function validateCustomPresetMetadata(): void {
  const presetMetadata = CUSTOM_PRESET as unknown as Record<string, unknown>;
  for (const key of Object.keys(presetMetadata)) {
    if (!CUSTOM_PRESET_METADATA_KEYS.includes(key as (typeof CUSTOM_PRESET_METADATA_KEYS)[number])) {
      throw new Error(`Invalid custom preset metadata: unexpected key "${key}".`);
    }
  }

  if (CUSTOM_PRESET.id !== "custom") {
    throw new Error('Invalid custom preset metadata: id must be "custom".');
  }
  if (CUSTOM_PRESET.customMode !== true) {
    throw new Error("Invalid custom preset metadata: customMode must be true.");
  }
  if (typeof CUSTOM_PRESET.label !== "string" || CUSTOM_PRESET.label.trim() === "") {
    throw new Error("Invalid custom preset metadata: label must be a non-empty string.");
  }
  if (typeof CUSTOM_PRESET.description !== "string" || CUSTOM_PRESET.description.trim() === "") {
    throw new Error("Invalid custom preset metadata: description must be a non-empty string.");
  }
}

function validateCustomTemplateInputShape(templateInput: unknown): void {
  if (!templateInput || typeof templateInput !== "object" || Array.isArray(templateInput)) {
    throw new Error("Invalid custom policy template input. Expected an object.");
  }

  const templateInputRecord = templateInput as Record<string, unknown>;
  for (const key of Object.keys(templateInputRecord)) {
    if (!CUSTOM_TEMPLATE_ALLOWED_KEYS.includes(key as (typeof CUSTOM_TEMPLATE_ALLOWED_KEYS)[number])) {
      throw new Error(`Invalid custom policy template input. Unexpected key: ${key}.`);
    }
  }

  if ("id" in templateInputRecord && templateInputRecord.id !== "custom") {
    throw new Error('Invalid custom policy template input. id must be "custom".');
  }

  if ("customMode" in templateInputRecord && templateInputRecord.customMode !== true) {
    throw new Error("Invalid custom policy template input. customMode must be true.");
  }

  if ("label" in templateInputRecord) {
    if (typeof templateInputRecord.label !== "string" || templateInputRecord.label.trim() === "") {
      throw new Error("Invalid custom policy template input. label must be a non-empty string.");
    }
  }

  if ("description" in templateInputRecord) {
    if (typeof templateInputRecord.description !== "string" || templateInputRecord.description.trim() === "") {
      throw new Error("Invalid custom policy template input. description must be a non-empty string.");
    }
  }
}

function cloneSessionConfig(sessionConfig: SessionPolicyConfig): SessionPolicyConfig {
  return {
    feeLimit: sessionConfig.feeLimit,
    maxValuePerUse: sessionConfig.maxValuePerUse,
    callPolicies: sessionConfig.callPolicies.map(policy => ({
      target: policy.target,
      selector: policy.selector,
    })),
    transferPolicies: sessionConfig.transferPolicies.map(policy => ({
      tokenAddress: policy.tokenAddress,
      maxAmountBaseUnit: policy.maxAmountBaseUnit,
    })),
  };
}

function toCustomTemplate(templateInput: SessionPolicyPresetTemplate): SessionPolicyPresetTemplate {
  validateCustomPresetMetadata();
  validateCustomTemplateInputShape(templateInput);

  const templateForValidation: SessionPolicyPresetTemplate = {
    ...CUSTOM_PRESET,
    expiresInSeconds: templateInput.expiresInSeconds,
    sessionConfig: templateInput.sessionConfig,
  };
  validateSessionPolicyPresetTemplate(templateForValidation);

  return {
    ...CUSTOM_PRESET,
    expiresInSeconds: templateForValidation.expiresInSeconds,
    sessionConfig: cloneSessionConfig(templateForValidation.sessionConfig),
  };
}

function validatePresetTemplate(template: SessionPolicyPresetTemplate, presetId: SessionPolicyPresetId): SessionPolicyPresetTemplate {
  try {
    validateSessionPolicyPresetTemplate(template);
  } catch (error) {
    throw new Error(
      `Invalid policy preset template "${presetId}": ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  return template;
}

function getValidatedBuiltInPresetTemplate(presetId: BuiltInSessionPolicyPresetId): SessionPolicyPresetTemplate {
  const template = BUILT_IN_POLICY_PRESETS[presetId];
  if (!template) {
    throw new Error(`Invalid policy preset registry: missing preset template for key "${presetId}".`);
  }
  if (template.id !== presetId) {
    throw new Error(`Invalid policy preset registry: key "${presetId}" does not match preset id "${template.id}".`);
  }

  return validatePresetTemplate(template, presetId);
}

function listValidatedBuiltInPresetTemplates(): SessionPolicyPresetTemplate[] {
  return SAFE_PRESET_IDS.map(presetId => getValidatedBuiltInPresetTemplate(presetId));
}

function getPresetTemplate(options: BuildPolicyPreviewOptions): SessionPolicyPresetTemplate {
  if (options.presetId === "custom") {
    try {
      return toCustomTemplate(options.customTemplate ?? DEFAULT_CUSTOM_TEMPLATE);
    } catch (error) {
      throw new Error(`Invalid custom policy: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  if (!SAFE_PRESET_IDS.includes(options.presetId as BuiltInSessionPolicyPresetId)) {
    throw new Error(`Unknown policy preset: ${options.presetId}`);
  }

  return getValidatedBuiltInPresetTemplate(options.presetId as BuiltInSessionPolicyPresetId);
}

export function listPolicyPresets(): PolicyPresetSummary[] {
  validateCustomPresetMetadata();
  const validatedPresets = listValidatedBuiltInPresetTemplates();
  void getDefaultCustomPolicyTemplate();

  return [
    ...validatedPresets.map(preset => ({
      id: preset.id,
      label: preset.label,
      description: preset.description,
      customMode: false,
    })),
    {
      ...CUSTOM_PRESET,
    },
  ];
}

export function buildPolicyPreview(options: BuildPolicyPreviewOptions): PolicyPreview {
  const template = getPresetTemplate(options);
  const nowUnixSeconds = options.nowUnixSeconds ?? Math.floor(Date.now() / 1000);
  if (!Number.isInteger(nowUnixSeconds) || nowUnixSeconds < 0) {
    throw new Error("Invalid policy preview time.");
  }

  return {
    presetId: template.id,
    label: template.label,
    description: template.description,
    policyPayload: {
      expiresAt: nowUnixSeconds + template.expiresInSeconds,
      sessionConfig: cloneSessionConfig(template.sessionConfig),
    },
  };
}

export function getDefaultCustomPolicyTemplate(): Pick<SessionPolicyPresetTemplate, "expiresInSeconds" | "sessionConfig"> {
  let validatedTemplate: SessionPolicyPresetTemplate;
  try {
    validatedTemplate = toCustomTemplate(DEFAULT_CUSTOM_TEMPLATE);
  } catch (error) {
    throw new Error(
      `Invalid default custom policy template: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  return {
    expiresInSeconds: validatedTemplate.expiresInSeconds,
    sessionConfig: cloneSessionConfig(validatedTemplate.sessionConfig),
  };
}

export function parseCustomPolicyTemplate(rawInput: string): SessionPolicyPresetTemplate {
  validateCustomPresetMetadata();
  let parsed: unknown;

  try {
    parsed = JSON.parse(rawInput);
  } catch {
    throw new Error("Invalid custom policy. Expected JSON input.");
  }

  const customTemplateInput = parseCustomTemplateInput(parsed);
  const customTemplate = {
    ...CUSTOM_PRESET,
    expiresInSeconds: customTemplateInput.expiresInSeconds,
    sessionConfig: customTemplateInput.sessionConfig,
  };

  try {
    validateSessionPolicyPresetTemplate(customTemplate);
  } catch (error) {
    throw new Error(`Invalid custom policy: ${error instanceof Error ? error.message : String(error)}`);
  }

  return customTemplate;
}
