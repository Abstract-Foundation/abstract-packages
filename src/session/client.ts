import type { SessionClient } from "@abstract-foundation/agw-client/sessions";
import { createAgwSessionClient, type AgwChainConfig } from "../agw/client.js";
import type { AgwSessionData } from "./types.js";

export interface CreateSessionClientFromSessionDataInput {
  session: AgwSessionData;
  chainConfig: AgwChainConfig;
}

export function createSessionClientFromSessionData(input: CreateSessionClientFromSessionDataInput): SessionClient {
  return createAgwSessionClient({
    accountAddress: input.session.accountAddress,
    sessionConfig: input.session.sessionConfig,
    sessionSignerRef: input.session.sessionSignerRef,
    chainConfig: input.chainConfig,
  });
}
