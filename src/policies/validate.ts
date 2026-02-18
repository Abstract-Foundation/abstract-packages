const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

interface ParsedCallPolicy {
  target: string;
  selector?: string;
}

interface ParsedTransferPolicy {
  tokenAddress: string;
  maxAmountBaseUnit: bigint;
}

function parseCallPolicies(sessionConfig: Record<string, unknown>): ParsedCallPolicy[] {
  const raw = sessionConfig.callPolicies;
  if (!Array.isArray(raw)) {
    return [];
  }

  const policies: ParsedCallPolicy[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") {
      continue;
    }
    const record = item as Record<string, unknown>;
    if (typeof record.target !== "string") {
      continue;
    }

    const parsed: ParsedCallPolicy = {
      target: record.target.toLowerCase(),
    };

    if (typeof record.selector === "string") {
      parsed.selector = record.selector.toLowerCase();
    }

    policies.push(parsed);
  }

  return policies;
}

function parseTransferPolicies(sessionConfig: Record<string, unknown>): ParsedTransferPolicy[] {
  const raw = sessionConfig.transferPolicies;
  if (!Array.isArray(raw)) {
    return [];
  }

  const policies: ParsedTransferPolicy[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") {
      continue;
    }
    const record = item as Record<string, unknown>;
    if (typeof record.tokenAddress !== "string" || typeof record.maxAmountBaseUnit !== "string") {
      continue;
    }

    try {
      policies.push({
        tokenAddress: record.tokenAddress.toLowerCase(),
        maxAmountBaseUnit: BigInt(record.maxAmountBaseUnit),
      });
    } catch {
      // Ignore invalid bigint policy entries.
    }
  }

  return policies;
}

export function canCallAddress(sessionConfig: Record<string, unknown>, target: string): boolean {
  const callPolicies = parseCallPolicies(sessionConfig);
  if (callPolicies.length === 0) {
    return false;
  }

  return callPolicies.some(policy => policy.target === target.toLowerCase());
}

export function canCallTargetWithData(sessionConfig: Record<string, unknown>, target: string, data: string): boolean {
  const callPolicies = parseCallPolicies(sessionConfig);
  if (callPolicies.length === 0) {
    return false;
  }

  const normalizedTarget = target.toLowerCase();
  const selector = data.startsWith("0x") && data.length >= 10 ? data.slice(0, 10).toLowerCase() : undefined;

  return callPolicies.some(policy => {
    if (policy.target !== normalizedTarget) {
      return false;
    }
    if (!policy.selector) {
      return true;
    }
    return selector === policy.selector;
  });
}

export function canTransferNativeValue(sessionConfig: Record<string, unknown>, valueBaseUnit: bigint): boolean {
  if (valueBaseUnit <= 0n) {
    return true;
  }

  const transferPolicies = parseTransferPolicies(sessionConfig);
  return transferPolicies.some(policy => policy.tokenAddress === ZERO_ADDRESS && policy.maxAmountBaseUnit >= valueBaseUnit);
}
