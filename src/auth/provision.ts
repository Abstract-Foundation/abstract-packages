import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { AgwSessionData } from "../session/types.js";
import type { SessionBundlePayload } from "./callback.js";

const PRIVATE_KEY_PATTERN = /^0x[0-9a-fA-F]{64}$/;

export interface MaterializeSessionFromBundleOptions {
  chainId: number;
  storageDir?: string;
  nowUnixSeconds?: number;
}

export function resolveStorageDir(storageDir?: string): string {
  return storageDir ?? path.join(os.homedir(), ".agw-mcp");
}

function ensurePrivateDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  try {
    fs.chmodSync(dir, 0o700);
  } catch {
    // Ignore chmod errors on non-posix platforms.
  }
}

export function writeSignerKeyfile(privateKey: string, storageDir?: string): string {
  const dir = resolveStorageDir(storageDir);
  ensurePrivateDir(dir);
  const filePath = path.join(dir, "session-signer.key");
  fs.writeFileSync(filePath, `${privateKey.trim()}\n`, { mode: 0o600 });
  try {
    fs.chmodSync(filePath, 0o600);
  } catch {
    // Ignore chmod errors on non-posix platforms.
  }
  return filePath;
}

function resolveExistingSignerKeyfile(storageDir?: string): string {
  const dir = resolveStorageDir(storageDir);
  const filePath = path.join(dir, "session-signer.key");
  if (!fs.existsSync(filePath)) {
    throw new Error(`Session signer keyfile is missing at ${filePath}. Re-run \`agw-mcp init\`.`);
  }
  const keyfileContents = fs.readFileSync(filePath, "utf8").trim();
  if (!PRIVATE_KEY_PATTERN.test(keyfileContents)) {
    throw new Error(`Session signer keyfile at ${filePath} is invalid. Re-run \`agw-mcp init\`.`);
  }
  return filePath;
}

export function materializeSessionFromBundle(
  bundle: SessionBundlePayload,
  options: MaterializeSessionFromBundleOptions,
): AgwSessionData {
  if (bundle.chainId !== options.chainId) {
    throw new Error(`Session bundle chain id (${bundle.chainId}) does not match requested chain id (${options.chainId}).`);
  }

  const now = options.nowUnixSeconds ?? Math.floor(Date.now() / 1000);
  const keyfilePath = resolveExistingSignerKeyfile(options.storageDir);

  return {
    accountAddress: bundle.accountAddress,
    chainId: bundle.chainId,
    createdAt: now,
    updatedAt: now,
    expiresAt: bundle.expiresAt,
    status: "active",
    sessionConfig: bundle.sessionConfig,
    sessionSignerRef: {
      kind: "keyfile",
      value: keyfilePath,
    },
  };
}
