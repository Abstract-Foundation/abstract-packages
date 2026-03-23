import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { generateKeyPairSync, sign as signPayload } from "node:crypto";
import type { PrivySignerInitBundlePayload } from "../packages/agw-core/src/auth/callback.js";
import { computePublicKeyFingerprint } from "../packages/agw-core/src/privy/auth.js";
import type { Logger } from "../packages/agw-core/src/utils/logger.js";
import { parseInitSignerBundleInput } from "../packages/agw-core/src/auth/callback.js";
import { materializeSessionFromBundle } from "../packages/agw-core/src/auth/provision.js";

jest.mock("open", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("../packages/agw-core/src/auth/handoff.js", () => ({
  startCallbackServer: jest.fn(),
}));

import open from "open";
import { runBootstrapFlow } from "../packages/agw-core/src/auth/bootstrap.js";
import { startCallbackServer } from "../packages/agw-core/src/auth/handoff.js";

const openMock = open as unknown as jest.Mock;
const startServerMock = startCallbackServer as unknown as jest.Mock;
const ORIGINAL_APP_URL = process.env.AGW_APP_URL;
const ORIGINAL_CALLBACK_SIGNING_PUBLIC_KEY = process.env.AGW_CALLBACK_SIGNING_PUBLIC_KEY;
const ORIGINAL_CALLBACK_SIGNING_ISSUER = process.env.AGW_CALLBACK_SIGNING_ISSUER;
const CALLBACK_ISSUER = "test-agw-mcp";
const { privateKey: callbackSigningPrivateKey, publicKey: callbackSigningPublicKey } = generateKeyPairSync("ed25519");

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

function signCallbackToken(payload: object): string {
  const header = {
    alg: "EdDSA",
    typ: "AGW-MCP-CALLBACK",
  };
  const encodedHeader = Buffer.from(JSON.stringify(header), "utf8").toString("base64url");
  const encodedPayload = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = signPayload(null, Buffer.from(`${encodedHeader}.${encodedPayload}`, "utf8"), callbackSigningPrivateKey);
  return `${encodedHeader}.${encodedPayload}.${signature.toString("base64url")}`;
}

function buildPrivyPayload(overrides: Partial<PrivySignerInitBundlePayload> = {}): PrivySignerInitBundlePayload {
  const now = Math.floor(Date.now() / 1000);
  return {
    version: 2,
    action: "init",
    state: "test-state",
    iss: CALLBACK_ISSUER,
    iat: now,
    exp: now + 300,
    accountAddress: "0x1111111111111111111111111111111111111111",
    underlyingSignerAddress: "0x2222222222222222222222222222222222222222",
    chainId: 11124,
    walletId: "wallet_test123",
    signerType: "device_authorization_key",
    signerId: "quorum_test789",
    policyIds: ["policy_test456"],
    signerFingerprint: "aa11bb22cc33:dd44ee55ff66",
    signerLabel: "AGW MCP aa11bb22cc33:dd44ee55ff66",
    signerCreatedAt: 1_800_000_000,
    capabilitySummary: {
      chainId: 11124,
      expiresAt: 1_800_003_600,
      feeLimit: "2000000000000000",
      maxValuePerUse: "10000000000000000",
      enabledTools: ["get_session_status", "revoke_session"],
      notes: ["Transactions and typed-data signatures are enabled."],
    },
    policyMeta: {
      version: 1,
      mode: "guided",
      presetId: "full_app_control",
      presetLabel: "AGW MCP Default",
      enabledTools: ["get_session_status", "revoke_session"],
      selectedAppIds: [],
      selectedContractAddresses: [],
      unverifiedAppIds: [],
      warnings: [],
      generatedAt: 1_800_000_000,
    },
    ...overrides,
  } as PrivySignerInitBundlePayload;
}

describe("bootstrap callback/signer bundle flow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.AGW_APP_URL = "https://onboarding.example";
    process.env.AGW_CALLBACK_SIGNING_PUBLIC_KEY = callbackSigningPublicKey
      .export({ format: "der", type: "spki" })
      .toString("base64");
    process.env.AGW_CALLBACK_SIGNING_ISSUER = CALLBACK_ISSUER;
  });

  afterAll(() => {
    if (ORIGINAL_APP_URL === undefined) {
      delete process.env.AGW_APP_URL;
    } else {
      process.env.AGW_APP_URL = ORIGINAL_APP_URL;
    }

    if (ORIGINAL_CALLBACK_SIGNING_PUBLIC_KEY === undefined) {
      delete process.env.AGW_CALLBACK_SIGNING_PUBLIC_KEY;
    } else {
      process.env.AGW_CALLBACK_SIGNING_PUBLIC_KEY = ORIGINAL_CALLBACK_SIGNING_PUBLIC_KEY;
    }

    if (ORIGINAL_CALLBACK_SIGNING_ISSUER === undefined) {
      delete process.env.AGW_CALLBACK_SIGNING_ISSUER;
    } else {
      process.env.AGW_CALLBACK_SIGNING_ISSUER = ORIGINAL_CALLBACK_SIGNING_ISSUER;
    }
  });

  it("parses callback URL payloads into a validated signer bundle", () => {
    // #given
    const policyMeta: PrivySignerInitBundlePayload["policyMeta"] = {
      version: 1,
      mode: "guided",
      presetId: "payments",
      presetLabel: "Payments",
      enabledTools: ["get_session_status", "revoke_session"],
      selectedAppIds: [],
      selectedContractAddresses: [],
      unverifiedAppIds: [],
      warnings: [],
      generatedAt: 1_800_000_000,
    };
    const payload = buildPrivyPayload({ policyMeta });

    // #when
    const encoded = encodePayload(payload);
    const parsed = parseInitSignerBundleInput(`http://127.0.0.1:8787/callback?session=${encoded}`);

    // #then
    expect(parsed.accountAddress).toBe("0x1111111111111111111111111111111111111111");
    expect(parsed.chainId).toBe(11124);
    expect(parsed.walletId).toBe("wallet_test123");
    expect(parsed.signerId).toBe("quorum_test789");
    expect(parsed.policyMeta).toEqual(policyMeta);
  });

  it("materializes session bundle with auth keyfile path", () => {
    // #given
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "agw-mcp-bootstrap-"));
    const now = 1_800_000_000;

    try {
      const authKeyfilePath = path.join(tmpDir, "privy-auth.key");
      fs.writeFileSync(authKeyfilePath, "wallet-auth:dGVzdC1rZXktZGF0YQ==\n", { mode: 0o600 });

      // #when
      const session = materializeSessionFromBundle(
        buildPrivyPayload({
          policyMeta: {
            version: 1,
            mode: "guided",
            presetId: "payments",
            presetLabel: "Payments",
            enabledTools: ["get_session_status", "revoke_session"],
            selectedAppIds: [],
            selectedContractAddresses: [],
            unverifiedAppIds: [],
            warnings: [],
            generatedAt: now,
          },
        }),
        {
          chainId: 11124,
          authKeyfilePath,
          nowUnixSeconds: now,
        },
      );

      // #then
      expect(session.privyAuthKeyRef).toBeDefined();
      expect(session.privyAuthKeyRef!.kind).toBe("keyfile");
      expect(session.privyAuthKeyRef!.value).toBe(authKeyfilePath);
      expect(session.privyWalletId).toBe("wallet_test123");
      expect(session.privySignerBinding?.id).toBe("quorum_test789");
      expect(session.policyMeta?.presetId).toBe("payments");
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("opens hosted onboarding URL with callback_url + chain_id and then saves session", async () => {
    // #given
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
      const authPublicKey = launchUrl.searchParams.get("auth_pubkey")!;
      const signerFingerprint = computePublicKeyFingerprint(authPublicKey);
      const signerLabel = `AGW MCP ${signerFingerprint}`;
      expect(`${launchUrl.origin}${launchUrl.pathname}`).toBe("https://onboarding.example/session/new");
      const callbackUrlParam = launchUrl.searchParams.get("callback_url");
      expect(callbackUrlParam).toBeTruthy();
      const callbackUrl = new URL(callbackUrlParam!);
      expect(`${callbackUrl.origin}${callbackUrl.pathname}`).toBe("http://127.0.0.1:4567/callback/abc123");
      expect(callbackUrl.searchParams.get("state")).toMatch(/^[0-9a-f]{32}$/);
      const callbackState = callbackUrl.searchParams.get("state")!;
      expect(launchUrl.searchParams.get("chain_id")).toBe("11124");
      expect(launchUrl.searchParams.get("auth_pubkey")).toMatch(/^[A-Za-z0-9+/=]+$/);
      expect(launchUrl.searchParams.get("action")).toBe("init");

      const keyfilePath = path.join(tmpDir, "privy-auth.key");
      expect(fs.existsSync(keyfilePath)).toBe(false);

      resolvePayload(
        signCallbackToken(
          buildPrivyPayload({
            state: callbackState,
            signerFingerprint,
            signerLabel,
          }),
        ),
      );
    });

    // #when
    try {
      const session = await runBootstrapFlow(createLogger(), {
        chainId: 11124,
        homeDir: tmpDir,
      });

      // #then
      expect(startServerMock).toHaveBeenCalledWith(
        expect.objectContaining({
          expectedState: expect.stringMatching(/^[0-9a-f]{32}$/),
        }),
      );
      expect(session.privyAuthKeyRef).toBeDefined();
      expect(session.privyAuthKeyRef!.kind).toBe("keyfile");
      expect(session.privyAuthKeyRef!.value).toBe(path.join(tmpDir, "privy-auth.key"));
      expect(session.chainId).toBe(11124);
      expect(session.privyWalletId).toBe("wallet_test123");
      expect(session.privySignerBinding?.id).toBe("quorum_test789");
      expect(fs.existsSync(path.join(tmpDir, ".bootstrap-init.lock"))).toBe(false);
      expect(fs.existsSync(path.join(tmpDir, "privy-auth.key"))).toBe(true);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("defaults to mcp.abs.xyz when onboarding app URL is not configured", async () => {
    // #given
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "agw-mcp-bootstrap-flow-"));
    const previous = process.env.AGW_APP_URL;
    delete process.env.AGW_APP_URL;

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
        const authPublicKey = launchUrl.searchParams.get("auth_pubkey")!;
        const callbackState = new URL(launchUrl.searchParams.get("callback_url")!).searchParams.get("state")!;
        const signerFingerprint = computePublicKeyFingerprint(authPublicKey);
        const signerLabel = `AGW MCP ${signerFingerprint}`;
        expect(authPublicKey).toMatch(/^[A-Za-z0-9+/=]+$/);

        resolvePayload(
          signCallbackToken(
            buildPrivyPayload({
              state: callbackState,
              signerFingerprint,
              signerLabel,
            }),
          ),
        );
      });

      // #when
      const session = await runBootstrapFlow(createLogger(), {
        chainId: 11124,
        homeDir: tmpDir,
      });

      // #then
      expect(session.chainId).toBe(11124);
    } finally {
      if (previous === undefined) {
        delete process.env.AGW_APP_URL;
      } else {
        process.env.AGW_APP_URL = previous;
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
          homeDir: tmpDir,
          appUrl: "http://mcp.abs.xyz",
        }),
      ).rejects.toThrow("Refusing insecure app URL over http for non-loopback host");
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("fails when another bootstrap lock already exists", async () => {
    // #given
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "agw-mcp-bootstrap-lock-"));
    fs.mkdirSync(tmpDir, { recursive: true });
    fs.writeFileSync(path.join(tmpDir, ".bootstrap-init.lock"), JSON.stringify({ pid: process.pid }), { mode: 0o600 });

    // #then
    try {
      await expect(
        runBootstrapFlow(createLogger(), {
          chainId: 11124,
          homeDir: tmpDir,
        }),
      ).rejects.toThrow("already in progress");
      expect(startServerMock).not.toHaveBeenCalled();
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("recovers stale bootstrap lock and continues", async () => {
    // #given
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
      const authPublicKey = launchUrl.searchParams.get("auth_pubkey")!;
      const callbackState = new URL(launchUrl.searchParams.get("callback_url")!).searchParams.get("state")!;
      const signerFingerprint = computePublicKeyFingerprint(authPublicKey);
      const signerLabel = `AGW MCP ${signerFingerprint}`;
      resolvePayload(
        signCallbackToken(
          buildPrivyPayload({
            state: callbackState,
            signerFingerprint,
            signerLabel,
          }),
        ),
      );
    });

    // #then
    try {
      await expect(
        runBootstrapFlow(createLogger(), {
          chainId: 11124,
          homeDir: tmpDir,
        }),
      ).resolves.toBeDefined();
      expect(fs.existsSync(lockPath)).toBe(false);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("rejects malformed payload with invalid account address", () => {
    const payload = buildPrivyPayload({ accountAddress: "not-an-address" });

    expect(() => parseInitSignerBundleInput(encodePayload(payload))).toThrow("Invalid signer bundle accountAddress.");
  });

  it("rejects malformed payload with missing account address", () => {
    const payload = buildPrivyPayload({ accountAddress: "" });

    expect(() => parseInitSignerBundleInput(encodePayload(payload))).toThrow("Invalid signer bundle accountAddress.");
  });

  it("rejects malformed payload when chain id is missing", () => {
    const payload = buildPrivyPayload();
    delete (payload as { chainId?: number }).chainId;

    expect(() => parseInitSignerBundleInput(encodePayload(payload))).toThrow("Invalid chainId");
  });

  it("rejects legacy payloads without versioned signer metadata", () => {
    expect(() =>
      parseInitSignerBundleInput(
        encodePayload({
          accountAddress: "0x1111111111111111111111111111111111111111",
          chainId: 11124,
        }),
      ),
    ).toThrow("Invalid state");
  });

  it("rejects bundle when returned chain id mismatches requested chain", async () => {
    // #given
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
      const callbackState = new URL(launchUrl.searchParams.get("callback_url")!).searchParams.get("state")!;
      resolvePayload(signCallbackToken(buildPrivyPayload({ state: callbackState, chainId: 2741 })));
    });

    // #then
    try {
      await expect(
        runBootstrapFlow(createLogger(), {
          chainId: 11124,
          homeDir: tmpDir,
        }),
      ).rejects.toThrow("does not match requested chain id");
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("restores previous local key/session files when bootstrap fails", async () => {
    // #given
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "agw-mcp-bootstrap-restore-"));
    const originalKey = "wallet-auth:dGVzdC1vcmlnaW5hbC1rZXk=\n";
    const originalSession = JSON.stringify(
      {
        accountAddress: "0x1111111111111111111111111111111111111111",
        chainId: 11124,
        createdAt: 1_800_000_000,
        updatedAt: 1_800_000_000,
        status: "active",
        privyWalletId: "wallet_previous",
        privyAuthKeyRef: {
          kind: "keyfile",
          value: path.join(tmpDir, "privy-auth.key"),
        },
      },
      null,
      2,
    );
    fs.mkdirSync(tmpDir, { recursive: true });
    fs.writeFileSync(path.join(tmpDir, "privy-auth.key"), originalKey, { mode: 0o600 });
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

    openMock.mockImplementation(async (url: string) => {
      const launchUrl = new URL(url);
      const callbackState = new URL(launchUrl.searchParams.get("callback_url")!).searchParams.get("state")!;
      resolvePayload(signCallbackToken(buildPrivyPayload({ state: callbackState, chainId: 2741 })));
    });

    // #then
    try {
      await expect(
        runBootstrapFlow(createLogger(), {
          chainId: 11124,
          homeDir: tmpDir,
        }),
      ).rejects.toThrow("does not match requested chain id");

      expect(fs.readFileSync(path.join(tmpDir, "privy-auth.key"), "utf8")).toBe(originalKey);
      expect(fs.readFileSync(path.join(tmpDir, "session.json"), "utf8")).toBe(originalSession);
      expect(fs.existsSync(path.join(tmpDir, ".bootstrap-init.lock"))).toBe(false);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});
