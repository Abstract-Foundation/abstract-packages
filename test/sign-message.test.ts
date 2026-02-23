import { recoverMessageAddress } from "viem";
import { abstractTestnet } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { signMessageTool } from "../src/tools/sign-message.js";
import type { AgwSessionData } from "../src/session/types.js";
import type { ToolContext } from "../src/tools/types.js";
import { Logger } from "../src/utils/logger.js";

const SESSION_PRIVATE_KEY = "0x59c6995e998f97a5a0044966f0945388cf0f5ddf3cd34e3c5d6f6e64f5f4a799";

function buildSessionData(overrides: Partial<AgwSessionData> = {}): AgwSessionData {
  const now = Math.floor(Date.now() / 1000);
  const signer = privateKeyToAccount(SESSION_PRIVATE_KEY).address;

  return {
    accountAddress: "0x1111111111111111111111111111111111111111",
    chainId: abstractTestnet.id,
    expiresAt: now + 3600,
    createdAt: now,
    updatedAt: now,
    status: "active",
    sessionConfig: {
      signer,
      expiresAt: String(now + 3600),
      feeLimit: {
        limitType: "lifetime",
        limit: "1000000000000000",
        period: "0",
      },
      maxValuePerUse: "0",
      callPolicies: [],
      transferPolicies: [],
    },
    sessionSignerRef: {
      kind: "raw",
      value: SESSION_PRIVATE_KEY,
    },
    ...overrides,
  };
}

interface SessionClientSpies {
  signMessage: jest.Mock<Promise<`0x${string}`>, [{ message: string }]>;
}

function buildContext(
  session: AgwSessionData,
  status: ToolContext["sessionManager"]["getSessionStatus"],
  sessionClientSpies: SessionClientSpies,
): ToolContext {
  return {
    sessionManager: {
      getSession: () => session,
      getSessionStatus: status,
      createSessionClient: jest.fn(() => sessionClientSpies) as unknown as ToolContext["sessionManager"]["createSessionClient"],
    } as unknown as ToolContext["sessionManager"],
    logger: new Logger("test"),
  };
}

describe("sign_message tool", () => {
  it("returns a valid signature for an active allowed session", async () => {
    const message = "hello from agw-mcp";
    const session = buildSessionData();
    const signerAccount = privateKeyToAccount(SESSION_PRIVATE_KEY);
    const signMessage = jest.fn<Promise<`0x${string}`>, [{ message: string }]>(async ({ message: inputMessage }) =>
      signerAccount.signMessage({ message: inputMessage }),
    );
    const context = buildContext(session, () => "active", { signMessage });

    const result = (await signMessageTool.handler({ message }, context)) as Record<string, unknown>;

    expect(typeof result.signature).toBe("string");
    expect(result.message).toBe(message);
    expect(signMessage).toHaveBeenCalledTimes(1);
    expect(signMessage).toHaveBeenCalledWith({ message });

    const recovered = await recoverMessageAddress({
      message,
      signature: result.signature as `0x${string}`,
    });

    expect(recovered.toLowerCase()).toBe((session.sessionConfig.signer as string).toLowerCase());
    const createSessionClient = context.sessionManager.createSessionClient as unknown as jest.Mock;
    expect(createSessionClient).toHaveBeenCalledWith({
      chain: expect.objectContaining({ id: abstractTestnet.id }),
      rpcUrl: abstractTestnet.rpcUrls.default.http[0],
    });
  });

  it("rejects signing when session policy signer is invalid", async () => {
    const baseSession = buildSessionData();
    const session = buildSessionData({
      sessionConfig: {
        ...baseSession.sessionConfig,
        signer: "not-an-address",
      },
    });

    await expect(
      signMessageTool.handler(
        { message: "blocked" },
        buildContext(session, () => "active", {
          signMessage: jest.fn<Promise<`0x${string}`>, [{ message: string }]>(async () => "0x1234"),
        }),
      ),
    ).rejects.toThrow("message signing rejected: session policy signer is invalid");
  });

  it("rejects signing when tool capability is not enabled in policy metadata", async () => {
    const now = Math.floor(Date.now() / 1000);
    const session = buildSessionData({
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

    await expect(
      signMessageTool.handler(
        { message: "blocked" },
        buildContext(session, () => "active", {
          signMessage: jest.fn<Promise<`0x${string}`>, [{ message: string }]>(async () => "0x1234"),
        }),
      ),
    ).rejects.toThrow('tool "sign_message" is not enabled');
  });
});
