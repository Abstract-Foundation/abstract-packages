import type { SessionClient } from "@abstract-foundation/agw-client/sessions";
import { createAgwSessionClient, type AgwChainConfig } from "../agw/client.js";
import type { AgwSessionData } from "./types.js";

export interface CreateSessionClientFromSessionDataInput {
  session: AgwSessionData;
  chainConfig: AgwChainConfig;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function reviveSessionConfig(sessionConfig: Record<string, unknown>): Record<string, unknown> {
  const revived = { ...sessionConfig };
  const expiresAt = revived.expiresAt;
  if (typeof expiresAt === "string" && /^\d+$/.test(expiresAt.trim())) {
    revived.expiresAt = BigInt(expiresAt);
  }
  return revived;
}

export function createSessionClientFromSessionData(input: CreateSessionClientFromSessionDataInput): SessionClient {
  const sessionConfig = isRecord(input.session.sessionConfig)
    ? reviveSessionConfig(input.session.sessionConfig)
    : input.session.sessionConfig;

  return createAgwSessionClient({
    accountAddress: input.session.accountAddress,
    sessionConfig,
    sessionSignerRef: input.session.sessionSignerRef,
    chainConfig: input.chainConfig,
  });
}
