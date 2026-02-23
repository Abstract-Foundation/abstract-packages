export type SessionStatus = "missing" | "pending" | "active" | "expired" | "revoked";
export type OnchainSessionStatus = "NotInitialized" | "Active" | "Closed" | "Expired";
export type OnchainSessionStatusCode = 0 | 1 | 2 | 3;

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

export interface OnchainSessionStatusMetadata {
  status: OnchainSessionStatus;
  statusCode: OnchainSessionStatusCode;
  source: "onchain" | "local";
  checkedAt: number;
}

export interface AgwSessionData {
  accountAddress: string;
  chainId: number;
  expiresAt: number;
  createdAt: number;
  updatedAt: number;
  status: Exclude<SessionStatus, "missing">;
  sessionConfig: Record<string, unknown>;
  policyMeta?: SessionPolicyMeta;
  sessionSignerRef: {
    kind: "raw" | "keyfile";
    value: string;
  };
}
