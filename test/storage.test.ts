import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { SessionStorage } from "../src/session/storage.js";
import type { AgwSessionData } from "../src/session/types.js";

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

  it("saves and loads a valid session without persisting raw signer material", () => {
    const now = Math.floor(Date.now() / 1000);
    const signerSecret = "0x59c6995e998f97a5a0044966f0945388cf0f5ddf3cd34e3c5d6f6e64f5f4a799";
    const session: AgwSessionData = {
      accountAddress: "0x123",
      chainId: 11124,
      expiresAt: now + 3600,
      createdAt: now,
      updatedAt: now,
      status: "active",
      sessionConfig: { test: true },
      sessionSignerRef: { kind: "raw", value: signerSecret },
    };

    storage.save(session);
    const loaded = storage.load();
    const persisted = fs.readFileSync(storage.path, "utf8");

    expect(loaded?.accountAddress).toBe("0x123");
    expect(loaded?.status).toBe("active");
    expect(loaded?.sessionSignerRef.kind).toBe("keyfile");
    expect(loaded?.sessionSignerRef.value).toBe(path.join(tmpDir, "session-signer.key"));
    expect(fs.existsSync(path.join(tmpDir, "session-signer.key"))).toBe(true);
    expect(persisted).not.toContain(signerSecret);
    expect(persisted).toContain(`"value": "${path.join(tmpDir, "session-signer.key")}"`);
  });

  it("persists keyfile signer references so the stored session remains reusable", () => {
    const now = Math.floor(Date.now() / 1000);
    const keyfilePath = path.join(tmpDir, "session-key.txt");
    fs.writeFileSync(keyfilePath, "0x0123456789012345678901234567890123456789012345678901234567890123\n", { mode: 0o600 });
    const session: AgwSessionData = {
      accountAddress: "0xabc",
      chainId: 11124,
      expiresAt: now + 3600,
      createdAt: now,
      updatedAt: now,
      status: "active",
      sessionConfig: { test: true },
      sessionSignerRef: { kind: "keyfile", value: keyfilePath },
    };

    storage.save(session);

    const loaded = storage.load();
    const persisted = fs.readFileSync(storage.path, "utf8");

    expect(loaded?.sessionSignerRef.kind).toBe("keyfile");
    expect(loaded?.sessionSignerRef.value).toBe(keyfilePath);
    expect(persisted).toContain(`"value": "${keyfilePath}"`);
  });

  it("guards persisted artifacts against signer secret leaks via grep-style check", () => {
    const now = Math.floor(Date.now() / 1000);
    const signerSecret = "AGW_SIGNER_GREP_SENTINEL";
    const session: AgwSessionData = {
      accountAddress: "0xabc",
      chainId: 11124,
      expiresAt: now + 3600,
      createdAt: now,
      updatedAt: now,
      status: "active",
      sessionConfig: { test: true },
      sessionSignerRef: { kind: "raw", value: signerSecret },
    };

    storage.save(session);

    const persisted = fs.readFileSync(storage.path, "utf8");
    const leakMatches = persisted.match(/AGW_SIGNER_GREP_SENTINEL/g) ?? [];
    expect(leakMatches).toHaveLength(0);
  });

  it("loads redacted raw signer refs when local signer keyfile exists", () => {
    const now = Math.floor(Date.now() / 1000);
    const keyfilePath = path.join(tmpDir, "session-signer.key");
    const privateKey = "0x0123456789012345678901234567890123456789012345678901234567890123";
    fs.writeFileSync(keyfilePath, `${privateKey}\n`, { mode: 0o600 });

    const persisted = {
      accountAddress: "0x123",
      chainId: 11124,
      expiresAt: now + 3600,
      createdAt: now,
      updatedAt: now,
      status: "active",
      sessionConfig: { test: true },
      sessionSignerRef: { kind: "raw", value: "[REDACTED]" },
    } satisfies AgwSessionData;
    fs.writeFileSync(storage.path, JSON.stringify(persisted, null, 2), "utf8");

    const loaded = storage.load();
    expect(loaded?.sessionSignerRef).toEqual({
      kind: "keyfile",
      value: keyfilePath,
    });
  });
});
