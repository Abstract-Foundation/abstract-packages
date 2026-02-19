import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { sessionKeyValidatorAddress } from "@abstract-foundation/agw-client/constants";
import { SessionKeyValidatorAbi, getSessionHash, type SessionConfig } from "@abstract-foundation/agw-client/sessions";
import { abstractTestnet } from "viem/chains";
import { resolveNetworkConfig } from "../src/config/network.js";
import { SessionManager } from "../src/session/manager.js";
import type { AgwSessionData } from "../src/session/types.js";
import { getTool } from "../src/tools/index.js";
import { revokeSessionTool } from "../src/tools/revoke-session.js";
import { sendTransactionTool } from "../src/tools/send-transaction.js";
import type { ToolContext } from "../src/tools/types.js";
import { Logger } from "../src/utils/logger.js";

function buildSessionData(overrides: Partial<AgwSessionData> = {}): AgwSessionData {
  const now = Math.floor(Date.now() / 1000);
  const sessionConfig = {
    signer: "0x2222222222222222222222222222222222222222",
    expiresAt: String(now + 3600),
    feeLimit: {
      limitType: 1,
      limit: "1000000000000000",
      period: "0",
    },
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
      kind: "keyfile",
      value: "/tmp/session.key",
    },
    ...overrides,
  };
}

describe("revoke_session tool", () => {
  it("is registered in tool index", () => {
    expect(getTool("revoke_session")).toBeDefined();
  });

  it("revokes on-chain and invalidates local session immediately", async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "agw-mcp-revoke-"));

    try {
      const logger = new Logger("test");
      const sessionManager = new SessionManager(logger, { storageDir: tmpDir, chainId: abstractTestnet.id });
      const session = buildSessionData();
      sessionManager.setSession(session);

      const transactionHash = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" as const;
      const writeContract = jest.fn<Promise<`0x${string}`>, [Record<string, unknown>]>(async () => transactionHash);
      const createSessionClientSpy = jest
        .spyOn(sessionManager, "createSessionClient")
        .mockReturnValue({ writeContract } as unknown as ReturnType<SessionManager["createSessionClient"]>);

      const context = {
        sessionManager,
        logger,
      } as ToolContext;

      const expectedSessionHash = getSessionHash(session.sessionConfig as unknown as SessionConfig);
      const networkConfig = resolveNetworkConfig({ chainId: session.chainId });
      const explorerBase = networkConfig.chain.blockExplorers?.default?.url ?? null;

      const result = (await revokeSessionTool.handler({}, context)) as Record<string, unknown>;

      expect(writeContract).toHaveBeenCalledTimes(1);
      expect(writeContract).toHaveBeenCalledWith({
        account: session.accountAddress,
        chain: undefined,
        address: sessionKeyValidatorAddress,
        abi: SessionKeyValidatorAbi,
        functionName: "revokeKeys",
        args: [[expectedSessionHash]],
      });

      expect(result).toEqual({
        revoked: true,
        transactionHash,
        sessionHash: expectedSessionHash,
        accountAddress: session.accountAddress,
        chainId: session.chainId,
        explorer: {
          chain: explorerBase,
          transaction: `${explorerBase}/tx/${transactionHash}`,
        },
        localStatus: "revoked",
      });

      expect(sessionManager.getSessionStatus()).toBe("revoked");
      expect(sessionManager.getSession()?.status).toBe("revoked");

      const persisted = JSON.parse(fs.readFileSync(path.join(tmpDir, "session.json"), "utf8")) as Record<string, unknown>;
      expect(persisted.status).toBe("revoked");

      await expect(
        sendTransactionTool.handler(
          {
            to: "0x3333333333333333333333333333333333333333",
            data: "0x",
            execute: true,
          },
          context,
        ),
      ).rejects.toThrow("session must be active (current status: revoked)");

      expect(createSessionClientSpy).toHaveBeenCalledTimes(1);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});
