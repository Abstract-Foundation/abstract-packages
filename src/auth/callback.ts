import { isAddress } from "viem";

const CALLBACK_PAYLOAD_QUERY_KEY = "session";

export interface SessionBundlePayload {
  accountAddress: string;
  chainId: number;
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

export function parseSessionBundleInput(input: string): SessionBundlePayload {
  const payload = parsePayloadObject(resolvePayloadCandidate(input));

  if (typeof payload.accountAddress !== "string" || !isAddress(payload.accountAddress)) {
    throw new Error("Invalid session bundle accountAddress.");
  }

  return {
    accountAddress: payload.accountAddress,
    chainId: parsePositiveInt(payload.chainId, "chainId"),
  };
}
