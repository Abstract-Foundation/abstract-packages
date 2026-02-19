import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { AgwSessionData } from "./types.js";

const REDACTED_SIGNER_REF = "[REDACTED]";
const PRIVATE_KEY_PATTERN = /^0x[0-9a-fA-F]{64}$/;

export class SessionStorage {
  private readonly dir: string;
  private readonly filePath: string;
  private readonly signerKeyPath: string;

  constructor(dir?: string) {
    this.dir = dir ?? path.join(os.homedir(), ".agw-mcp");
    this.filePath = path.join(this.dir, "session.json");
    this.signerKeyPath = path.join(this.dir, "session-signer.key");
  }

  get path(): string {
    return this.filePath;
  }

  private ensureDir(): void {
    fs.mkdirSync(this.dir, { recursive: true, mode: 0o700 });
    try {
      fs.chmodSync(this.dir, 0o700);
    } catch {
      // Ignore chmod errors on platforms that do not support unix permissions.
    }
  }

  private ensureSignerKeyfile(privateKey: string): string {
    this.ensureDir();
    fs.writeFileSync(this.signerKeyPath, `${privateKey.trim()}\n`, { mode: 0o600 });
    try {
      fs.chmodSync(this.signerKeyPath, 0o600);
    } catch {
      // Ignore chmod errors on platforms that do not support unix permissions.
    }
    return this.signerKeyPath;
  }

  private resolveSignerRefForRuntime(data: AgwSessionData): AgwSessionData | null {
    if (data.sessionSignerRef.kind === "keyfile") {
      if (!fs.existsSync(data.sessionSignerRef.value)) {
        return null;
      }
      return data;
    }

    const rawValue = data.sessionSignerRef.value.trim();
    if (rawValue === REDACTED_SIGNER_REF) {
      if (!fs.existsSync(this.signerKeyPath)) {
        return null;
      }
      return {
        ...data,
        sessionSignerRef: {
          kind: "keyfile",
          value: this.signerKeyPath,
        },
      };
    }

    if (!PRIVATE_KEY_PATTERN.test(rawValue)) {
      return null;
    }

    return {
      ...data,
      sessionSignerRef: {
        kind: "keyfile",
        value: this.ensureSignerKeyfile(rawValue),
      },
    };
  }

  private sanitizeForPersistence(data: AgwSessionData): AgwSessionData {
    const signerRefValue = data.sessionSignerRef.kind === "raw" ? REDACTED_SIGNER_REF : data.sessionSignerRef.value;
    return {
      ...data,
      sessionSignerRef: {
        kind: data.sessionSignerRef.kind,
        value: signerRefValue,
      },
    };
  }

  load(): AgwSessionData | null {
    try {
      if (!fs.existsSync(this.filePath)) {
        return null;
      }
      const raw = fs.readFileSync(this.filePath, "utf8");
      const parsed = JSON.parse(raw) as Partial<AgwSessionData>;
      if (
        typeof parsed.accountAddress !== "string" ||
        typeof parsed.chainId !== "number" ||
        typeof parsed.expiresAt !== "number" ||
        typeof parsed.createdAt !== "number" ||
        typeof parsed.updatedAt !== "number" ||
        typeof parsed.status !== "string" ||
        typeof parsed.sessionConfig !== "object" ||
        !parsed.sessionConfig ||
        (parsed.sessionSignerRef?.kind !== "raw" && parsed.sessionSignerRef?.kind !== "keyfile") ||
        typeof parsed.sessionSignerRef?.value !== "string"
      ) {
        return null;
      }
      return this.resolveSignerRefForRuntime(parsed as AgwSessionData);
    } catch {
      return null;
    }
  }

  save(data: AgwSessionData): void {
    this.ensureDir();
    const normalized =
      data.sessionSignerRef.kind === "raw"
        ? {
            ...data,
            sessionSignerRef: {
              kind: "keyfile" as const,
              value: this.ensureSignerKeyfile(data.sessionSignerRef.value),
            },
          }
        : data;

    fs.writeFileSync(this.filePath, JSON.stringify(this.sanitizeForPersistence(normalized), null, 2), { mode: 0o600 });
  }

  delete(): void {
    try {
      if (fs.existsSync(this.filePath)) {
        fs.unlinkSync(this.filePath);
      }
    } catch {
      // Ignore file deletion errors.
    }
  }
}
