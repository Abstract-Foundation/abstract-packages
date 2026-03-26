import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { resolveDefaultStorageDir } from "../session/storage.js";

export interface AuditLogEntry {
  timestamp: string;
  tool: string;
  phase: "request" | "response" | "error";
  payload: Record<string, unknown>;
}

export interface AuditLogOptions {
  storageDir?: string;
  maxFileBytes?: number;
  maxFiles?: number;
}

const SENSITIVE_KEY_PATTERNS = [/private/i, /secret/i, /signer/i, /key/i];
const PRIVATE_KEY_PATTERN = /^0x[0-9a-fA-F]{64}$/;
const DEFAULT_MAX_FILE_BYTES = 5 * 1024 * 1024;
const DEFAULT_MAX_FILES = 5;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function shouldRedactKey(key: string): boolean {
  return SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(key));
}

function redactValue(value: unknown): unknown {
  if (typeof value === "string") {
    if (PRIVATE_KEY_PATTERN.test(value)) {
      return "[REDACTED]";
    }
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(redactValue);
  }

  if (isRecord(value)) {
    const out: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value)) {
      if (shouldRedactKey(key)) {
        out[key] = "[REDACTED]";
        continue;
      }
      out[key] = redactValue(child);
    }
    return out;
  }

  return value;
}

export class AuditLog {
  private readonly logFilePath: string;
  private readonly maxFileBytes: number;
  private readonly maxFiles: number;
  private writeQueue: Promise<void> = Promise.resolve();

  constructor(options: string | AuditLogOptions = {}) {
    const resolvedOptions =
      typeof options === "string" ? { storageDir: options } : options;
    const dir = resolvedOptions.storageDir ?? resolveDefaultStorageDir();
    fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
    this.logFilePath = path.join(dir, "audit.log.ndjson");
    this.maxFileBytes = resolvedOptions.maxFileBytes ?? DEFAULT_MAX_FILE_BYTES;
    this.maxFiles = resolvedOptions.maxFiles ?? DEFAULT_MAX_FILES;
  }

  get path(): string {
    return this.logFilePath;
  }

  append(entry: AuditLogEntry): void {
    const redacted: AuditLogEntry = {
      ...entry,
      payload: redactValue(entry.payload) as Record<string, unknown>,
    };
    const line = `${JSON.stringify(redacted)}\n`;
    const lineBytes = Buffer.byteLength(line, "utf8");

    this.writeQueue = this.writeQueue
      .then(async () => {
        await this.rotateIfNeeded(lineBytes);
        await fsp.appendFile(this.logFilePath, line, "utf8");
      })
      .catch(() => undefined);
  }

  async flush(): Promise<void> {
    await this.writeQueue;
  }

  private async rotateIfNeeded(incomingBytes: number): Promise<void> {
    const currentSize = await this.getCurrentFileSize();
    if (currentSize + incomingBytes <= this.maxFileBytes) {
      return;
    }

    for (let index = this.maxFiles - 1; index >= 1; index -= 1) {
      const source = `${this.logFilePath}.${index}`;
      const target = `${this.logFilePath}.${index + 1}`;
      if (await this.exists(source)) {
        await this.safeRename(source, target);
      }
    }

    if (await this.exists(this.logFilePath)) {
      await this.safeRename(this.logFilePath, `${this.logFilePath}.1`);
    }
  }

  private async getCurrentFileSize(): Promise<number> {
    try {
      const stats = await fsp.stat(this.logFilePath);
      return stats.size;
    } catch {
      return 0;
    }
  }

  private async exists(filePath: string): Promise<boolean> {
    try {
      await fsp.access(filePath, fs.constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }

  private async safeRename(source: string, target: string): Promise<void> {
    try {
      await fsp.unlink(target);
    } catch {
      // ignore target missing
    }

    try {
      await fsp.rename(source, target);
    } catch {
      // ignore rename races
    }
  }
}
