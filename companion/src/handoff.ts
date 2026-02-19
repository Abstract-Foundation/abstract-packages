import { createHmac, timingSafeEqual } from "node:crypto";

const CALLBACK_PAYLOAD_QUERY_KEYS = ["session", "bundle", "payload"] as const;

interface SignedHandoffEnvelope {
  payload: string;
  signature: string;
}

function signatureForPayload(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

function decodeEnvelope(token: string): SignedHandoffEnvelope {
  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(token, "base64url").toString("utf8")) as unknown;
  } catch {
    throw new Error("Invalid handoff token encoding.");
  }

  if (!parsed || typeof parsed !== "object") {
    throw new Error("Invalid handoff token payload.");
  }

  const envelope = parsed as Record<string, unknown>;
  if (typeof envelope.payload !== "string" || typeof envelope.signature !== "string") {
    throw new Error("Invalid handoff token shape.");
  }

  return {
    payload: envelope.payload,
    signature: envelope.signature,
  };
}

export function createSignedHandoffToken(payload: string, secret: string): string {
  const envelope: SignedHandoffEnvelope = {
    payload,
    signature: signatureForPayload(payload, secret),
  };
  return Buffer.from(JSON.stringify(envelope), "utf8").toString("base64url");
}

export function verifySignedHandoffToken(token: string, secret: string): string {
  const envelope = decodeEnvelope(token);
  const expected = Buffer.from(signatureForPayload(envelope.payload, secret), "utf8");
  const actual = Buffer.from(envelope.signature, "utf8");
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    throw new Error("Invalid handoff token signature.");
  }
  return envelope.payload;
}

export function resolveCallbackPayload(url: URL): string {
  for (const key of CALLBACK_PAYLOAD_QUERY_KEYS) {
    const value = url.searchParams.get(key);
    if (value) {
      return value;
    }
  }

  throw new Error("Callback payload is missing `session`/`bundle`/`payload`.");
}
