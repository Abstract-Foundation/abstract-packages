import fs from "node:fs";
import path from "node:path";
import type { AgwSessionData } from "../session/types.js";
import type { SessionBundlePayload } from "./callback.js";

export interface StorageSnapshot {
  keyPath: string;
  sessionPath: string;
  keyBytes: Buffer | null;
  sessionBytes: Buffer | null;
}

export interface BootstrapLockHandle {
  release: () => void;
}

const PRIVATE_KEY_PATTERN = /^0x[0-9a-fA-F]{64}$/;
const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);
const BOOTSTRAP_LOCK_STALE_MS = 30 * 60 * 1000;

function ensurePrivateDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  try {
    fs.chmodSync(dir, 0o700);
  } catch {
    // Ignore chmod errors on non-posix platforms.
  }
}

function isProcessAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "EPERM") {
      return true;
    }
    if (code === "ESRCH") {
      return false;
    }
    return false;
  }
}

function shouldRecoverStaleLock(lockPath: string): boolean {
  let ageMs: number;
  try {
    const stats = fs.statSync(lockPath);
    ageMs = Date.now() - stats.mtimeMs;
  } catch {
    return false;
  }

  try {
    const metadataRaw = fs.readFileSync(lockPath, "utf8");
    const metadata = JSON.parse(metadataRaw) as { pid?: unknown };
    if (typeof metadata.pid === "number" && Number.isInteger(metadata.pid) && metadata.pid > 0) {
      return !isProcessAlive(metadata.pid);
    }
  } catch {
    // Fall through to age-based stale check.
  }

  return ageMs > BOOTSTRAP_LOCK_STALE_MS;
}

export function acquireBootstrapLock(storageDir: string): BootstrapLockHandle {
  ensurePrivateDir(storageDir);
  const lockPath = path.join(storageDir, ".bootstrap-init.lock");

  let fd: number | null = null;
  for (let attempt = 0; attempt < 2 && fd === null; attempt += 1) {
    try {
      fd = fs.openSync(lockPath, "wx", 0o600);
      break;
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code === "EEXIST" && attempt === 0 && shouldRecoverStaleLock(lockPath)) {
        try {
          fs.unlinkSync(lockPath);
          continue;
        } catch (unlinkError) {
          if ((unlinkError as NodeJS.ErrnoException).code !== "ENOENT") {
            throw new Error(
              `Another \`agw-mcp init\` is already in progress for ${storageDir}. Wait for it to finish or remove stale lock ${lockPath}.`,
            );
          }
          continue;
        }
      }
      if (code === "EEXIST") {
        throw new Error(
          `Another \`agw-mcp init\` is already in progress for ${storageDir}. Wait for it to finish or remove stale lock ${lockPath}.`,
        );
      }
      throw error;
    }
  }

  if (fd === null) {
    throw new Error(`Failed to acquire bootstrap lock at ${lockPath}.`);
  }

  try {
    const metadata = JSON.stringify(
      {
        pid: process.pid,
        createdAt: new Date().toISOString(),
      },
      null,
      2,
    );
    fs.writeFileSync(fd, `${metadata}\n`, { encoding: "utf8" });
  } catch (error) {
    try {
      fs.closeSync(fd);
    } catch {
      // Ignore close errors on cleanup path.
    }
    try {
      fs.unlinkSync(lockPath);
    } catch {
      // Ignore unlink errors on cleanup path.
    }
    throw error;
  }

  let released = false;
  return {
    release: () => {
      if (released) {
        return;
      }
      released = true;
      try {
        fs.closeSync(fd);
      } catch {
        // Ignore close errors on cleanup path.
      }
      try {
        fs.unlinkSync(lockPath);
      } catch {
        // Ignore unlink errors on cleanup path.
      }
    },
  };
}

export function captureStorageSnapshot(storageDir: string): StorageSnapshot {
  const keyPath = path.join(storageDir, "session-signer.key");
  const sessionPath = path.join(storageDir, "session.json");

  return {
    keyPath,
    sessionPath,
    keyBytes: fs.existsSync(keyPath) ? fs.readFileSync(keyPath) : null,
    sessionBytes: fs.existsSync(sessionPath) ? fs.readFileSync(sessionPath) : null,
  };
}

export function restoreStorageSnapshot(snapshot: StorageSnapshot): void {
  if (snapshot.keyBytes === null) {
    if (fs.existsSync(snapshot.keyPath)) {
      fs.unlinkSync(snapshot.keyPath);
    }
  } else {
    fs.writeFileSync(snapshot.keyPath, snapshot.keyBytes, { mode: 0o600 });
  }

  if (snapshot.sessionBytes === null) {
    if (fs.existsSync(snapshot.sessionPath)) {
      fs.unlinkSync(snapshot.sessionPath);
    }
  } else {
    fs.writeFileSync(snapshot.sessionPath, snapshot.sessionBytes, { mode: 0o600 });
  }
}

export function shouldAttemptOldSessionRevoke(previousSession: AgwSessionData | null): previousSession is AgwSessionData {
  if (!previousSession) {
    return false;
  }
  if (previousSession.status === "revoked") {
    return false;
  }
  if (previousSession.expiresAt <= Math.floor(Date.now() / 1000)) {
    return false;
  }
  return true;
}

export function resolvePreviousSignerMaterial(previousSession: AgwSessionData | null): `0x${string}` | null {
  if (!previousSession) {
    return null;
  }

  let raw = "";
  try {
    const signerRef = previousSession.sessionSignerRef;
    raw =
      signerRef.kind === "raw"
        ? signerRef.value.trim()
        : fs.existsSync(signerRef.value)
          ? fs.readFileSync(signerRef.value, "utf8").trim()
          : "";
  } catch {
    raw = "";
  }

  if (!PRIVATE_KEY_PATTERN.test(raw)) {
    return null;
  }
  return raw as `0x${string}`;
}

function parseSessionConfigExpiresAt(sessionConfig: Record<string, unknown>): number {
  const expiresAtRaw = sessionConfig.expiresAt;
  const parsed =
    typeof expiresAtRaw === "number"
      ? expiresAtRaw
      : typeof expiresAtRaw === "bigint"
        ? Number(expiresAtRaw)
        : typeof expiresAtRaw === "string" && /^\d+$/.test(expiresAtRaw.trim())
          ? Number.parseInt(expiresAtRaw, 10)
          : Number.NaN;

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error("Session bundle sessionConfig.expiresAt must be a positive integer.");
  }
  return parsed;
}

function isLoopbackHostname(hostname: string): boolean {
  return LOOPBACK_HOSTS.has(hostname);
}

export function resolveAppUrl(options: { appUrl?: string }): string {
  return options.appUrl ?? process.env.AGW_MCP_APP_URL ?? "https://mcp.abs.xyz";
}

export function validateAppUrl(appUrl: string): void {
  let appOrigin: URL;
  try {
    appOrigin = new URL(appUrl);
  } catch {
    throw new Error(`Invalid app URL: ${appUrl}`);
  }

  if (appOrigin.protocol !== "https:" && appOrigin.protocol !== "http:") {
    throw new Error(`Invalid app URL protocol: ${appOrigin.protocol}. Expected http or https.`);
  }
  if (appOrigin.protocol === "http:" && !isLoopbackHostname(appOrigin.hostname)) {
    throw new Error(`Refusing insecure app URL over http for non-loopback host: ${appOrigin.hostname}.`);
  }
}

export function assertBundleMatchesBootstrapRequest(input: {
  bundle: SessionBundlePayload;
  requestedChainId: number;
  localSignerAddress: string;
}): void {
  const nowUnixSeconds = Math.floor(Date.now() / 1000);
  const { bundle, requestedChainId, localSignerAddress } = input;

  if (bundle.chainId !== requestedChainId) {
    throw new Error(`Session bundle chain id (${bundle.chainId}) does not match requested chain id (${requestedChainId}).`);
  }
  if (bundle.expiresAt <= nowUnixSeconds) {
    throw new Error(`Session bundle is already expired at ${bundle.expiresAt}.`);
  }

  const sessionConfigExpiresAt = parseSessionConfigExpiresAt(bundle.sessionConfig);
  if (sessionConfigExpiresAt !== bundle.expiresAt) {
    throw new Error(`Session bundle expiresAt mismatch (bundle=${bundle.expiresAt}, sessionConfig=${sessionConfigExpiresAt}).`);
  }

  const bundleSignerAddress = bundle.sessionConfig.signer;
  if (bundleSignerAddress.toLowerCase() !== localSignerAddress.toLowerCase()) {
    throw new Error(
      `Session bundle signer (${bundleSignerAddress}) does not match locally generated signer (${localSignerAddress}).`,
    );
  }
}

export function buildLaunchUrl(input: {
  appUrl: string;
  chainId: number;
  signerAddress: string;
  callbackUrl: string;
  callbackState: string;
}): URL {
  const callbackUrl = new URL(input.callbackUrl);
  callbackUrl.searchParams.set("state", input.callbackState);

  const launchUrl = new URL("/session/new", input.appUrl);
  launchUrl.searchParams.set("callback_url", callbackUrl.toString());
  launchUrl.searchParams.set("chain_id", String(input.chainId));
  launchUrl.searchParams.set("signer", input.signerAddress);
  return launchUrl;
}
