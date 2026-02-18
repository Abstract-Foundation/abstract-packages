const CALLBACK_PAYLOAD_QUERY_KEYS = ["session", "bundle", "payload"] as const;
const PRIVATE_KEY_PATTERN = /^0x[0-9a-fA-F]{64}$/;

export interface SessionBundlePayload {
  accountAddress: string;
  chainId?: number;
  expiresAt: number;
  sessionConfig: Record<string, unknown>;
  sessionSignerRef: {
    kind: "raw" | "keyfile";
    value: string;
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

  for (const key of CALLBACK_PAYLOAD_QUERY_KEYS) {
    const queryValue = callbackUrl.searchParams.get(key);
    if (queryValue) {
      return queryValue;
    }
  }

  if (callbackUrl.hash.startsWith("#")) {
    const hashParams = new URLSearchParams(callbackUrl.hash.slice(1));
    for (const key of CALLBACK_PAYLOAD_QUERY_KEYS) {
      const hashValue = hashParams.get(key);
      if (hashValue) {
        return hashValue;
      }
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

function parseSessionSignerRef(payload: Record<string, unknown>): SessionBundlePayload["sessionSignerRef"] {
  const sessionSignerRefValue = payload.sessionSignerRef;
  if (isRecord(sessionSignerRefValue)) {
    const kind = sessionSignerRefValue.kind;
    const value = sessionSignerRefValue.value;

    if ((kind === "raw" || kind === "keyfile") && typeof value === "string" && value.trim()) {
      if (kind === "raw" && !PRIVATE_KEY_PATTERN.test(value.trim())) {
        throw new Error("Invalid session signer private key. Expected a 32-byte 0x-prefixed hex value.");
      }
      return { kind, value: value.trim() };
    }
  }

  const privateKeyCandidate =
    typeof payload.sessionSignerPrivateKey === "string"
      ? payload.sessionSignerPrivateKey
      : typeof payload.sessionPrivateKey === "string"
        ? payload.sessionPrivateKey
        : undefined;

  if (!privateKeyCandidate || !PRIVATE_KEY_PATTERN.test(privateKeyCandidate.trim())) {
    throw new Error(
      "Session bundle must include session signer material (`sessionSignerPrivateKey` or `sessionSignerRef`).",
    );
  }

  return {
    kind: "raw",
    value: privateKeyCandidate.trim(),
  };
}

export function parseSessionBundleInput(input: string): SessionBundlePayload {
  const payload = parsePayloadObject(resolvePayloadCandidate(input));

  if (typeof payload.accountAddress !== "string" || !payload.accountAddress.trim()) {
    throw new Error("Invalid session bundle accountAddress.");
  }

  const sessionConfig = payload.sessionConfig;
  if (!isRecord(sessionConfig)) {
    throw new Error("Invalid session bundle sessionConfig.");
  }

  const chainId = payload.chainId === undefined ? undefined : parsePositiveInt(payload.chainId, "chainId");

  return {
    accountAddress: payload.accountAddress.trim(),
    chainId,
    expiresAt: parsePositiveInt(payload.expiresAt, "expiresAt"),
    sessionConfig,
    sessionSignerRef: parseSessionSignerRef(payload),
  };
}
