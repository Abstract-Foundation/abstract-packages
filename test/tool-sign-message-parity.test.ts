import { recoverMessageAddress } from "viem";
import { abstractTestnet } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { signMessageTool } from "../src/tools/sign-message.js";
import type { AgwSessionData } from "../src/session/types.js";
import type { ToolContext } from "../src/tools/types.js";
import { Logger } from "../src/utils/logger.js";

const PRIVATE_KEY = "0x59c6995e998f97a5a0044966f0945388cf0f5ddf3cd34e3c5d6f6e64f5f4a799";

function buildContext(signMessage: jest.Mock<Promise<`0x${string}`>, [{ message: string }]>): ToolContext {
  const signer = privateKeyToAccount(PRIVATE_KEY).address;
  const now = Math.floor(Date.now() / 1000);
  const session: AgwSessionData = {
    accountAddress: "0x1111111111111111111111111111111111111111",
    chainId: abstractTestnet.id,
    expiresAt: now + 3600,
    createdAt: now,
    updatedAt: now,
    status: "active",
    sessionConfig: {
      signer,
      expiresAt: String(now + 3600),
      feeLimit: { limitType: "lifetime", limit: "1", period: "0" },
      maxValuePerUse: "0",
      callPolicies: [],
      transferPolicies: [],
    },
    sessionSignerRef: {
      kind: "raw",
      value: PRIVATE_KEY,
    },
  };

  return {
    sessionManager: {
      getSession: () => session,
      getSessionStatus: () => "active",
      createSessionClient: jest.fn(() => ({ signMessage })) as unknown as ToolContext["sessionManager"]["createSessionClient"],
    } as unknown as ToolContext["sessionManager"],
    logger: new Logger("test"),
  };
}

describe("sign_message action parity", () => {
  it("produces signatures compatible with AGW signMessage semantics", async () => {
    const message = "agw parity";
    const signerAccount = privateKeyToAccount(PRIVATE_KEY);
    const signMessage = jest.fn<Promise<`0x${string}`>, [{ message: string }]>(async ({ message: payload }) =>
      signerAccount.signMessage({ message: payload }),
    );

    const result = (await signMessageTool.handler({ message }, buildContext(signMessage))) as Record<string, unknown>;
    const recovered = await recoverMessageAddress({
      message,
      signature: result.signature as `0x${string}`,
    });
    expect(signMessage).toHaveBeenCalledWith({ message });
    expect(recovered.toLowerCase()).toBe((result.signerAddress as string).toLowerCase());
  });
});
