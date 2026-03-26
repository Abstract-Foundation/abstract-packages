export const SUPPORTED_CHAIN_IDS = [11124, 2741] as const;

export const DEFAULT_POLICY_EXPIRY_SECONDS = 30 * 24 * 60 * 60;
export const DEFAULT_POLICY_FEE_LIMIT = "2000000000000000";
export const DEFAULT_POLICY_MAX_VALUE_PER_USE = "10000000000000000";

export function getDefaultPolicyId(): string {
  const id = process.env.PRIVY_DEFAULT_POLICY_ID?.trim();
  if (!id) {
    throw new Error(
      "Missing PRIVY_DEFAULT_POLICY_ID. Create a default policy in the Privy dashboard and set this env var.",
    );
  }
  return id;
}

export const POLICY_MIN_EXPIRY_SECONDS = 300;
export const POLICY_MAX_EXPIRY_SECONDS = 30 * 24 * 60 * 60;

export const HIGH_RISK_EXPIRY_SECONDS = 4 * 60 * 60;
export const HIGH_RISK_MAX_VALUE_PER_USE = 1_000_000_000_000_000_000n;
