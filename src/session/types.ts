export type SessionStatus = "missing" | "pending" | "active" | "expired" | "revoked";
export type OnchainSessionStatus = "NotInitialized" | "Active" | "Closed" | "Expired";
export type OnchainSessionStatusCode = 0 | 1 | 2 | 3;

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
  sessionSignerRef: {
    kind: "raw" | "keyfile";
    value: string;
  };
}
