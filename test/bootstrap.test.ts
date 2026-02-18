import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { parseSessionBundleInput } from "../src/auth/callback.js";
import { materializeSessionFromBundle } from "../src/auth/provision.js";

const SAMPLE_PRIVATE_KEY = "0x0123456789012345678901234567890123456789012345678901234567890123";

describe("bootstrap callback/session bundle flow", () => {
  it("parses callback URL payloads into a validated session bundle", () => {
    const payload = {
      accountAddress: "0x1111111111111111111111111111111111111111",
      chainId: 11124,
      expiresAt: 1_900_000_000,
      sessionConfig: {
        signer: "0x2222222222222222222222222222222222222222",
        expiresAt: "1900000000",
        feeLimit: { limitType: "unlimited" },
        callPolicies: [],
        transferPolicies: [],
      },
      sessionSignerPrivateKey: SAMPLE_PRIVATE_KEY,
    };

    const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
    const parsed = parseSessionBundleInput(`http://127.0.0.1:8787/callback?session=${encoded}`);

    expect(parsed.accountAddress).toBe(payload.accountAddress);
    expect(parsed.chainId).toBe(11124);
    expect(parsed.expiresAt).toBe(1_900_000_000);
    expect(parsed.sessionSignerRef).toEqual({
      kind: "raw",
      value: SAMPLE_PRIVATE_KEY,
    });
  });

  it("rejects callback payloads that do not include signer material", () => {
    const payload = {
      accountAddress: "0x1111111111111111111111111111111111111111",
      chainId: 11124,
      expiresAt: 1_900_000_000,
      sessionConfig: {
        signer: "0x2222222222222222222222222222222222222222",
        expiresAt: "1900000000",
        feeLimit: { limitType: "unlimited" },
        callPolicies: [],
        transferPolicies: [],
      },
    };

    expect(() => parseSessionBundleInput(JSON.stringify(payload))).toThrow("must include session signer material");
  });

  it("materializes raw signer payloads into keyfile-backed persisted sessions", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "agw-mcp-bootstrap-"));
    const now = 1_800_000_000;

    try {
      const session = materializeSessionFromBundle(
        {
          accountAddress: "0x1111111111111111111111111111111111111111",
          chainId: 11124,
          expiresAt: now + 3600,
          sessionConfig: {
            signer: "0x2222222222222222222222222222222222222222",
            expiresAt: String(now + 3600),
            feeLimit: { limitType: "unlimited" },
            callPolicies: [],
            transferPolicies: [],
          },
          sessionSignerRef: {
            kind: "raw",
            value: SAMPLE_PRIVATE_KEY,
          },
        },
        {
          chainId: 11124,
          storageDir: tmpDir,
          nowUnixSeconds: now,
        },
      );

      expect(session.sessionSignerRef.kind).toBe("keyfile");
      expect(fs.existsSync(session.sessionSignerRef.value)).toBe(true);
      expect(fs.readFileSync(session.sessionSignerRef.value, "utf8").trim()).toBe(SAMPLE_PRIVATE_KEY);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});
