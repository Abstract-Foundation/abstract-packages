export type SessionStatus = "missing" | "pending" | "active" | "revoked";
export type SessionReadiness =
  | "missing"
  | "legacy_read_only"
  | "active_write_ready"
  | "incomplete_signer_session"
  | "revoked";

export type SessionPolicyPresetId =
  | "payments"
  | "trading"
  | "gaming"
  | "contract_write"
  | "deploy"
  | "signing"
  | "full_app_control"
  | "custom";

export type SessionToolName =
  | "get_wallet_address"
  | "get_balances"
  | "get_token_list"
  | "get_session_status"
  | "sign_message"
  | "sign_transaction"
  | "transfer_token"
  | "swap_tokens"
  | "preview_transaction"
  | "revoke_session"
  | "send_transaction"
  | "send_calls"
  | "write_contract"
  | "deploy_contract";

export interface SessionPolicyMeta {
  version: 1;
  mode: "guided" | "advanced";
  presetId: SessionPolicyPresetId;
  presetLabel: string;
  enabledTools: SessionToolName[];
  selectedAppIds: string[];
  selectedContractAddresses: string[];
  unverifiedAppIds: string[];
  warnings: string[];
  generatedAt: number;
}

export interface DelegatedCapabilitySummary {
  chainId: number;
  expiresAt: number;
  feeLimit: string;
  maxValuePerUse: string;
  enabledTools: SessionToolName[];
  notes: string[];
}

export type AgwSignerType = "device_authorization_key";

export interface AgwSignerBinding {
  type: AgwSignerType;
  canonicalType: "key_quorum";
  id: string;
  policyIds: string[];
  fingerprint: string;
  label: string;
  createdAt: number;
}

export interface AgwSessionData {
  accountAddress: string;
  underlyingSignerAddress?: string;
  chainId: number;
  createdAt: number;
  updatedAt: number;
  status: Exclude<SessionStatus, "missing">;
  policyMeta?: SessionPolicyMeta;
  privyWalletId?: string;
  privySignerBinding?: AgwSignerBinding;
  // Deprecated single-field storage kept for legacy compatibility.
  privyPolicyIds?: string[];
  privySignerId?: string;
  privySignerType?: AgwSignerType;
  privySignerFingerprint?: string;
  privySignerLabel?: string;
  privySignerCreatedAt?: number;
  capabilitySummary?: DelegatedCapabilitySummary;
  privyPolicyId?: string;
  privyQuorumId?: string;
  privyAuthKeyRef?: {
    kind: "keyfile";
    value: string;
  };
}

export function isWriteReadySession(session: AgwSessionData | null): boolean {
  const binding = session?.privySignerBinding;
  return Boolean(
    session &&
      session.status === "active" &&
      session.privyWalletId &&
      binding &&
      binding.type === "device_authorization_key" &&
      binding.id &&
      binding.policyIds.length > 0 &&
      binding.fingerprint &&
      session.privyAuthKeyRef,
  );
}

export function resolveSessionReadiness(session: AgwSessionData | null): SessionReadiness | null {
  if (!session || session.status !== "active") {
    return null;
  }

  const activeSession = session;

  if (isWriteReadySession(activeSession)) {
    return "active_write_ready";
  }

  const hasAnySignerMetadata = Boolean(
    activeSession.privyWalletId ||
      activeSession.privySignerBinding ||
      activeSession.privySignerId ||
      activeSession.privyPolicyIds?.length ||
      activeSession.privyPolicyId ||
      activeSession.privyQuorumId ||
      activeSession.privyAuthKeyRef,
  );

  return hasAnySignerMetadata ? "incomplete_signer_session" : "legacy_read_only";
}
