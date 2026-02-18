export type SessionStatus = "missing" | "pending" | "active" | "expired" | "revoked";

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
