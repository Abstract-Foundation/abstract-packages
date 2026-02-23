const ADDRESS_PATTERN = /^0x[0-9a-fA-F]{40}$/;
const SELECTOR_PATTERN = /^0x[0-9a-fA-F]{8}$/;
const UINT_PATTERN = /^\d+$/;

const DEFAULT_MAX_SESSION_LIFETIME_SECONDS = 30 * 24 * 60 * 60;
const EQUAL_CONDITION = 1n;
const UNSAFE_DESTINATION_SELECTORS = new Set(["0xa22cb465", "0x095ea7b3", "0xa9059cbb"]);

export interface SessionPolicyLintInput {
  expiresAt: number;
  sessionConfig: unknown;
}

export interface SessionPolicyLintOptions {
  nowUnixSeconds?: number;
  maxSessionLifetimeSeconds?: number;
}

export interface SessionPolicyLintIssue {
  code: string;
  path: string;
  message: string;
  recommendation: string;
}

type NormalizedLimitType = "unlimited" | "lifetime" | "allowance";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function parseUint(value: unknown): bigint | null {
  if (typeof value === "bigint") {
    return value >= 0n ? value : null;
  }

  if (typeof value === "number") {
    if (!Number.isInteger(value) || value < 0) {
      return null;
    }
    return BigInt(value);
  }

  if (typeof value === "string" && UINT_PATTERN.test(value.trim())) {
    return BigInt(value.trim());
  }

  return null;
}

function parseLimitType(value: unknown): NormalizedLimitType | null {
  if (typeof value === "number" || typeof value === "bigint") {
    if (value === 0 || value === 0n) {
      return "unlimited";
    }
    if (value === 1 || value === 1n) {
      return "lifetime";
    }
    if (value === 2 || value === 2n) {
      return "allowance";
    }
    return null;
  }

  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  if (normalized === "0" || normalized === "unlimited" || normalized.endsWith(".unlimited")) {
    return "unlimited";
  }
  if (normalized === "1" || normalized === "lifetime" || normalized.endsWith(".lifetime")) {
    return "lifetime";
  }
  if (normalized === "2" || normalized === "allowance" || normalized.endsWith(".allowance")) {
    return "allowance";
  }

  return null;
}

function pushIssue(
  issues: SessionPolicyLintIssue[],
  code: string,
  path: string,
  message: string,
  recommendation: string,
): void {
  issues.push({
    code,
    path,
    message,
    recommendation,
  });
}

function lintLimitObject(
  issues: SessionPolicyLintIssue[],
  value: unknown,
  path: string,
  fieldName: string,
): { bounded: boolean } {
  if (!isRecord(value)) {
    pushIssue(
      issues,
      `${fieldName}.invalid`,
      path,
      `${fieldName} must be a limit object with limitType/limit/period fields.`,
      `Set ${path}.limitType to Lifetime or Allowance with an explicit numeric limit.`,
    );
    return { bounded: false };
  }

  const limitType = parseLimitType(value.limitType);
  if (!limitType) {
    pushIssue(
      issues,
      `${fieldName}.invalid`,
      path,
      `${fieldName}.limitType is invalid.`,
      `Use ${path}.limitType as 1 (Lifetime) or 2 (Allowance).`,
    );
    return { bounded: false };
  }

  if (limitType === "unlimited") {
    pushIssue(
      issues,
      `${fieldName}.unbounded`,
      path,
      `${fieldName} is unlimited.`,
      `Replace ${path} with a bounded Lifetime/Allowance limit.`,
    );
    return { bounded: false };
  }

  const limit = parseUint(value.limit);
  if (limit === null) {
    pushIssue(
      issues,
      `${fieldName}.invalid`,
      `${path}.limit`,
      `${fieldName}.limit must be a non-negative integer.`,
      `Set ${path}.limit to a base-10 integer.`,
    );
    return { bounded: false };
  }

  if (limitType === "allowance") {
    const period = parseUint(value.period);
    if (period === null || period <= 0n) {
      pushIssue(
        issues,
        `${fieldName}.invalid`,
        `${path}.period`,
        `${fieldName}.period must be a positive integer for allowance limits.`,
        `Set ${path}.period to a positive number of seconds.`,
      );
      return { bounded: false };
    }
  }

  return { bounded: true };
}

function parseConstraintCondition(value: unknown): bigint | null {
  if (typeof value === "bigint") {
    return value;
  }
  if (typeof value === "number" && Number.isInteger(value)) {
    return BigInt(value);
  }
  if (typeof value === "string" && UINT_PATTERN.test(value.trim())) {
    return BigInt(value.trim());
  }
  if (typeof value === "string" && value.trim().toLowerCase() === "equal") {
    return EQUAL_CONDITION;
  }
  return null;
}

function hasDestinationConstraint(policy: Record<string, unknown>): boolean {
  const constraints = policy.constraints;
  if (!Array.isArray(constraints)) {
    return false;
  }

  return constraints.some(entry => {
    if (!isRecord(entry)) {
      return false;
    }

    const index = parseUint(entry.index);
    const condition = parseConstraintCondition(entry.condition);
    return index === 0n && condition === EQUAL_CONDITION;
  });
}

function lintExpiresAt(
  issues: SessionPolicyLintIssue[],
  input: SessionPolicyLintInput,
  options: SessionPolicyLintOptions,
): void {
  if (!Number.isInteger(input.expiresAt) || input.expiresAt <= 0) {
    pushIssue(
      issues,
      "expiresAt.invalid",
      "expiresAt",
      "expiresAt must be a positive unix timestamp in seconds.",
      "Set expiresAt to a future unix timestamp (seconds).",
    );
    return;
  }

  const nowUnixSeconds = options.nowUnixSeconds ?? Math.floor(Date.now() / 1000);
  const maxSessionLifetimeSeconds = options.maxSessionLifetimeSeconds ?? DEFAULT_MAX_SESSION_LIFETIME_SECONDS;

  if (input.expiresAt <= nowUnixSeconds) {
    pushIssue(
      issues,
      "expiresAt.expired",
      "expiresAt",
      "Session is already expired.",
      "Create a new session with a future expiresAt value.",
    );
  }

  if (input.expiresAt - nowUnixSeconds > maxSessionLifetimeSeconds) {
    pushIssue(
      issues,
      "expiresAt.too_long",
      "expiresAt",
      `Session lifetime exceeds ${maxSessionLifetimeSeconds} seconds.`,
      `Use a shorter session lifetime (<= ${maxSessionLifetimeSeconds} seconds).`,
    );
  }
}

function lintFeeLimit(issues: SessionPolicyLintIssue[], sessionConfig: Record<string, unknown>): void {
  const feeLimit = sessionConfig.feeLimit;
  if (feeLimit === undefined) {
    pushIssue(
      issues,
      "sessionConfig.feeLimit.required",
      "sessionConfig.feeLimit",
      "feeLimit is required.",
      "Set an explicit bounded feeLimit.",
    );
    return;
  }

  if (typeof feeLimit === "string" || typeof feeLimit === "number" || typeof feeLimit === "bigint") {
    const parsed = parseUint(feeLimit);
    if (parsed === null) {
      pushIssue(
        issues,
        "sessionConfig.feeLimit.invalid",
        "sessionConfig.feeLimit",
        "feeLimit must be a non-negative integer.",
        "Set feeLimit to a base-10 integer string.",
      );
    }
    return;
  }

  lintLimitObject(issues, feeLimit, "sessionConfig.feeLimit", "sessionConfig.feeLimit");
}

function lintCallPolicies(
  issues: SessionPolicyLintIssue[],
  sessionConfig: Record<string, unknown>,
): { hasPolicies: boolean; hasExplicitValueBounds: boolean } {
  const callPolicies = sessionConfig.callPolicies;
  if (!Array.isArray(callPolicies)) {
    pushIssue(
      issues,
      "sessionConfig.callPolicies.invalid",
      "sessionConfig.callPolicies",
      "callPolicies must be an array.",
      "Set callPolicies to an array of {target, selector} entries.",
    );
    return { hasPolicies: false, hasExplicitValueBounds: false };
  }

  const seenKeys = new Set<string>();
  let hasExplicitValueBounds = false;

  for (const [index, entry] of callPolicies.entries()) {
    const itemPath = `sessionConfig.callPolicies[${index}]`;
    if (!isRecord(entry)) {
      pushIssue(
        issues,
        `${itemPath}.invalid`,
        itemPath,
        "call policy entry must be an object.",
        "Provide an object with target and selector.",
      );
      continue;
    }

    const target = entry.target;
    if (typeof target !== "string" || !ADDRESS_PATTERN.test(target)) {
      pushIssue(
        issues,
        `${itemPath}.target_invalid`,
        `${itemPath}.target`,
        "target must be a 20-byte 0x-prefixed address.",
        "Set target to a specific contract address.",
      );
    }

    const selector = entry.selector;
    if (typeof selector !== "string") {
      pushIssue(
        issues,
        `${itemPath}.selector_required`,
        `${itemPath}.selector`,
        "selector is required for least-privilege call scoping.",
        "Set selector to an exact 4-byte function selector (e.g. 0xa9059cbb).",
      );
      continue;
    }

    if (!SELECTOR_PATTERN.test(selector)) {
      pushIssue(
        issues,
        `${itemPath}.selector_invalid`,
        `${itemPath}.selector`,
        "selector must be a 4-byte 0x-prefixed hex value.",
        "Use selector format 0x12345678.",
      );
      continue;
    }

    if (typeof target === "string" && ADDRESS_PATTERN.test(target)) {
      const key = `${target.toLowerCase()}:${selector.toLowerCase()}`;
      if (seenKeys.has(key)) {
        pushIssue(
          issues,
          `${itemPath}.duplicate`,
          itemPath,
          "duplicate target+selector policy entry.",
          "Remove duplicate call policy entries.",
        );
      } else {
        seenKeys.add(key);
      }
    }

    const maxValuePerUse = entry.maxValuePerUse;
    if (maxValuePerUse !== undefined) {
      const parsedMaxValue = parseUint(maxValuePerUse);
      if (parsedMaxValue === null) {
        pushIssue(
          issues,
          `${itemPath}.maxValuePerUse_invalid`,
          `${itemPath}.maxValuePerUse`,
          "maxValuePerUse must be a non-negative integer.",
          "Set maxValuePerUse to a bounded integer value.",
        );
      } else {
        hasExplicitValueBounds = true;
      }
    }

    const valueLimit = entry.valueLimit;
    if (valueLimit !== undefined) {
      const result = lintLimitObject(issues, valueLimit, `${itemPath}.valueLimit`, `${itemPath}.valueLimit`);
      hasExplicitValueBounds = hasExplicitValueBounds || result.bounded;
    }

    const normalizedSelector = selector.toLowerCase();
    if (UNSAFE_DESTINATION_SELECTORS.has(normalizedSelector) && !hasDestinationConstraint(entry)) {
      pushIssue(
        issues,
        `${itemPath}.unsafe_destination`,
        `${itemPath}.constraints`,
        "approval/transfer-like selector is missing destination constraints.",
        "Add a constraint with index=0 and condition=Equal to pin the destination address.",
      );
    }
  }

  return {
    hasPolicies: callPolicies.length > 0,
    hasExplicitValueBounds,
  };
}

function lintTransferPolicies(
  issues: SessionPolicyLintIssue[],
  sessionConfig: Record<string, unknown>,
): { hasPolicies: boolean; hasExplicitValueBounds: boolean } {
  const transferPolicies = sessionConfig.transferPolicies;
  if (!Array.isArray(transferPolicies)) {
    pushIssue(
      issues,
      "sessionConfig.transferPolicies.invalid",
      "sessionConfig.transferPolicies",
      "transferPolicies must be an array.",
      "Set transferPolicies to an array of bounded transfer policy entries.",
    );
    return { hasPolicies: false, hasExplicitValueBounds: false };
  }

  let hasExplicitValueBounds = false;

  for (const [index, entry] of transferPolicies.entries()) {
    const itemPath = `sessionConfig.transferPolicies[${index}]`;
    if (!isRecord(entry)) {
      pushIssue(
        issues,
        `${itemPath}.invalid`,
        itemPath,
        "transfer policy entry must be an object.",
        "Provide an object with target/tokenAddress and value bounds.",
      );
      continue;
    }

    const target = typeof entry.target === "string" ? entry.target : entry.tokenAddress;
    if (typeof target !== "string" || !ADDRESS_PATTERN.test(target)) {
      pushIssue(
        issues,
        `${itemPath}.target_invalid`,
        `${itemPath}.target`,
        "target/tokenAddress must be a 20-byte 0x-prefixed address.",
        "Set target/tokenAddress to an explicit token/recipient address.",
      );
    }

    const rawMaxValue = entry.maxValuePerUse ?? entry.maxAmountBaseUnit;
    if (rawMaxValue === undefined) {
      pushIssue(
        issues,
        `${itemPath}.max_value_required`,
        itemPath,
        "transfer policy is missing max value bound.",
        "Set maxValuePerUse or maxAmountBaseUnit to a non-negative integer.",
      );
    } else if (parseUint(rawMaxValue) === null) {
      pushIssue(
        issues,
        `${itemPath}.max_value_invalid`,
        `${itemPath}.maxValuePerUse`,
        "transfer max value must be a non-negative integer.",
        "Set transfer max value as a base-10 integer string.",
      );
    } else {
      hasExplicitValueBounds = true;
    }

    if (entry.valueLimit !== undefined) {
      const result = lintLimitObject(issues, entry.valueLimit, `${itemPath}.valueLimit`, `${itemPath}.valueLimit`);
      hasExplicitValueBounds = hasExplicitValueBounds || result.bounded;
    }
  }

  return {
    hasPolicies: transferPolicies.length > 0,
    hasExplicitValueBounds,
  };
}

function lintValueLimits(
  issues: SessionPolicyLintIssue[],
  sessionConfig: Record<string, unknown>,
  callPolicies: { hasPolicies: boolean; hasExplicitValueBounds: boolean },
  transferPolicies: { hasPolicies: boolean; hasExplicitValueBounds: boolean },
): void {
  let hasGlobalBound = false;

  if (sessionConfig.maxValuePerUse !== undefined) {
    const parsed = parseUint(sessionConfig.maxValuePerUse);
    if (parsed === null) {
      pushIssue(
        issues,
        "sessionConfig.maxValuePerUse.invalid",
        "sessionConfig.maxValuePerUse",
        "maxValuePerUse must be a non-negative integer.",
        "Set maxValuePerUse to an explicit bounded integer.",
      );
    } else {
      hasGlobalBound = true;
    }
  }

  if (callPolicies.hasPolicies || transferPolicies.hasPolicies) {
    const hasAnyBound = hasGlobalBound || callPolicies.hasExplicitValueBounds || transferPolicies.hasExplicitValueBounds;
    if (!hasAnyBound) {
      pushIssue(
        issues,
        "sessionConfig.value_limits.missing",
        "sessionConfig",
        "No explicit value bounds were found in policy configuration.",
        "Define maxValuePerUse or per-policy value limits.",
      );
    }
  }
}

export function lintSessionPolicy(input: SessionPolicyLintInput, options: SessionPolicyLintOptions = {}): SessionPolicyLintIssue[] {
  const issues: SessionPolicyLintIssue[] = [];
  lintExpiresAt(issues, input, options);

  if (!isRecord(input.sessionConfig)) {
    pushIssue(
      issues,
      "sessionConfig.invalid",
      "sessionConfig",
      "sessionConfig must be an object.",
      "Provide a valid AGW session config object.",
    );
    return issues;
  }

  lintFeeLimit(issues, input.sessionConfig);
  const callPolicies = lintCallPolicies(issues, input.sessionConfig);
  const transferPolicies = lintTransferPolicies(issues, input.sessionConfig);
  lintValueLimits(issues, input.sessionConfig, callPolicies, transferPolicies);

  return issues;
}

export function assertSafeSessionPolicy(input: SessionPolicyLintInput, options: SessionPolicyLintOptions = {}): void {
  const issues = lintSessionPolicy(input, options);
  if (issues.length === 0) {
    return;
  }

  const message = [
    `Session policy lint failed with ${issues.length} issue(s):`,
    ...issues.map(issue => `- ${issue.path}: ${issue.message} Recommendation: ${issue.recommendation}`),
  ].join("\n");

  throw new Error(message);
}
