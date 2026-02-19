import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { PolicyPreview } from "../policies/index.js";

export interface SecurityAssessment {
  level: "low" | "high";
  requiresConfirmation: boolean;
  reasons: string[];
}

export interface SecurityAuditEntry {
  timestamp: string;
  presetId: string;
  chainId: number;
  riskLevel: SecurityAssessment["level"];
  reasons: string[];
  confirmed: boolean;
}

export interface SecurityAuditLogOptions {
  maxEntries?: number;
  storageDir?: string;
  fileName?: string;
}

const HIGH_RISK_EXPIRY_SECONDS = 4 * 60 * 60;
const HIGH_RISK_MAX_VALUE_PER_USE = 1_000_000_000_000_000_000n;

function isSecurityAuditEntry(value: unknown): value is SecurityAuditEntry {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.timestamp === "string" &&
    typeof candidate.presetId === "string" &&
    typeof candidate.chainId === "number" &&
    (candidate.riskLevel === "low" || candidate.riskLevel === "high") &&
    Array.isArray(candidate.reasons) &&
    typeof candidate.confirmed === "boolean"
  );
}

function loadExistingEntries(filePath: string, maxEntries: number): SecurityAuditEntry[] {
  try {
    if (!fs.existsSync(filePath)) {
      return [];
    }

    const raw = fs.readFileSync(filePath, "utf8");
    if (!raw.trim()) {
      return [];
    }

    const lines = raw
      .split("\n")
      .map(line => line.trim())
      .filter(Boolean);

    const entries: SecurityAuditEntry[] = [];
    for (const line of lines) {
      try {
        const parsed = JSON.parse(line) as unknown;
        if (isSecurityAuditEntry(parsed)) {
          entries.push(parsed);
        }
      } catch {
        // Skip malformed lines.
      }
    }

    if (entries.length <= maxEntries) {
      return entries;
    }
    return entries.slice(entries.length - maxEntries);
  } catch {
    return [];
  }
}

export function assessPolicyRisk(preview: PolicyPreview): SecurityAssessment {
  const reasons: string[] = [];
  const { policyPayload } = preview;
  const maxValuePerUse = BigInt(policyPayload.sessionConfig.maxValuePerUse);

  if (policyPayload.expiresAt - Math.floor(Date.now() / 1000) > HIGH_RISK_EXPIRY_SECONDS) {
    reasons.push("Session expiry exceeds recommended short-lived window (4h).");
  }
  if (maxValuePerUse > HIGH_RISK_MAX_VALUE_PER_USE) {
    reasons.push("maxValuePerUse exceeds default safety cap.");
  }
  if (policyPayload.sessionConfig.callPolicies.some(policy => !policy.selector)) {
    reasons.push("One or more call policies are not selector-scoped.");
  }

  const requiresConfirmation = reasons.length > 0;
  return {
    level: requiresConfirmation ? "high" : "low",
    requiresConfirmation,
    reasons,
  };
}

export class SecurityAuditLog {
  private readonly entries: SecurityAuditEntry[];
  private readonly maxEntries: number;
  private readonly filePath: string | null;

  constructor(options: number | SecurityAuditLogOptions = {}) {
    if (typeof options === "number") {
      this.maxEntries = options;
      this.filePath = null;
      this.entries = [];
      return;
    }

    this.maxEntries = options.maxEntries ?? 200;
    const storageDir = options.storageDir ?? path.join(os.homedir(), ".agw-mcp");
    const fileName = options.fileName ?? "companion-security-audit.ndjson";

    fs.mkdirSync(storageDir, { recursive: true, mode: 0o700 });
    this.filePath = path.join(storageDir, fileName);
    this.entries = loadExistingEntries(this.filePath, this.maxEntries);
  }

  append(entry: SecurityAuditEntry): void {
    this.entries.push(entry);
    if (this.entries.length > this.maxEntries) {
      this.entries.splice(0, this.entries.length - this.maxEntries);
    }

    if (!this.filePath) {
      return;
    }

    try {
      fs.appendFileSync(this.filePath, `${JSON.stringify(entry)}\n`, "utf8");
    } catch {
      // Fail-open for audit persistence to avoid breaking auth flow.
    }
  }

  list(): SecurityAuditEntry[] {
    return [...this.entries];
  }
}
