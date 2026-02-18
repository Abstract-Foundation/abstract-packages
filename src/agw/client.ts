import fs from "node:fs";
import { createSessionClient, type SessionClient, type SessionConfig } from "@abstract-foundation/agw-client/sessions";
import { http, isAddress, type Address } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import type { ChainEIP712 } from "viem/chains";
import type { AgwSessionData } from "../session/types.js";

const REDACTED_SIGNER_REF = "[REDACTED]";
const PRIVATE_KEY_PATTERN = /^0x[0-9a-fA-F]{64}$/;

export interface AgwChainConfig {
  chain: ChainEIP712;
  rpcUrl?: string;
}

export interface CreateAgwSessionClientInput {
  accountAddress: string;
  sessionConfig: unknown;
  sessionSignerRef: AgwSessionData["sessionSignerRef"];
  chainConfig: AgwChainConfig;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function isSessionConfig(value: unknown): value is SessionConfig {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.signer === "string" &&
    typeof value.expiresAt === "bigint" &&
    isRecord(value.feeLimit) &&
    Array.isArray(value.callPolicies) &&
    Array.isArray(value.transferPolicies)
  );
}

function resolveSessionPrivateKey(sessionSignerRef: AgwSessionData["sessionSignerRef"]): `0x${string}` {
  if (sessionSignerRef.value === REDACTED_SIGNER_REF) {
    throw new Error("Session signer reference is redacted. Run `agw-mcp init` again to provision signer material.");
  }

  const rawValue =
    sessionSignerRef.kind === "keyfile" ? fs.readFileSync(sessionSignerRef.value, "utf8").trim() : sessionSignerRef.value.trim();

  if (!PRIVATE_KEY_PATTERN.test(rawValue)) {
    throw new Error("Session signer private key must be a 32-byte hex value.");
  }

  return rawValue as `0x${string}`;
}

export function createAgwSessionClient(input: CreateAgwSessionClientInput): SessionClient {
  if (!isAddress(input.accountAddress)) {
    throw new Error("Invalid AGW account address.");
  }
  if (!isSessionConfig(input.sessionConfig)) {
    throw new Error("Invalid sessionConfig payload. Expected AGW SessionConfig.");
  }

  const signer = privateKeyToAccount(resolveSessionPrivateKey(input.sessionSignerRef));
  const transport = input.chainConfig.rpcUrl ? http(input.chainConfig.rpcUrl, { batch: true }) : undefined;

  return createSessionClient({
    account: input.accountAddress as Address,
    chain: input.chainConfig.chain,
    signer,
    session: input.sessionConfig,
    transport,
  });
}
