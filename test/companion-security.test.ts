import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { SecurityAuditLog, assessPolicyRisk } from "../companion/src/security/index.js";
import type { PolicyPreview } from "../companion/src/policies/index.js";

function buildPreview(overrides: Partial<PolicyPreview> = {}): PolicyPreview {
  return {
    presetId: "custom",
    label: "Custom",
    description: "custom",
    policyPayload: {
      expiresAt: Math.floor(Date.now() / 1000) + 900,
      sessionConfig: {
        feeLimit: "1000",
        maxValuePerUse: "0",
        callPolicies: [],
        transferPolicies: [],
      },
    },
    ...overrides,
  };
}

describe("companion security controls", () => {
  it("returns low risk for short-lived zero-value policies", () => {
    const assessment = assessPolicyRisk(buildPreview());
    expect(assessment).toEqual({
      level: "low",
      requiresConfirmation: false,
      reasons: [],
    });
  });

  it("flags high-risk policies for explicit confirmation", () => {
    const assessment = assessPolicyRisk(
      buildPreview({
        policyPayload: {
          expiresAt: Math.floor(Date.now() / 1000) + 20_000,
          sessionConfig: {
            feeLimit: "1000",
            maxValuePerUse: "2000000000000000000",
            callPolicies: [{ target: "0x1111111111111111111111111111111111111111" }],
            transferPolicies: [],
          },
        },
      }),
    );

    expect(assessment.level).toBe("high");
    expect(assessment.requiresConfirmation).toBe(true);
    expect(assessment.reasons.length).toBeGreaterThan(0);
  });

  it("stores auditable risk decisions", () => {
    const log = new SecurityAuditLog(2);
    log.append({
      timestamp: "2026-02-18T00:00:00Z",
      presetId: "custom",
      chainId: 11124,
      riskLevel: "high",
      reasons: ["risk-a"],
      confirmed: true,
    });
    log.append({
      timestamp: "2026-02-18T00:01:00Z",
      presetId: "read_only",
      chainId: 11124,
      riskLevel: "low",
      reasons: [],
      confirmed: false,
    });
    log.append({
      timestamp: "2026-02-18T00:02:00Z",
      presetId: "swap",
      chainId: 11124,
      riskLevel: "high",
      reasons: ["risk-b"],
      confirmed: true,
    });

    expect(log.list()).toEqual([
      {
        timestamp: "2026-02-18T00:01:00Z",
        presetId: "read_only",
        chainId: 11124,
        riskLevel: "low",
        reasons: [],
        confirmed: false,
      },
      {
        timestamp: "2026-02-18T00:02:00Z",
        presetId: "swap",
        chainId: 11124,
        riskLevel: "high",
        reasons: ["risk-b"],
        confirmed: true,
      },
    ]);
  });

  it("persists audit history when storageDir is configured", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "agw-mcp-companion-security-"));

    try {
      const first = new SecurityAuditLog({
        storageDir: tmpDir,
        maxEntries: 3,
      });
      first.append({
        timestamp: "2026-02-18T00:03:00Z",
        presetId: "transfer",
        chainId: 11124,
        riskLevel: "low",
        reasons: [],
        confirmed: false,
      });

      const second = new SecurityAuditLog({
        storageDir: tmpDir,
        maxEntries: 3,
      });
      expect(second.list()).toEqual([
        {
          timestamp: "2026-02-18T00:03:00Z",
          presetId: "transfer",
          chainId: 11124,
          riskLevel: "low",
          reasons: [],
          confirmed: false,
        },
      ]);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});
