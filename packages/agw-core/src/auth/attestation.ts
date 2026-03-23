import { createPublicKey, type KeyObject, verify as verifySignature } from "node:crypto";

const DEFAULT_CALLBACK_ISSUER = "agw";
const LOCALHOST_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);
const DEFAULT_CLOCK_SKEW_SECONDS = 60;

export interface CallbackVerificationConfig {
  issuer: string;
  publicKeyBase64: string;
  publicKey: KeyObject;
}

export interface SignedCallbackTokenEnvelope<TPayload extends Record<string, unknown>> {
  header: Record<string, unknown>;
  payload: TPayload;
}

function decodeBase64Url(input: string): string {
  return Buffer.from(input, "base64url").toString("utf8");
}

function parseRecordJson(input: string, label: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(input) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error();
    }
    return parsed as Record<string, unknown>;
  } catch {
    throw new Error(`Invalid ${label}. Expected JSON object.`);
  }
}

function parsePublicKeyBase64(value: string): KeyObject {
  return createPublicKey({
    key: Buffer.from(value, "base64"),
    format: "der",
    type: "spki",
  });
}

function isLoopbackAppUrl(appUrl: string): boolean {
  try {
    const parsed = new URL(appUrl);
    return LOCALHOST_HOSTS.has(parsed.hostname);
  } catch {
    return false;
  }
}

export async function resolveCallbackVerificationConfig(appUrl: string): Promise<CallbackVerificationConfig> {
  const explicitPublicKey = process.env.AGW_CALLBACK_SIGNING_PUBLIC_KEY?.trim();
  const explicitIssuer = process.env.AGW_CALLBACK_SIGNING_ISSUER?.trim() || DEFAULT_CALLBACK_ISSUER;
  if (explicitPublicKey) {
    return {
      issuer: explicitIssuer,
      publicKeyBase64: explicitPublicKey,
      publicKey: parsePublicKeyBase64(explicitPublicKey),
    };
  }

  if (!isLoopbackAppUrl(appUrl)) {
    throw new Error(
      "AGW_CALLBACK_SIGNING_PUBLIC_KEY is required for non-localhost onboarding URLs.",
    );
  }

  const callbackKeyUrl = new URL("/api/session/callback-key", appUrl);
  const response = await fetch(callbackKeyUrl, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch callback signing key (${response.status} ${response.statusText}).`);
  }

  const body = (await response.json()) as {
    issuer?: unknown;
    publicKey?: unknown;
  };
  if (typeof body.publicKey !== "string" || !body.publicKey.trim()) {
    throw new Error("Callback signing key response is missing `publicKey`.");
  }
  const issuer = typeof body.issuer === "string" && body.issuer.trim()
    ? body.issuer.trim()
    : DEFAULT_CALLBACK_ISSUER;

  return {
    issuer,
    publicKeyBase64: body.publicKey.trim(),
    publicKey: parsePublicKeyBase64(body.publicKey.trim()),
  };
}

export function verifySignedCallbackToken<TPayload extends Record<string, unknown>>(
  token: string,
  config: CallbackVerificationConfig,
): SignedCallbackTokenEnvelope<TPayload> {
  const parts = token.trim().split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid signed callback token.");
  }

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const header = parseRecordJson(decodeBase64Url(encodedHeader), "callback header");
  const payload = parseRecordJson(decodeBase64Url(encodedPayload), "callback payload") as TPayload;
  const signature = Buffer.from(encodedSignature, "base64url");
  const message = Buffer.from(`${encodedHeader}.${encodedPayload}`, "utf8");

  const isValid = verifySignature(null, message, config.publicKey, signature);
  if (!isValid) {
    throw new Error("Invalid callback signature.");
  }

  if (header.alg !== "EdDSA") {
    throw new Error(`Unsupported callback signing algorithm (${String(header.alg)}).`);
  }
  if (header.typ !== "AGW-MCP-CALLBACK") {
    throw new Error(`Unsupported callback token type (${String(header.typ)}).`);
  }

  const payloadIssuer = typeof payload.iss === "string" ? payload.iss : null;
  if (!payloadIssuer || payloadIssuer !== config.issuer) {
    throw new Error(`Invalid callback issuer (${payloadIssuer ?? "missing"}).`);
  }

  const now = Math.floor(Date.now() / 1000);
  const iat = typeof payload.iat === "number" && Number.isInteger(payload.iat) ? payload.iat : null;
  const exp = typeof payload.exp === "number" && Number.isInteger(payload.exp) ? payload.exp : null;
  if (!iat || !exp) {
    throw new Error("Callback payload is missing freshness metadata.");
  }
  if (iat > now + DEFAULT_CLOCK_SKEW_SECONDS) {
    throw new Error("Callback payload is not yet valid.");
  }
  if (exp < now - DEFAULT_CLOCK_SKEW_SECONDS) {
    throw new Error("Callback payload has expired.");
  }

  return {
    header,
    payload,
  };
}
