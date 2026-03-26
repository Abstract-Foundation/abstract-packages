import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { resolveAgwHome } from "../config/runtime.js";
import { isSessionPolicyMeta } from "../policy/meta.js";
import { authKeyfileExists, deleteAuthKeyfile, formatAuthKeyfile } from "../privy/auth.js";
import type { AgwSessionData } from "./types.js";

const LEGACY_STORAGE_DIRNAME = ".agw-mcp";

export function resolveDefaultStorageDir(): string {
  return resolveAgwHome();
}

export function resolveLegacyStorageDir(): string {
  return path.join(os.homedir(), LEGACY_STORAGE_DIRNAME);
}

export class SessionStorage {
  private readonly dir: string;
  private readonly filePath: string;
  private readonly legacyDir: string | null;
  private readonly legacyFilePath: string | null;
  private readonly explicitDir: boolean;

  constructor(dir?: string) {
    this.explicitDir = dir !== undefined;
    this.dir = dir ?? resolveAgwHome();
    this.filePath = path.join(this.dir, "session.json");
    this.legacyDir = this.explicitDir ? null : resolveLegacyStorageDir();
    this.legacyFilePath = this.legacyDir ? path.join(this.legacyDir, "session.json") : null;
  }

  get path(): string {
    return this.filePath;
  }

  get storageDir(): string {
    return this.dir;
  }

  get legacyStorageDir(): string | null {
    return this.legacyDir;
  }

  private ensureDir(): void {
    fs.mkdirSync(this.dir, { recursive: true, mode: 0o700 });
    try {
      fs.chmodSync(this.dir, 0o700);
    } catch {
      // Ignore chmod errors on platforms that do not support unix permissions.
    }
  }

  private writeJsonAtomic(filePath: string, value: unknown): void {
    const tempPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(value, null, 2), { mode: 0o600 });
    fs.renameSync(tempPath, filePath);
  }

  private loadSessionFile(filePath: string): AgwSessionData | null {
    try {
      if (!fs.existsSync(filePath)) {
        return null;
      }
      const raw = fs.readFileSync(filePath, "utf8");
      const parsed = this.normalizeSignerBinding(JSON.parse(raw) as Partial<AgwSessionData>);
      if (
        typeof parsed.accountAddress !== "string" ||
        (parsed.underlyingSignerAddress !== undefined && typeof parsed.underlyingSignerAddress !== "string") ||
        typeof parsed.chainId !== "number" ||
        typeof parsed.createdAt !== "number" ||
        typeof parsed.updatedAt !== "number" ||
        typeof parsed.status !== "string" ||
        (parsed.privyWalletId !== undefined && typeof parsed.privyWalletId !== "string") ||
        (
          parsed.privySignerBinding !== undefined &&
          (
            parsed.privySignerBinding.type !== "device_authorization_key" ||
            parsed.privySignerBinding.canonicalType !== "key_quorum" ||
            typeof parsed.privySignerBinding.id !== "string" ||
            !Array.isArray(parsed.privySignerBinding.policyIds) ||
            !parsed.privySignerBinding.policyIds.every(entry => typeof entry === "string") ||
            typeof parsed.privySignerBinding.fingerprint !== "string" ||
            typeof parsed.privySignerBinding.label !== "string" ||
            typeof parsed.privySignerBinding.createdAt !== "number"
          )
        ) ||
        (parsed.privyAuthKeyRef !== undefined && parsed.privyAuthKeyRef?.kind !== "keyfile") ||
        (parsed.privyAuthKeyRef !== undefined && typeof parsed.privyAuthKeyRef?.value !== "string") ||
        (parsed.policyMeta !== undefined && !isSessionPolicyMeta(parsed.policyMeta)) ||
        !this.hasValidCapabilitySummary(parsed as AgwSessionData)
      ) {
        return null;
      }
      return parsed as AgwSessionData;
    } catch {
      return null;
    }
  }

  private normalizeSignerBinding(parsed: Partial<AgwSessionData>): AgwSessionData {
    const next = { ...parsed } as AgwSessionData;

    if (
      !next.privySignerBinding &&
      typeof next.privySignerId === "string" &&
      Array.isArray(next.privyPolicyIds) &&
      next.privyPolicyIds.every(entry => typeof entry === "string") &&
      typeof next.privySignerFingerprint === "string" &&
      typeof next.privySignerLabel === "string" &&
      typeof next.privySignerCreatedAt === "number"
    ) {
      next.privySignerBinding = {
        type: next.privySignerType ?? "device_authorization_key",
        canonicalType: "key_quorum",
        id: next.privySignerId,
        policyIds: next.privyPolicyIds,
        fingerprint: next.privySignerFingerprint,
        label: next.privySignerLabel,
        createdAt: next.privySignerCreatedAt,
      };
    }

    if (
      !next.privySignerBinding &&
      typeof next.privyQuorumId === "string" &&
      typeof next.privyPolicyId === "string"
    ) {
      next.privySignerBinding = {
        type: "device_authorization_key",
        canonicalType: "key_quorum",
        id: next.privyQuorumId,
        policyIds: [next.privyPolicyId],
        fingerprint: "legacy",
        label: "Legacy AGW MCP signer",
        createdAt: next.updatedAt,
      };
    }

    return next;
  }

  private resolveAuthKeyRefForRuntime(data: AgwSessionData): AgwSessionData | null {
    if (!data.privyAuthKeyRef) {
      return data;
    }

    const keyfilePath = data.privyAuthKeyRef.value;

    if (!fs.existsSync(keyfilePath)) {
      if (data.status === "revoked") {
        return data;
      }
      return null;
    }

    return data;
  }

  private hasValidCapabilitySummary(data: AgwSessionData): boolean {
    if (data.capabilitySummary === undefined) {
      return true;
    }

    const summary = data.capabilitySummary;
    return (
      typeof summary.chainId === "number" &&
      Number.isInteger(summary.chainId) &&
      summary.chainId > 0 &&
      typeof summary.expiresAt === "number" &&
      Number.isInteger(summary.expiresAt) &&
      summary.expiresAt > 0 &&
      typeof summary.feeLimit === "string" &&
      summary.feeLimit.trim() !== "" &&
      typeof summary.maxValuePerUse === "string" &&
      summary.maxValuePerUse.trim() !== "" &&
      Array.isArray(summary.enabledTools) &&
      summary.enabledTools.every(entry => typeof entry === "string") &&
      Array.isArray(summary.notes) &&
      summary.notes.every(entry => typeof entry === "string")
    );
  }

  private migrateLegacySession(data: AgwSessionData): AgwSessionData {
    if (this.explicitDir || !this.legacyDir || !this.legacyFilePath || fs.existsSync(this.filePath)) {
      return data;
    }

    const next: AgwSessionData = {
      ...data,
      privySignerBinding: data.privySignerBinding ? { ...data.privySignerBinding, policyIds: [...data.privySignerBinding.policyIds] } : undefined,
      privyPolicyIds: data.privyPolicyIds ? [...data.privyPolicyIds] : undefined,
      capabilitySummary: data.capabilitySummary
        ? {
            ...data.capabilitySummary,
            enabledTools: [...data.capabilitySummary.enabledTools],
            notes: [...data.capabilitySummary.notes],
          }
        : undefined,
      policyMeta: data.policyMeta
        ? {
            ...data.policyMeta,
            enabledTools: [...data.policyMeta.enabledTools],
            selectedAppIds: [...data.policyMeta.selectedAppIds],
            selectedContractAddresses: [...data.policyMeta.selectedContractAddresses],
            unverifiedAppIds: [...data.policyMeta.unverifiedAppIds],
            warnings: [...data.policyMeta.warnings],
          }
        : undefined,
    };

    if (data.privyAuthKeyRef?.kind === "keyfile" && fs.existsSync(data.privyAuthKeyRef.value)) {
      this.ensureDir();
      const migratedKeyPath = path.join(this.dir, "privy-auth.key");
      if (data.privyAuthKeyRef.value !== migratedKeyPath) {
        fs.copyFileSync(data.privyAuthKeyRef.value, migratedKeyPath);
        try {
          fs.chmodSync(migratedKeyPath, 0o600);
        } catch {
          // Ignore chmod failures on non-posix platforms.
        }
      }
      next.privyAuthKeyRef = {
        kind: "keyfile",
        value: migratedKeyPath,
      };
    }

    this.ensureDir();
    this.writeJsonAtomic(this.filePath, next);
    return next;
  }

  load(): AgwSessionData | null {
    const current = this.loadSessionFile(this.filePath);
    if (current) {
      return this.resolveAuthKeyRefForRuntime(current);
    }

    if (!this.legacyFilePath) {
      return null;
    }

    const legacy = this.loadSessionFile(this.legacyFilePath);
    if (!legacy) {
      return null;
    }

    return this.resolveAuthKeyRefForRuntime(this.migrateLegacySession(legacy));
  }

  save(data: AgwSessionData): void {
    this.ensureDir();
    this.writeJsonAtomic(this.filePath, data);
  }

  saveProvisionedSession(data: AgwSessionData, privateKeyDer: Buffer): void {
    this.ensureDir();
    const keyPath = path.join(this.dir, "privy-auth.key");
    const keyTempPath = `${keyPath}.${process.pid}.${Date.now()}.tmp`;

    fs.writeFileSync(keyTempPath, formatAuthKeyfile(privateKeyDer), { mode: 0o600 });
    fs.renameSync(keyTempPath, keyPath);

    try {
      this.writeJsonAtomic(this.filePath, data);
    } catch (error) {
      try {
        fs.unlinkSync(keyPath);
      } catch {
        // Ignore cleanup failures on rollback.
      }
      throw error;
    }
  }

  deleteAuthKeyfile(): void {
    if (!authKeyfileExists(this.dir)) {
      return;
    }
    deleteAuthKeyfile(this.dir);
  }

  delete(): void {
    try {
      if (fs.existsSync(this.filePath)) {
        fs.unlinkSync(this.filePath);
      }
    } catch {
      // Ignore file deletion errors.
    }
    this.deleteAuthKeyfile();
  }
}
