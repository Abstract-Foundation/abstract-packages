import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { SessionManager, mapOnchainSessionStatus } from "../src/session/manager.js";
import { getSessionStatusTool } from "../src/tools/get-session-status.js";
import type { ToolContext } from "../src/tools/types.js";
import type { AgwSessionData } from "../src/session/types.js";
import { Logger } from "../src/utils/logger.js";

function buildSessionData(overrides: Partial<AgwSessionData> = {}): AgwSessionData {
  const now = Math.floor(Date.now() / 1000);
  return {
    accountAddress: "0x1111111111111111111111111111111111111111",
    chainId: 11124,
    expiresAt: now + 3600,
    createdAt: now,
    updatedAt: now,
    status: "active",
    sessionConfig: {
      signer: "0x2222222222222222222222222222222222222222",
      expiresAt: BigInt(now + 3600),
      feeLimit: {
        limitType: 1,
        limit: 1000000000000000n,
        period: 0n,
      },
      callPolicies: [],
      transferPolicies: [],
    },
    sessionSignerRef: {
      kind: "keyfile",
      value: "/tmp/session.key",
    },
    ...overrides,
  };
}

describe("session status mapping", () => {
  it.each([
    [0, "NotInitialized"],
    [1, "Active"],
    [2, "Closed"],
    [3, "Expired"],
  ])("maps on-chain code %s to %s", (statusCode, expectedStatus) => {
    expect(mapOnchainSessionStatus(statusCode)).toBe(expectedStatus);
  });

  it("throws for unsupported status codes", () => {
    expect(() => mapOnchainSessionStatus(99)).toThrow("Unsupported on-chain session status code: 99");
  });

  it("returns NotInitialized metadata when no session is loaded", async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "agw-mcp-status-"));
    try {
      const manager = new SessionManager(new Logger("test"), { storageDir: tmpDir, chainId: 11124 });
      const status = await manager.getOnchainSessionStatus();

      expect(status.status).toBe("NotInitialized");
      expect(status.statusCode).toBe(0);
      expect(status.source).toBe("local");
      expect(typeof status.checkedAt).toBe("number");
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("tool returns mapped on-chain enum and metadata", async () => {
    const checkedAt = 1_800_000_000;
    const session = buildSessionData({
      expiresAt: checkedAt + 120,
      createdAt: checkedAt - 60,
      updatedAt: checkedAt - 30,
      status: "pending",
    });

    const context = {
      sessionManager: {
        getSession: () => session,
        getChainId: () => 11124,
        getSessionStatus: () => "expired",
        getOnchainSessionStatus: async () => ({
          status: "Active",
          statusCode: 1,
          source: "onchain",
          checkedAt,
        }),
      },
      logger: new Logger("test"),
    } as unknown as ToolContext;

    const result = (await getSessionStatusTool.handler({}, context)) as Record<string, unknown>;

    expect(result).toEqual({
      status: "Active",
      statusCode: 1,
      source: "onchain",
      active: true,
      localStatus: "expired",
      accountAddress: session.accountAddress,
      chainId: session.chainId,
      expiresAt: session.expiresAt,
      checkedAt,
      expiresInSeconds: 120,
    });
  });

  it("returns terminal on-chain status even when reconcile clears local session", async () => {
    const checkedAt = 1_800_000_100;
    const session = buildSessionData({
      expiresAt: checkedAt + 120,
      status: "active",
    });
    let activeSession: AgwSessionData | null = session;

    const context = {
      sessionManager: {
        getSession: () => activeSession,
        clearSession: () => {
          activeSession = null;
        },
        getChainId: () => 11124,
        getSessionStatus: () => (activeSession ? "active" : "missing"),
        getOnchainSessionStatus: async () => ({
          status: "Closed",
          statusCode: 2,
          source: "onchain",
          checkedAt,
        }),
      },
      logger: new Logger("test"),
    } as unknown as ToolContext;

    const result = (await getSessionStatusTool.handler({}, context)) as Record<string, unknown>;

    expect(result).toEqual({
      status: "Closed",
      statusCode: 2,
      source: "onchain",
      active: false,
      localStatus: "missing",
      accountAddress: session.accountAddress,
      chainId: session.chainId,
      expiresAt: session.expiresAt,
      checkedAt,
      expiresInSeconds: 120,
    });
  });
});
