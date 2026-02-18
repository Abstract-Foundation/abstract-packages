import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { LimitUnlimited, type SessionConfig } from "@abstract-foundation/agw-client/sessions";
import { privateKeyToAccount } from "viem/accounts";
import { abstractTestnet } from "viem/chains";
import { createAgwSessionClient } from "../src/agw/client.js";
import { createSessionClientFromSessionData } from "../src/session/client.js";
import type { AgwSessionData } from "../src/session/types.js";

function buildSessionData(overrides: Partial<AgwSessionData> = {}): AgwSessionData {
  const privateKey = "0x0123456789012345678901234567890123456789012345678901234567890123";
  const signer = privateKeyToAccount(privateKey);
  const now = Math.floor(Date.now() / 1000);

  const sessionConfig: SessionConfig = {
    signer: signer.address,
    expiresAt: BigInt(now + 3600),
    feeLimit: LimitUnlimited,
    callPolicies: [],
    transferPolicies: [],
  };

  return {
    accountAddress: "0x1111111111111111111111111111111111111111",
    chainId: abstractTestnet.id,
    expiresAt: now + 3600,
    createdAt: now,
    updatedAt: now,
    status: "active",
    sessionConfig: sessionConfig as unknown as Record<string, unknown>,
    sessionSignerRef: {
      kind: "raw",
      value: privateKey,
    },
    ...overrides,
  };
}

describe("AGW session client factory", () => {
  it("builds a session client from session data and chain config", () => {
    const session = buildSessionData();

    const client = createAgwSessionClient({
      accountAddress: session.accountAddress,
      sessionConfig: session.sessionConfig,
      sessionSignerRef: session.sessionSignerRef,
      chainConfig: {
        chain: abstractTestnet,
      },
    });

    expect(client.account.address.toLowerCase()).toBe(session.accountAddress.toLowerCase());
    expect(client.chain.id).toBe(abstractTestnet.id);
    expect(typeof client.sendTransaction).toBe("function");
  });

  it("builds from persisted session data with keyfile signer reference", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "agw-mcp-signer-"));
    const keyfilePath = path.join(tmpDir, "session-key.txt");
    const privateKey = "0xabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcd";
    const signer = privateKeyToAccount(privateKey);

    fs.writeFileSync(keyfilePath, `${privateKey}\n`, { mode: 0o600 });

    const session = buildSessionData({
      sessionConfig: {
        signer: signer.address,
        expiresAt: BigInt(Math.floor(Date.now() / 1000) + 3600),
        feeLimit: LimitUnlimited,
        callPolicies: [],
        transferPolicies: [],
      },
      sessionSignerRef: {
        kind: "keyfile",
        value: keyfilePath,
      },
    });

    const client = createSessionClientFromSessionData({
      session,
      chainConfig: {
        chain: abstractTestnet,
      },
    });

    expect(client.account.address.toLowerCase()).toBe(session.accountAddress.toLowerCase());
    expect(client.chain.id).toBe(abstractTestnet.id);

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("rejects redacted signer references", () => {
    const session = buildSessionData({
      sessionSignerRef: {
        kind: "raw",
        value: "[REDACTED]",
      },
    });

    expect(() =>
      createSessionClientFromSessionData({
        session,
        chainConfig: {
          chain: abstractTestnet,
        },
      }),
    ).toThrow("Session signer reference is redacted");
  });
});
