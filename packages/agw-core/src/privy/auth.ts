import { createHash, createPrivateKey, createSign, generateKeyPairSync, type KeyObject } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const AUTH_KEY_FILENAME = "privy-auth.key";
const WALLET_AUTH_PREFIX = "wallet-auth:";

export interface P256KeyPair {
  privateKeyDer: Buffer;
  publicKeyDer: Buffer;
}

export interface AuthorizationSignatureInput {
  url: string;
  method: "POST" | "PUT" | "PATCH" | "DELETE";
  body: Record<string, unknown>;
  appId: string;
  idempotencyKey?: string;
}

export function generateP256KeyPair(): P256KeyPair {
  const { privateKey, publicKey } = generateKeyPairSync("ec", {
    namedCurve: "P-256",
    publicKeyEncoding: { type: "spki", format: "der" },
    privateKeyEncoding: { type: "pkcs8", format: "der" },
  });

  return {
    privateKeyDer: privateKey,
    publicKeyDer: publicKey,
  };
}

export function publicKeyToBase64(publicKeyDer: Buffer): string {
  return publicKeyDer.toString("base64");
}

export function computePublicKeyFingerprint(publicKey: Buffer | string): string {
  const keyBuffer = typeof publicKey === "string" ? Buffer.from(publicKey, "base64") : publicKey;
  const digest = createHash("sha256").update(keyBuffer).digest("hex");
  return `${digest.slice(0, 12)}:${digest.slice(-12)}`;
}

function ensurePrivateDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  try {
    fs.chmodSync(dir, 0o700);
  } catch {
    // Ignore chmod errors on non-posix platforms.
  }
}

export function writeAuthKeyfile(privateKeyDer: Buffer, storageDir: string): string {
  ensurePrivateDir(storageDir);
  const filePath = path.join(storageDir, AUTH_KEY_FILENAME);
  fs.writeFileSync(filePath, formatAuthKeyfile(privateKeyDer), { mode: 0o600 });
  try {
    fs.chmodSync(filePath, 0o600);
  } catch {
    // Ignore chmod errors on non-posix platforms.
  }
  return filePath;
}

export function formatAuthKeyfile(privateKeyDer: Buffer): string {
  return `${WALLET_AUTH_PREFIX}${privateKeyDer.toString("base64")}\n`;
}

export function readAuthKeyfile(keyfilePath: string): KeyObject {
  const raw = fs.readFileSync(keyfilePath, "utf8").trim();
  const derBase64 = raw.startsWith(WALLET_AUTH_PREFIX) ? raw.slice(WALLET_AUTH_PREFIX.length) : raw;
  const derBuffer = Buffer.from(derBase64, "base64");
  return createPrivateKey({
    key: derBuffer,
    format: "der",
    type: "pkcs8",
  });
}

export function authKeyfileExists(storageDir: string): boolean {
  return fs.existsSync(path.join(storageDir, AUTH_KEY_FILENAME));
}

export function deleteAuthKeyfile(storageDir: string): void {
  const filePath = path.join(storageDir, AUTH_KEY_FILENAME);
  try {
    if (!fs.existsSync(filePath)) {
      return;
    }
    const stats = fs.statSync(filePath);
    if (stats.isFile() && stats.size > 0) {
      try {
        fs.writeFileSync(filePath, Buffer.alloc(stats.size), { flag: "r+" });
      } catch {
        // Best-effort wipe.
      }
    }
    fs.unlinkSync(filePath);
  } catch {
    // Ignore deletion errors.
  }
}

function canonicalize(obj: unknown): string {
  if (obj === null || obj === undefined) {
    return "null";
  }
  if (typeof obj === "boolean" || typeof obj === "number") {
    return JSON.stringify(obj);
  }
  if (typeof obj === "string") {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return `[${obj.map(canonicalize).join(",")}]`;
  }
  if (typeof obj === "object") {
    const sortedKeys = Object.keys(obj).sort();
    const entries = sortedKeys.map(key => {
      const value = (obj as Record<string, unknown>)[key];
      if (value === undefined) {
        return null;
      }
      return `${JSON.stringify(key)}:${canonicalize(value)}`;
    }).filter(Boolean);
    return `{${entries.join(",")}}`;
  }
  return JSON.stringify(obj);
}

export function computeAuthorizationSignature(
  privateKey: KeyObject,
  input: AuthorizationSignatureInput,
): string {
  const headers: Record<string, string> = {
    "privy-app-id": input.appId,
  };
  if (input.idempotencyKey) {
    headers["privy-idempotency-key"] = input.idempotencyKey;
  }

  const payload = {
    version: 1,
    method: input.method,
    url: input.url,
    body: input.body,
    headers,
  };

  const serialized = canonicalize(payload);
  const signer = createSign("SHA256");
  signer.update(serialized);
  signer.end();
  const signature = signer.sign(privateKey);
  return signature.toString("base64");
}
