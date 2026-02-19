import type { SessionCallPolicy, SessionPolicyConfig, SessionPolicyPresetTemplate, SessionTransferPolicy } from "./templates.js";

const ADDRESS_PATTERN = /^0x[0-9a-fA-F]{40}$/;
const SELECTOR_PATTERN = /^0x[0-9a-fA-F]{8}$/;
const UINT_PATTERN = /^\d+$/;
const PRESET_ID_PATTERN = /^(read_only|transfer|swap|contract_write|read_and_sign|limited_spend|custom)$/;

const MIN_EXPIRY_SECONDS = 300;
const MAX_EXPIRY_SECONDS = 24 * 60 * 60;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function validateAllowedKeys(value: Record<string, unknown>, allowedKeys: readonly string[], fieldName: string): void {
  for (const key of Object.keys(value)) {
    if (!allowedKeys.includes(key)) {
      throw new Error(`${fieldName}. Unexpected key: ${key}.`);
    }
  }
}

function validateUint(value: unknown, fieldName: string): void {
  if (typeof value !== "string" || !UINT_PATTERN.test(value)) {
    throw new Error(`${fieldName} must be a base-10 integer string.`);
  }
}

function validateCallPolicy(policy: unknown, index: number): void {
  if (!isRecord(policy)) {
    throw new Error(`callPolicies[${index}] must be an object.`);
  }
  validateAllowedKeys(policy, ["target", "selector"], `callPolicies[${index}]`);

  if (typeof policy.target !== "string") {
    throw new Error(`callPolicies[${index}].target must be a 20-byte 0x-prefixed hex address.`);
  }

  if (!ADDRESS_PATTERN.test(policy.target)) {
    throw new Error(`callPolicies[${index}].target must be a 20-byte 0x-prefixed hex address.`);
  }

  if (policy.selector !== undefined && (typeof policy.selector !== "string" || !SELECTOR_PATTERN.test(policy.selector))) {
    throw new Error(`callPolicies[${index}].selector must be a 4-byte 0x-prefixed hex selector.`);
  }
}

function validateTransferPolicy(policy: unknown, index: number): void {
  if (!isRecord(policy)) {
    throw new Error(`transferPolicies[${index}] must be an object.`);
  }
  validateAllowedKeys(policy, ["tokenAddress", "maxAmountBaseUnit"], `transferPolicies[${index}]`);

  if (typeof policy.tokenAddress !== "string") {
    throw new Error(`transferPolicies[${index}].tokenAddress must be a 20-byte 0x-prefixed hex address.`);
  }

  if (!ADDRESS_PATTERN.test(policy.tokenAddress)) {
    throw new Error(`transferPolicies[${index}].tokenAddress must be a 20-byte 0x-prefixed hex address.`);
  }

  validateUint(policy.maxAmountBaseUnit, `transferPolicies[${index}].maxAmountBaseUnit`);
}

export function validateSessionPolicyConfig(sessionConfig: SessionPolicyConfig): void {
  if (!isRecord(sessionConfig)) {
    throw new Error("sessionConfig must be an object.");
  }

  validateAllowedKeys(
    sessionConfig as unknown as Record<string, unknown>,
    ["feeLimit", "maxValuePerUse", "callPolicies", "transferPolicies"],
    "sessionConfig",
  );
  validateUint(sessionConfig.feeLimit, "feeLimit");
  validateUint(sessionConfig.maxValuePerUse, "maxValuePerUse");

  if (!Array.isArray(sessionConfig.callPolicies)) {
    throw new Error("callPolicies must be an array.");
  }

  if (!Array.isArray(sessionConfig.transferPolicies)) {
    throw new Error("transferPolicies must be an array.");
  }

  for (const [index, policy] of sessionConfig.callPolicies.entries()) {
    validateCallPolicy(policy, index);
  }

  for (const [index, policy] of sessionConfig.transferPolicies.entries()) {
    validateTransferPolicy(policy, index);
  }
}

export function validateSessionPolicyPresetTemplate(template: SessionPolicyPresetTemplate): void {
  if (!isRecord(template)) {
    throw new Error("template must be an object.");
  }

  validateAllowedKeys(
    template,
    ["id", "label", "description", "customMode", "expiresInSeconds", "sessionConfig"],
    "template",
  );

  if (typeof template.id !== "string" || !PRESET_ID_PATTERN.test(template.id)) {
    throw new Error(
      "template.id must be one of: read_only, transfer, swap, contract_write, read_and_sign, limited_spend, custom.",
    );
  }
  if (typeof template.label !== "string" || template.label.trim() === "") {
    throw new Error("template.label must be a non-empty string.");
  }
  if (typeof template.description !== "string" || template.description.trim() === "") {
    throw new Error("template.description must be a non-empty string.");
  }
  const expectedCustomMode = template.id === "custom";
  if (template.customMode !== expectedCustomMode) {
    throw new Error(`template.customMode must be ${expectedCustomMode} when template.id is "${template.id}".`);
  }

  if (!Number.isInteger(template.expiresInSeconds)) {
    throw new Error("expiresInSeconds must be an integer.");
  }
  if (template.expiresInSeconds < MIN_EXPIRY_SECONDS || template.expiresInSeconds > MAX_EXPIRY_SECONDS) {
    throw new Error(`expiresInSeconds must be between ${MIN_EXPIRY_SECONDS} and ${MAX_EXPIRY_SECONDS}.`);
  }

  validateSessionPolicyConfig(template.sessionConfig);
}

function parsePositiveInteger(value: unknown, fieldName: string): number {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string" && UINT_PATTERN.test(value.trim())
        ? Number.parseInt(value, 10)
        : Number.NaN;

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Invalid ${fieldName}. Expected a positive integer.`);
  }

  return parsed;
}

function parseSessionPolicyConfig(value: unknown): SessionPolicyConfig {
  if (!isRecord(value)) {
    throw new Error("Invalid custom policy sessionConfig.");
  }
  validateAllowedKeys(value, ["feeLimit", "maxValuePerUse", "callPolicies", "transferPolicies"], "Invalid custom policy sessionConfig");

  const callPoliciesRaw = value.callPolicies;
  const transferPoliciesRaw = value.transferPolicies;

  if (!Array.isArray(callPoliciesRaw) || !Array.isArray(transferPoliciesRaw)) {
    throw new Error("Invalid custom policy sessionConfig. callPolicies and transferPolicies must be arrays.");
  }

  const callPolicies: SessionCallPolicy[] = callPoliciesRaw.map((entry, index) => {
    if (!isRecord(entry) || typeof entry.target !== "string") {
      throw new Error(`Invalid custom policy callPolicies[${index}].`);
    }
    validateAllowedKeys(entry, ["target", "selector"], `Invalid custom policy callPolicies[${index}]`);

    const parsed: SessionCallPolicy = {
      target: entry.target.trim(),
    };

    if (entry.selector !== undefined) {
      if (typeof entry.selector !== "string") {
        throw new Error(`Invalid custom policy callPolicies[${index}].selector.`);
      }
      parsed.selector = entry.selector.trim();
    }

    return parsed;
  });

  const transferPolicies: SessionTransferPolicy[] = transferPoliciesRaw.map((entry, index) => {
    if (!isRecord(entry) || typeof entry.tokenAddress !== "string" || typeof entry.maxAmountBaseUnit !== "string") {
      throw new Error(`Invalid custom policy transferPolicies[${index}].`);
    }
    validateAllowedKeys(entry, ["tokenAddress", "maxAmountBaseUnit"], `Invalid custom policy transferPolicies[${index}]`);

    return {
      tokenAddress: entry.tokenAddress.trim(),
      maxAmountBaseUnit: entry.maxAmountBaseUnit.trim(),
    };
  });

  const feeLimit = value.feeLimit;
  const maxValuePerUse = value.maxValuePerUse;
  if (typeof feeLimit !== "string" || typeof maxValuePerUse !== "string") {
    throw new Error("Invalid custom policy sessionConfig. feeLimit and maxValuePerUse must be strings.");
  }

  return {
    feeLimit: feeLimit.trim(),
    maxValuePerUse: maxValuePerUse.trim(),
    callPolicies,
    transferPolicies,
  };
}

export function parseCustomTemplateInput(value: unknown): Pick<SessionPolicyPresetTemplate, "expiresInSeconds" | "sessionConfig"> {
  if (!isRecord(value)) {
    throw new Error("Invalid custom policy. Expected JSON object.");
  }
  validateAllowedKeys(value, ["expiresInSeconds", "sessionConfig"], "Invalid custom policy");

  return {
    expiresInSeconds: parsePositiveInteger(value.expiresInSeconds, "expiresInSeconds"),
    sessionConfig: parseSessionPolicyConfig(value.sessionConfig),
  };
}
