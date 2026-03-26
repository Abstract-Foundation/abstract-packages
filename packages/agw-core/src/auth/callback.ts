import { isAddress } from "viem";
import { parseSessionPolicyMeta } from "../policy/meta.js";
import type { DelegatedCapabilitySummary, SessionPolicyMeta, SessionToolName } from "../session/types.js";

const CALLBACK_PAYLOAD_QUERY_KEY = "session";

export interface PrivySignerInitBundlePayload {
  version: 2;
  action: "init";
  state: string;
  iss: string;
  iat: number;
  exp: number;
  accountAddress: string;
  underlyingSignerAddress: string;
  chainId: number;
  walletId: string;
  signerType: "device_authorization_key";
  signerId: string;
  policyIds: string[];
  signerFingerprint: string;
  signerLabel: string;
  signerCreatedAt: number;
  policyMeta: SessionPolicyMeta;
  capabilitySummary: DelegatedCapabilitySummary;
}

export interface PrivySignerRevokeBundlePayload {
  version: 2;
  action: "revoke";
  state: string;
  iss: string;
  iat: number;
  exp: number;
  accountAddress: string;
  underlyingSignerAddress: string;
  chainId: number;
  walletId: string;
  signerType: "device_authorization_key";
  signerId: string;
  revokedAt: number;
}

export type PrivySignerBundlePayload =
  | PrivySignerInitBundlePayload
  | PrivySignerRevokeBundlePayload;

function parseNonEmptyString(value: unknown, fieldName: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`Invalid ${fieldName}. Expected a non-empty string.`);
  }
  return value.trim();
}

function parseStringArray(value: unknown, fieldName: string): string[] {
  if (!Array.isArray(value) || value.length === 0 || !value.every(entry => typeof entry === "string" && entry.trim() !== "")) {
    throw new Error(`Invalid ${fieldName}. Expected a non-empty string array.`);
  }
  return value.map(entry => entry.trim());
}

function parseCapabilitySummary(value: unknown): DelegatedCapabilitySummary {
  if (!isRecord(value)) {
    throw new Error("Invalid capabilitySummary. Expected an object.");
  }

  const chainId = parsePositiveInt(value.chainId, "capabilitySummary.chainId");
  const expiresAt = parsePositiveInt(value.expiresAt, "capabilitySummary.expiresAt");
  const feeLimit = parseNonEmptyString(value.feeLimit, "capabilitySummary.feeLimit");
  const maxValuePerUse = parseNonEmptyString(value.maxValuePerUse, "capabilitySummary.maxValuePerUse");
  const enabledTools = parseStringArray(value.enabledTools, "capabilitySummary.enabledTools") as SessionToolName[];
  const notes = parseStringArray(value.notes, "capabilitySummary.notes");

  return {
    chainId,
    expiresAt,
    feeLimit,
    maxValuePerUse,
    enabledTools,
    notes,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function parsePositiveInt(value: unknown, fieldName: string): number {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string" && /^\d+$/.test(value.trim())
        ? Number.parseInt(value, 10)
        : Number.NaN;

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Invalid ${fieldName}. Expected a positive integer.`);
  }

  return parsed;
}

function resolvePayloadCandidate(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error("Missing callback/session bundle input.");
  }

  if (!URL.canParse(trimmed)) {
    return trimmed;
  }

  const callbackUrl = new URL(trimmed);

  const queryValue = callbackUrl.searchParams.get(CALLBACK_PAYLOAD_QUERY_KEY);
  if (queryValue) {
    return queryValue;
  }

  if (callbackUrl.hash.startsWith("#")) {
    const hashParams = new URLSearchParams(callbackUrl.hash.slice(1));
    const hashValue = hashParams.get(CALLBACK_PAYLOAD_QUERY_KEY);
    if (hashValue) {
      return hashValue;
    }
  }

  throw new Error("Callback URL is missing `session` payload parameter.");
}

function parsePayloadObject(rawPayload: string): Record<string, unknown> {
  const payloadCandidates = [rawPayload];

  try {
    const decodedBase64Url = Buffer.from(rawPayload, "base64url").toString("utf8").trim();
    if (decodedBase64Url) {
      payloadCandidates.push(decodedBase64Url);
    }
  } catch {
    // Ignore invalid base64url payloads.
  }

  for (const candidate of payloadCandidates) {
    try {
      const parsed = JSON.parse(candidate) as unknown;
      if (isRecord(parsed)) {
        return parsed;
      }
    } catch {
      // Keep trying payload candidates.
    }
  }

  throw new Error("Invalid session bundle payload. Expected JSON or base64url-encoded JSON.");
}

export function parseSignerBundlePayload(payload: Record<string, unknown>): PrivySignerBundlePayload {
  const state = parseNonEmptyString(payload.state, "state");
  const iss = parseNonEmptyString(payload.iss, "iss");
  const iat = parsePositiveInt(payload.iat, "iat");
  const exp = parsePositiveInt(payload.exp, "exp");

  if (typeof payload.accountAddress !== "string" || !isAddress(payload.accountAddress)) {
    throw new Error("Invalid signer bundle accountAddress.");
  }
  if (typeof payload.underlyingSignerAddress !== "string" || !isAddress(payload.underlyingSignerAddress)) {
    throw new Error("Invalid signer bundle underlyingSignerAddress.");
  }

  const chainId = parsePositiveInt(payload.chainId, "chainId");
  const version = parsePositiveInt(payload.version, "version");
  if (version !== 2) {
    throw new Error(`Unsupported signer bundle version (${version}).`);
  }

  const action = parseNonEmptyString(payload.action, "action");
  const walletId = parseNonEmptyString(payload.walletId, "walletId");
  const signerType = parseNonEmptyString(payload.signerType, "signerType");
  if (signerType !== "device_authorization_key") {
    throw new Error(`Invalid signerType. Expected "device_authorization_key", received "${signerType}".`);
  }
  const signerId = parseNonEmptyString(payload.signerId, "signerId");

  if (action === "init") {
    const policyMeta = parseSessionPolicyMeta(payload.policyMeta);
    if (!policyMeta) {
      throw new Error("Invalid signer bundle policyMeta.");
    }

    return {
      version: 2,
      action: "init",
      state,
      iss,
      iat,
      exp,
      accountAddress: payload.accountAddress,
      underlyingSignerAddress: payload.underlyingSignerAddress,
      chainId,
      walletId,
      signerType,
      signerId,
      policyIds: parseStringArray(payload.policyIds, "policyIds"),
      signerFingerprint: parseNonEmptyString(payload.signerFingerprint, "signerFingerprint"),
      signerLabel: parseNonEmptyString(payload.signerLabel, "signerLabel"),
      signerCreatedAt: parsePositiveInt(payload.signerCreatedAt, "signerCreatedAt"),
      policyMeta,
      capabilitySummary: parseCapabilitySummary(payload.capabilitySummary),
    };
  }

  if (action === "revoke") {
    return {
      version: 2,
      action: "revoke",
      state,
      iss,
      iat,
      exp,
      accountAddress: payload.accountAddress,
      underlyingSignerAddress: payload.underlyingSignerAddress,
      chainId,
      walletId,
      signerType,
      signerId,
      revokedAt: parsePositiveInt(payload.revokedAt, "revokedAt"),
    };
  }

  throw new Error(`Invalid signer bundle action "${action}".`);
}

export function parseSignerBundleInput(input: string): PrivySignerBundlePayload {
  return parseSignerBundlePayload(parsePayloadObject(resolvePayloadCandidate(input)));
}

export function parseInitSignerBundleInput(input: string): PrivySignerInitBundlePayload {
  const bundle = parseSignerBundleInput(input);
  if (bundle.action !== "init") {
    throw new Error(`Invalid signer bundle action "${bundle.action}". Expected "init".`);
  }
  return bundle;
}

export function parseInitSignerBundlePayload(payload: Record<string, unknown>): PrivySignerInitBundlePayload {
  const bundle = parseSignerBundlePayload(payload);
  if (bundle.action !== "init") {
    throw new Error(`Invalid signer bundle action "${bundle.action}". Expected "init".`);
  }
  return bundle;
}

export function parseRevokeSignerBundleInput(input: string): PrivySignerRevokeBundlePayload {
  const bundle = parseSignerBundleInput(input);
  if (bundle.action !== "revoke") {
    throw new Error(`Invalid signer bundle action "${bundle.action}". Expected "revoke".`);
  }
  return bundle;
}

export function parseRevokeSignerBundlePayload(payload: Record<string, unknown>): PrivySignerRevokeBundlePayload {
  const bundle = parseSignerBundlePayload(payload);
  if (bundle.action !== "revoke") {
    throw new Error(`Invalid signer bundle action "${bundle.action}". Expected "revoke".`);
  }
  return bundle;
}
