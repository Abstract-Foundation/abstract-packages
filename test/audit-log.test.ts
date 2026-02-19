import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { AuditLog } from "../src/audit/log.js";

describe("audit log module", () => {
  it("appends redact-safe audit entries", async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "agw-mcp-audit-"));

    try {
      const audit = new AuditLog(tmpDir);
      audit.append({
        timestamp: "2026-02-18T00:00:00Z",
        tool: "send_transaction",
        phase: "request",
        payload: {
          privateKey: "0x59c6995e998f97a5a0044966f0945388cf0f5ddf3cd34e3c5d6f6e64f5f4a799",
          nested: {
            sessionSignerRef: "very-sensitive",
            safe: "ok",
          },
        },
      });
      audit.append({
        timestamp: "2026-02-18T00:00:01Z",
        tool: "send_transaction",
        phase: "response",
        payload: {
          txHash: "0xabc",
        },
      });
      await audit.flush();

      const lines = fs.readFileSync(audit.path, "utf8").trim().split("\n");
      expect(lines).toHaveLength(2);
      const first = JSON.parse(lines[0]) as Record<string, unknown>;
      const second = JSON.parse(lines[1]) as Record<string, unknown>;

      expect(first.payload).toEqual({
        privateKey: "[REDACTED]",
        nested: {
          sessionSignerRef: "[REDACTED]",
          safe: "ok",
        },
      });
      expect(second.payload).toEqual({
        txHash: "0xabc",
      });
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("rotates audit log files when size threshold is exceeded", async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "agw-mcp-audit-rotate-"));

    try {
      const audit = new AuditLog({
        storageDir: tmpDir,
        maxFileBytes: 120,
        maxFiles: 2,
      });

      for (let index = 0; index < 6; index += 1) {
        audit.append({
          timestamp: `2026-02-18T00:00:0${index}Z`,
          tool: "send_transaction",
          phase: "request",
          payload: {
            nonce: index,
            data: "x".repeat(64),
          },
        });
      }
      await audit.flush();

      expect(fs.existsSync(audit.path)).toBe(true);
      expect(fs.existsSync(`${audit.path}.1`)).toBe(true);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});
