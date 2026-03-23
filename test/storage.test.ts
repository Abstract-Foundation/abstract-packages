import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { generateP256KeyPair, writeAuthKeyfile } from "../packages/agw-core/src/privy/auth.js";
import { SessionStorage } from "../packages/agw-core/src/session/storage.js";
import type { AgwSessionData } from "../packages/agw-core/src/session/types.js";

function buildValidSession(tmpDir: string, overrides: Partial<AgwSessionData> = {}): AgwSessionData {
  const now = Math.floor(Date.now() / 1000);
  return {
    accountAddress: "0x1111111111111111111111111111111111111111",
    chainId: 11124,
    createdAt: now,
    updatedAt: now,
    status: "active",
    privyWalletId: "wallet_test123",
    privySignerBinding: {
      type: "device_authorization_key",
      canonicalType: "key_quorum",
      id: "quorum_test789",
      policyIds: ["policy_test456"],
      fingerprint: "aa11bb22cc33:dd44ee55ff66",
      label: "AGW MCP aa11bb22cc33:dd44ee55ff66",
      createdAt: now,
    },
    privyPolicyIds: ["policy_test456"],
    privySignerId: "quorum_test789",
    privySignerType: "device_authorization_key",
    privySignerFingerprint: "aa11bb22cc33:dd44ee55ff66",
    privySignerLabel: "AGW MCP aa11bb22cc33:dd44ee55ff66",
    privySignerCreatedAt: now,
    privyPolicyId: "policy_test456",
    privyQuorumId: "quorum_test789",
    privyAuthKeyRef: {
      kind: "keyfile",
      value: path.join(tmpDir, "privy-auth.key"),
    },
    ...overrides,
  };
}

describe("SessionStorage", () => {
  let tmpDir: string;
  let storage: SessionStorage;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "agw-mcp-test-"));
    storage = new SessionStorage(tmpDir);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("saves and loads a valid session with privy auth key reference", () => {
    // #given
    const keyPair = generateP256KeyPair();
    writeAuthKeyfile(keyPair.privateKeyDer, tmpDir);
    const session = buildValidSession(tmpDir);

    // #when
    storage.save(session);
    const loaded = storage.load();

    // #then
    expect(loaded).not.toBeNull();
    expect(loaded?.accountAddress).toBe("0x1111111111111111111111111111111111111111");
    expect(loaded?.status).toBe("active");
    expect(loaded?.privyWalletId).toBe("wallet_test123");
    expect(loaded?.privySignerBinding?.id).toBe("quorum_test789");
    expect(loaded?.privySignerBinding?.policyIds).toEqual(["policy_test456"]);
    expect(loaded?.privyAuthKeyRef).toBeDefined();
    expect(loaded!.privyAuthKeyRef!.kind).toBe("keyfile");
    expect(loaded!.privyAuthKeyRef!.value).toBe(path.join(tmpDir, "privy-auth.key"));
  });

  it("returns null when auth keyfile is missing for active session", () => {
    // #given
    const session = buildValidSession(tmpDir);
    storage.save(session);

    // #then — no keyfile on disk, load should return null
    expect(storage.load()).toBeNull();
  });

  it("loads revoked sessions even when auth keyfile is missing", () => {
    // #given
    const session = buildValidSession(tmpDir, { status: "revoked" });
    storage.save(session);

    // #when
    const loaded = storage.load();

    // #then
    expect(loaded).not.toBeNull();
    expect(loaded?.status).toBe("revoked");
  });

  it("loads legacy sessions without privy signer fields", () => {
    // #given
    const now = Math.floor(Date.now() / 1000);
    const incomplete = {
      accountAddress: "0x1111111111111111111111111111111111111111",
      chainId: 11124,
      createdAt: now,
      updatedAt: now,
      status: "active",
    };
    fs.writeFileSync(storage.path, JSON.stringify(incomplete, null, 2), "utf8");

    // #then
    const loaded = storage.load();
    expect(loaded).not.toBeNull();
    expect(loaded?.accountAddress).toBe(incomplete.accountAddress);
    expect(loaded?.status).toBe("active");
    expect(loaded?.privyWalletId).toBeUndefined();
    expect(loaded?.privyAuthKeyRef).toBeUndefined();
    expect(loaded?.privySignerBinding).toBeUndefined();
  });

  it("deletes both session file and auth keyfile", () => {
    // #given
    const keyPair = generateP256KeyPair();
    writeAuthKeyfile(keyPair.privateKeyDer, tmpDir);
    const session = buildValidSession(tmpDir);
    storage.save(session);
    expect(fs.existsSync(storage.path)).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, "privy-auth.key"))).toBe(true);

    // #when
    storage.delete();

    // #then
    expect(fs.existsSync(storage.path)).toBe(false);
    expect(fs.existsSync(path.join(tmpDir, "privy-auth.key"))).toBe(false);
  });

  it("preserves policyMeta through save/load roundtrip", () => {
    // #given
    const keyPair = generateP256KeyPair();
    writeAuthKeyfile(keyPair.privateKeyDer, tmpDir);
    const now = Math.floor(Date.now() / 1000);
    const session = buildValidSession(tmpDir, {
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
    });

    // #when
    storage.save(session);
    const loaded = storage.load();

    // #then
    expect(loaded?.policyMeta?.presetId).toBe("payments");
  });

  it("migrates default legacy storage from .agw-mcp into .agw", () => {
    const homeDir = fs.mkdtempSync(path.join(os.tmpdir(), "agw-home-"));
    const legacyDir = path.join(homeDir, ".agw-mcp");
    const currentDir = path.join(homeDir, ".agw");
    fs.mkdirSync(legacyDir, { recursive: true });

    const homedirSpy = jest.spyOn(os, "homedir").mockReturnValue(homeDir);
    try {
      const keyPair = generateP256KeyPair();
      writeAuthKeyfile(keyPair.privateKeyDer, legacyDir);

      const legacyStorage = new SessionStorage(legacyDir);
      const session = buildValidSession(legacyDir);
      legacyStorage.save(session);

      const defaultStorage = new SessionStorage();
      const loaded = defaultStorage.load();

      expect(loaded).not.toBeNull();
      expect(defaultStorage.storageDir).toBe(currentDir);
      expect(fs.existsSync(path.join(currentDir, "session.json"))).toBe(true);
      expect(fs.existsSync(path.join(currentDir, "privy-auth.key"))).toBe(true);
      expect(loaded?.privyAuthKeyRef?.value).toBe(path.join(currentDir, "privy-auth.key"));
    } finally {
      homedirSpy.mockRestore();
      fs.rmSync(homeDir, { recursive: true, force: true });
    }
  });
});
