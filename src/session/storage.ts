import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { AgwSessionData } from "./types.js";

export class SessionStorage {
  private readonly dir: string;
  private readonly filePath: string;

  constructor(dir?: string) {
    this.dir = dir ?? path.join(os.homedir(), ".agw-mcp");
    this.filePath = path.join(this.dir, "session.json");
  }

  get path(): string {
    return this.filePath;
  }

  get storageDir(): string {
    return this.dir;
  }

  private ensureDir(): void {
    fs.mkdirSync(this.dir, { recursive: true, mode: 0o700 });
    try {
      fs.chmodSync(this.dir, 0o700);
    } catch {
      // Ignore chmod errors on platforms that do not support unix permissions.
    }
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
        typeof parsed.createdAt !== "number" ||
        typeof parsed.updatedAt !== "number" ||
        (parsed.status !== "active" && parsed.status !== "revoked")
      ) {
        return null;
      }
      return parsed as AgwSessionData;
    } catch {
      return null;
    }
  }

  save(data: AgwSessionData): void {
    this.ensureDir();
    fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), { mode: 0o600 });
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
