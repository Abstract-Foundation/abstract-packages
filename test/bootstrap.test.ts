import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { Logger } from "../src/utils/logger.js";
import { parseSessionBundleInput } from "../src/auth/callback.js";
import { materializeSessionFromBundle } from "../src/auth/provision.js";

jest.mock("open", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("../src/auth/handoff.js", () => ({
  startCallbackServer: jest.fn(),
}));

import open from "open";
import { runBootstrapFlow } from "../src/auth/bootstrap.js";
import { startCallbackServer } from "../src/auth/handoff.js";

const openMock = open as unknown as jest.Mock;
const startServerMock = startCallbackServer as unknown as jest.Mock;
const ORIGINAL_APP_URL = process.env.AGW_MCP_APP_URL;

function createLogger(): Logger {
  return {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    child: () => createLogger(),
  } as unknown as Logger;
}

function encodePayload(payload: unknown): string {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

describe("bootstrap callback/session bundle flow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.AGW_MCP_APP_URL = "https://onboarding.example";
  });

  afterAll(() => {
    if (ORIGINAL_APP_URL === undefined) {
      delete process.env.AGW_MCP_APP_URL;
      return;
    }
    process.env.AGW_MCP_APP_URL = ORIGINAL_APP_URL;
  });

  it("parses callback URL payloads into a validated bundle", () => {
    const payload = {
      accountAddress: "0x1111111111111111111111111111111111111111",
      chainId: 11124,
    };

    const encoded = encodePayload(payload);
    const parsed = parseSessionBundleInput(`http://127.0.0.1:8787/callback?session=${encoded}`);

    expect(parsed.accountAddress).toBe(payload.accountAddress);
    expect(parsed.chainId).toBe(11124);
  });

  it("materializes minimal read-only session bundle", () => {
    const now = 1_800_000_000;

    const session = materializeSessionFromBundle(
      {
        accountAddress: "0x1111111111111111111111111111111111111111",
        chainId: 11124,
      },
      {
        chainId: 11124,
        nowUnixSeconds: now,
      },
    );

    expect(session).toEqual({
      accountAddress: "0x1111111111111111111111111111111111111111",
      chainId: 11124,
      createdAt: now,
      updatedAt: now,
      status: "active",
    });
  });

  it("opens hosted onboarding URL with callback_url and chain_id; then saves session", async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "agw-mcp-bootstrap-flow-"));

    let resolvePayload!: (value: string) => void;
    const payloadPromise = new Promise<string>(resolve => {
      resolvePayload = resolve;
    });

    startServerMock.mockResolvedValue({
      callbackUrl: "http://127.0.0.1:4567/callback/abc123",
      waitForPayload: () => payloadPromise,
      close: async () => undefined,
    });

    openMock.mockImplementation(async (url: string) => {
      const launchUrl = new URL(url);
      expect(`${launchUrl.origin}${launchUrl.pathname}`).toBe("https://onboarding.example/session/new");
      const callbackUrlParam = launchUrl.searchParams.get("callback_url");
      expect(callbackUrlParam).toBeTruthy();
      const callbackUrl = new URL(callbackUrlParam!);
      expect(`${callbackUrl.origin}${callbackUrl.pathname}`).toBe("http://127.0.0.1:4567/callback/abc123");
      expect(callbackUrl.searchParams.get("state")).toMatch(/^[0-9a-f]{32}$/);
      expect(launchUrl.searchParams.get("chain_id")).toBe("11124");

      resolvePayload(
        encodePayload({
          accountAddress: "0x1111111111111111111111111111111111111111",
          chainId: 11124,
        }),
      );
    });

    try {
      const session = await runBootstrapFlow(createLogger(), {
        chainId: 11124,
        storageDir: tmpDir,
      });

      expect(startServerMock).toHaveBeenCalledWith(
        expect.objectContaining({
          expectedState: expect.stringMatching(/^[0-9a-f]{32}$/),
        }),
      );
      expect(session.chainId).toBe(11124);
      expect(fs.existsSync(path.join(tmpDir, ".bootstrap-init.lock"))).toBe(false);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("defaults to mcp.abs.xyz when onboarding app URL is not configured", async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "agw-mcp-bootstrap-flow-"));
    const previous = process.env.AGW_MCP_APP_URL;
    delete process.env.AGW_MCP_APP_URL;

    try {
      let resolvePayload!: (value: string) => void;
      const payloadPromise = new Promise<string>(resolve => {
        resolvePayload = resolve;
      });

      startServerMock.mockResolvedValue({
        callbackUrl: "http://127.0.0.1:4567/callback/default-host",
        waitForPayload: () => payloadPromise,
        close: async () => undefined,
      });

      openMock.mockImplementation(async (url: string) => {
        const launchUrl = new URL(url);
        expect(`${launchUrl.origin}${launchUrl.pathname}`).toBe("https://mcp.abs.xyz/session/new");

        resolvePayload(
          encodePayload({
            accountAddress: "0x1111111111111111111111111111111111111111",
            chainId: 11124,
          }),
        );
      });

      const session = await runBootstrapFlow(createLogger(), {
        chainId: 11124,
        storageDir: tmpDir,
      });
      expect(session.chainId).toBe(11124);
    } finally {
      if (previous === undefined) {
        delete process.env.AGW_MCP_APP_URL;
      } else {
        process.env.AGW_MCP_APP_URL = previous;
      }
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("rejects insecure non-loopback http app URLs", async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "agw-mcp-bootstrap-flow-"));

    try {
      await expect(
        runBootstrapFlow(createLogger(), {
          chainId: 11124,
          storageDir: tmpDir,
          appUrl: "http://mcp.abs.xyz",
        }),
      ).rejects.toThrow("Refusing insecure app URL over http for non-loopback host");
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});
