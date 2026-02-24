export type SessionStatus = "missing" | "active" | "revoked";

export interface AgwSessionData {
  accountAddress: string;
  chainId: number;
  createdAt: number;
  updatedAt: number;
  status: Exclude<SessionStatus, "missing">;
}
