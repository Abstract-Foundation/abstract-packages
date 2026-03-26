import type { AgwSessionData, SessionPolicyMeta, SessionToolName } from "../session/types.js";

const PRESET_IDS = new Set([
  "payments",
  "trading",
  "gaming",
  "contract_write",
  "deploy",
  "signing",
  "full_app_control",
  "custom",
]);

export const KNOWN_SESSION_TOOLS: SessionToolName[] = [
  "get_wallet_address",
  "get_balances",
  "get_token_list",
  "get_session_status",
  "sign_message",
  "sign_transaction",
  "transfer_token",
  "swap_tokens",
  "preview_transaction",
  "revoke_session",
  "send_transaction",
  "send_calls",
  "write_contract",
  "deploy_contract",
];

const ALWAYS_ALLOWED_TOOLS = new Set<SessionToolName>(["get_session_status", "revoke_session"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(entry => typeof entry === "string");
}

function isKnownTool(value: string): value is SessionToolName {
  return KNOWN_SESSION_TOOLS.includes(value as SessionToolName);
}

function isAddress(value: string): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(value);
}

export function isSessionPolicyMeta(value: unknown): value is SessionPolicyMeta {
  if (!isRecord(value)) {
    return false;
  }

  if (value.version !== 1) {
    return false;
  }
  if (value.mode !== "guided" && value.mode !== "advanced") {
    return false;
  }
  if (typeof value.presetId !== "string" || !PRESET_IDS.has(value.presetId)) {
    return false;
  }
  if (typeof value.presetLabel !== "string" || value.presetLabel.trim() === "") {
    return false;
  }
  if (!Array.isArray(value.enabledTools) || !value.enabledTools.every(entry => typeof entry === "string" && isKnownTool(entry))) {
    return false;
  }
  if (!isStringArray(value.selectedAppIds)) {
    return false;
  }
  if (!isStringArray(value.selectedContractAddresses) || !value.selectedContractAddresses.every(entry => isAddress(entry))) {
    return false;
  }
  if (!isStringArray(value.unverifiedAppIds)) {
    return false;
  }
  if (!isStringArray(value.warnings)) {
    return false;
  }
  if (typeof value.generatedAt !== "number" || !Number.isInteger(value.generatedAt) || value.generatedAt <= 0) {
    return false;
  }

  return true;
}

export function parseSessionPolicyMeta(value: unknown): SessionPolicyMeta | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (!isSessionPolicyMeta(value)) {
    throw new Error("Invalid session bundle policyMeta.");
  }

  return value;
}

export function assertToolAllowedByPolicyMeta(session: AgwSessionData | null, toolName: string): void {
  if (!session || !session.policyMeta) {
    return;
  }

  if (!isKnownTool(toolName)) {
    return;
  }

  if (ALWAYS_ALLOWED_TOOLS.has(toolName)) {
    return;
  }

  const enabledTools = new Set(session.policyMeta.enabledTools);
  if (!enabledTools.has(toolName)) {
    throw new Error(
      `tool "${toolName}" is not enabled for this session preset (${session.policyMeta.presetLabel}). Re-run \`agw auth init\` with expanded permissions.`,
    );
  }
}
