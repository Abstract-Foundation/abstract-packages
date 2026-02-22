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

jest.mock("../src/session/revoke.js", () => ({
  revokeSessionOnchain: jest.fn(async () => ({
    transactionHash: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    sessionHash: "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
  })),
}));

import open from "open";
import { runBootstrapFlow } from "../src/auth/bootstrap.js";
import { startCallbackServer } from "../src/auth/handoff.js";
import { revokeSessionOnchain } from "../src/session/revoke.js";

const openMock = open as unknown as jest.Mock;
const startServerMock = startCallbackServer as unknown as jest.Mock;
const revokeSessionOnchainMock = revokeSessionOnchain as unknown as jest.Mock;

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
  });

  it("parses callback URL payloads into a validated session bundle", () => {
    const payload = {
      accountAddress: "0x1111111111111111111111111111111111111111",
      chainId: 11124,
      expiresAt: 1_900_000_000,
      sessionConfig: {
        signer: "0x2222222222222222222222222222222222222222",
        expiresAt: "1900000000",
        feeLimit: { limitType: 1, limit: "1", period: "0" },
        callPolicies: [],
        transferPolicies: [],
      },
    };

    const encoded = encodePayload(payload);
    const parsed = parseSessionBundleInput(`http://127.0.0.1:8787/callback?session=${encoded}`);

    expect(parsed.accountAddress).toBe(payload.accountAddress);
    expect(parsed.chainId).toBe(11124);
    expect(parsed.expiresAt).toBe(1_900_000_000);
    expect(parsed.sessionConfig).toEqual(payload.sessionConfig);
  });

  it("materializes session bundle by pairing with existing local signer keyfile", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "agw-mcp-bootstrap-"));
    const now = 1_800_000_000;

    try {
      const keyfilePath = path.join(tmpDir, "session-signer.key");
      fs.writeFileSync(keyfilePath, "0x0123456789012345678901234567890123456789012345678901234567890123\n", {
        mode: 0o600,
      });

      const session = materializeSessionFromBundle(
        {
          accountAddress: "0x1111111111111111111111111111111111111111",
          chainId: 11124,
          expiresAt: now + 3600,
          sessionConfig: {
            signer: "0x2222222222222222222222222222222222222222",
            expiresAt: String(now + 3600),
            feeLimit: { limitType: 1, limit: "1", period: "0" },
            callPolicies: [],
            transferPolicies: [],
          },
        },
        {
          chainId: 11124,
          storageDir: tmpDir,
          nowUnixSeconds: now,
        },
      );

      expect(session.sessionSignerRef.kind).toBe("keyfile");
      expect(session.sessionSignerRef.value).toBe(keyfilePath);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("fails materialization when local signer keyfile is missing", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "agw-mcp-bootstrap-"));

    try {
      expect(() =>
        materializeSessionFromBundle(
          {
            accountAddress: "0x1111111111111111111111111111111111111111",
            chainId: 11124,
            expiresAt: 1_900_000_000,
            sessionConfig: {
              signer: "0x2222222222222222222222222222222222222222",
              expiresAt: "1900000000",
              feeLimit: { limitType: 1, limit: "1", period: "0" },
              callPolicies: [],
              transferPolicies: [],
            },
          },
          {
            chainId: 11124,
            storageDir: tmpDir,
          },
        ),
      ).toThrow("Session signer keyfile is missing");
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("fails materialization when local signer keyfile format is invalid", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "agw-mcp-bootstrap-"));

    try {
      fs.writeFileSync(path.join(tmpDir, "session-signer.key"), "not-a-private-key\n", { mode: 0o600 });
      expect(() =>
        materializeSessionFromBundle(
          {
            accountAddress: "0x1111111111111111111111111111111111111111",
            chainId: 11124,
            expiresAt: 1_900_000_000,
            sessionConfig: {
              signer: "0x2222222222222222222222222222222222222222",
              expiresAt: "1900000000",
              feeLimit: { limitType: 1, limit: "1", period: "0" },
              callPolicies: [],
              transferPolicies: [],
            },
          },
          {
            chainId: 11124,
            storageDir: tmpDir,
          },
        ),
      ).toThrow("Session signer keyfile");
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("opens hosted onboarding URL with callback_url, chain_id, and signer; then saves session", async () => {
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
      expect(`${launchUrl.origin}${launchUrl.pathname}`).toBe("https://app-jarrodwatts.vercel.app/session/new");
      const callbackUrlParam = launchUrl.searchParams.get("callback_url");
      expect(callbackUrlParam).toBeTruthy();
      const callbackUrl = new URL(callbackUrlParam!);
      expect(`${callbackUrl.origin}${callbackUrl.pathname}`).toBe("http://127.0.0.1:4567/callback/abc123");
      expect(callbackUrl.searchParams.get("state")).toMatch(/^[0-9a-f]{32}$/);
      expect(launchUrl.searchParams.get("chain_id")).toBe("11124");

      const signer = launchUrl.searchParams.get("signer");
      expect(signer).toMatch(/^0x[0-9a-fA-F]{40}$/);

      const keyfilePath = path.join(tmpDir, "session-signer.key");
      expect(fs.existsSync(keyfilePath)).toBe(true);

      resolvePayload(
        encodePayload({
          accountAddress: "0x1111111111111111111111111111111111111111",
          chainId: 11124,
          expiresAt: 1_900_000_000,
          sessionConfig: {
            signer,
            expiresAt: "1900000000",
            feeLimit: { limitType: 1, limit: "1", period: "0" },
            callPolicies: [],
            transferPolicies: [],
          },
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
      expect(session.sessionSignerRef.kind).toBe("keyfile");
      expect(session.sessionSignerRef.value).toBe(path.join(tmpDir, "session-signer.key"));
      expect(session.chainId).toBe(11124);
      expect(fs.existsSync(path.join(tmpDir, ".bootstrap-init.lock"))).toBe(false);
    } finally {
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

  it("fails when another bootstrap lock already exists", async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "agw-mcp-bootstrap-lock-"));
    fs.mkdirSync(tmpDir, { recursive: true });
    fs.writeFileSync(path.join(tmpDir, ".bootstrap-init.lock"), JSON.stringify({ pid: process.pid }), { mode: 0o600 });

    try {
      await expect(
        runBootstrapFlow(createLogger(), {
          chainId: 11124,
          storageDir: tmpDir,
        }),
      ).rejects.toThrow("already in progress");
      expect(startServerMock).not.toHaveBeenCalled();
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("recovers stale bootstrap lock and continues", async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "agw-mcp-bootstrap-lock-"));
    const lockPath = path.join(tmpDir, ".bootstrap-init.lock");
    fs.mkdirSync(tmpDir, { recursive: true });
    fs.writeFileSync(lockPath, "stale-lock", { mode: 0o600 });

    const staleAt = new Date(Date.now() - 2 * 60 * 60 * 1000);
    fs.utimesSync(lockPath, staleAt, staleAt);

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
      const signer = launchUrl.searchParams.get("signer");
      const expiresAt = Math.floor(Date.now() / 1000) + 3600;
      resolvePayload(
        encodePayload({
          accountAddress: "0x1111111111111111111111111111111111111111",
          chainId: 11124,
          expiresAt,
          sessionConfig: {
            signer,
            expiresAt: String(expiresAt),
            feeLimit: { limitType: 1, limit: "1", period: "0" },
            callPolicies: [],
            transferPolicies: [],
          },
        }),
      );
    });

    try {
      await expect(
        runBootstrapFlow(createLogger(), {
          chainId: 11124,
          storageDir: tmpDir,
        }),
      ).resolves.toBeDefined();
      expect(fs.existsSync(lockPath)).toBe(false);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("rejects bundle when returned session signer mismatches local signer", async () => {
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

    openMock.mockImplementation(async () => {
      resolvePayload(
        encodePayload({
          accountAddress: "0x1111111111111111111111111111111111111111",
          chainId: 11124,
          expiresAt: 1_900_000_000,
          sessionConfig: {
            signer: "0x3333333333333333333333333333333333333333",
            expiresAt: "1900000000",
            feeLimit: { limitType: 1, limit: "1", period: "0" },
            callPolicies: [],
            transferPolicies: [],
          },
        }),
      );
    });

    try {
      await expect(
        runBootstrapFlow(createLogger(), {
          chainId: 11124,
          storageDir: tmpDir,
        }),
      ).rejects.toThrow("does not match locally generated signer");
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("rejects malformed payload with invalid account address", () => {
    const payload = {
      accountAddress: "not-an-address",
      chainId: 11124,
      expiresAt: 1_900_000_000,
      sessionConfig: {
        signer: "0x2222222222222222222222222222222222222222",
      },
    };

    expect(() => parseSessionBundleInput(encodePayload(payload))).toThrow("Invalid session bundle accountAddress.");
  });

  it("rejects malformed payload with invalid session signer", () => {
    const payload = {
      accountAddress: "0x1111111111111111111111111111111111111111",
      chainId: 11124,
      expiresAt: 1_900_000_000,
      sessionConfig: {
        signer: "invalid",
      },
    };

    expect(() => parseSessionBundleInput(encodePayload(payload))).toThrow("Invalid session bundle sessionConfig.signer.");
  });

  it("rejects malformed payload when chain id is missing", () => {
    const payload = {
      accountAddress: "0x1111111111111111111111111111111111111111",
      expiresAt: 1_900_000_000,
      sessionConfig: {
        signer: "0x2222222222222222222222222222222222222222",
      },
    };

    expect(() => parseSessionBundleInput(encodePayload(payload))).toThrow("Invalid chainId");
  });

  it("rejects bundle when returned chain id mismatches requested chain", async () => {
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
      const signer = launchUrl.searchParams.get("signer");

      resolvePayload(
        encodePayload({
          accountAddress: "0x1111111111111111111111111111111111111111",
          chainId: 2741,
          expiresAt: 1_900_000_000,
          sessionConfig: {
            signer,
            expiresAt: "1900000000",
            feeLimit: { limitType: 1, limit: "1", period: "0" },
            callPolicies: [],
            transferPolicies: [],
          },
        }),
      );
    });

    try {
      await expect(
        runBootstrapFlow(createLogger(), {
          chainId: 11124,
          storageDir: tmpDir,
        }),
      ).rejects.toThrow("does not match requested chain id");
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("rejects already expired bundle from callback", async () => {
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
      const signer = launchUrl.searchParams.get("signer");
      resolvePayload(
        encodePayload({
          accountAddress: "0x1111111111111111111111111111111111111111",
          chainId: 11124,
          expiresAt: Math.floor(Date.now() / 1000) - 1,
          sessionConfig: {
            signer,
            expiresAt: "1900000000",
            feeLimit: { limitType: 1, limit: "1", period: "0" },
            callPolicies: [],
            transferPolicies: [],
          },
        }),
      );
    });

    try {
      await expect(
        runBootstrapFlow(createLogger(), {
          chainId: 11124,
          storageDir: tmpDir,
        }),
      ).rejects.toThrow("already expired");
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("rejects bundle when sessionConfig.expiresAt does not match bundle expiresAt", async () => {
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
      const signer = launchUrl.searchParams.get("signer");
      resolvePayload(
        encodePayload({
          accountAddress: "0x1111111111111111111111111111111111111111",
          chainId: 11124,
          expiresAt: Math.floor(Date.now() / 1000) + 3600,
          sessionConfig: {
            signer,
            expiresAt: String(Math.floor(Date.now() / 1000) + 7200),
            feeLimit: { limitType: 1, limit: "1", period: "0" },
            callPolicies: [],
            transferPolicies: [],
          },
        }),
      );
    });

    try {
      await expect(
        runBootstrapFlow(createLogger(), {
          chainId: 11124,
          storageDir: tmpDir,
        }),
      ).rejects.toThrow("expiresAt mismatch");
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("restores previous local key/session files when bootstrap fails", async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "agw-mcp-bootstrap-restore-"));
    const originalKey = "0x0123456789012345678901234567890123456789012345678901234567890123\n";
    const originalSession = JSON.stringify(
      {
        accountAddress: "0x1111111111111111111111111111111111111111",
        chainId: 11124,
        expiresAt: 1_900_000_000,
        createdAt: 1_800_000_000,
        updatedAt: 1_800_000_000,
        status: "active",
        sessionConfig: {
          signer: "0x1111111111111111111111111111111111111111",
        },
        sessionSignerRef: {
          kind: "keyfile",
          value: path.join(tmpDir, "session-signer.key"),
        },
      },
      null,
      2,
    );
    fs.mkdirSync(tmpDir, { recursive: true });
    fs.writeFileSync(path.join(tmpDir, "session-signer.key"), originalKey, { mode: 0o600 });
    fs.writeFileSync(path.join(tmpDir, "session.json"), originalSession, { mode: 0o600 });

    let resolvePayload!: (value: string) => void;
    const payloadPromise = new Promise<string>(resolve => {
      resolvePayload = resolve;
    });

    startServerMock.mockResolvedValue({
      callbackUrl: "http://127.0.0.1:4567/callback/abc123",
      waitForPayload: () => payloadPromise,
      close: async () => undefined,
    });

    openMock.mockImplementation(async () => {
      resolvePayload(
        encodePayload({
          accountAddress: "0x1111111111111111111111111111111111111111",
          chainId: 11124,
          expiresAt: 1_900_000_000,
          sessionConfig: {
            signer: "0x3333333333333333333333333333333333333333",
            expiresAt: "1900000000",
          },
        }),
      );
    });

    try {
      await expect(
        runBootstrapFlow(createLogger(), {
          chainId: 11124,
          storageDir: tmpDir,
        }),
      ).rejects.toThrow("does not match locally generated signer");

      expect(fs.readFileSync(path.join(tmpDir, "session-signer.key"), "utf8")).toBe(originalKey);
      expect(fs.readFileSync(path.join(tmpDir, "session.json"), "utf8")).toBe(originalSession);
      expect(fs.existsSync(path.join(tmpDir, ".bootstrap-init.lock"))).toBe(false);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("attempts to revoke previous active session after successful rotation", async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "agw-mcp-bootstrap-revoke-"));
    const previousKey = "0x0123456789012345678901234567890123456789012345678901234567890123";
    fs.writeFileSync(
      path.join(tmpDir, "session-signer.key"),
      `${previousKey}\n`,
      { mode: 0o600 },
    );
    fs.writeFileSync(
      path.join(tmpDir, "session.json"),
      JSON.stringify(
        {
          accountAddress: "0x1111111111111111111111111111111111111111",
          chainId: 11124,
          expiresAt: Math.floor(Date.now() / 1000) + 3600,
          createdAt: 1_800_000_000,
          updatedAt: 1_800_000_000,
          status: "active",
          sessionConfig: {
            signer: "0x1111111111111111111111111111111111111111",
          },
          sessionSignerRef: {
            kind: "keyfile",
            value: path.join(tmpDir, "session-signer.key"),
          },
        },
        null,
        2,
      ),
      { mode: 0o600 },
    );

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
      const signer = launchUrl.searchParams.get("signer");
      const expiresAt = Math.floor(Date.now() / 1000) + 3600;
      resolvePayload(
        encodePayload({
          accountAddress: "0x2222222222222222222222222222222222222222",
          chainId: 11124,
          expiresAt,
          sessionConfig: {
            signer,
            expiresAt: String(expiresAt),
            feeLimit: { limitType: 1, limit: "1", period: "0" },
            callPolicies: [],
            transferPolicies: [],
          },
        }),
      );
    });

    try {
      await runBootstrapFlow(createLogger(), {
        chainId: 11124,
        storageDir: tmpDir,
      });
      expect(revokeSessionOnchainMock).toHaveBeenCalledTimes(1);
      expect(revokeSessionOnchainMock).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionSignerRef: {
            kind: "raw",
            value: previousKey,
          },
        }),
        expect.objectContaining({
          rpcUrl: undefined,
        }),
      );
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});
