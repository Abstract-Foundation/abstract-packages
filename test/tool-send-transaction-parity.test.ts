import { sendTransactionTool } from "../src/tools/send-transaction.js";
import type { AgwSessionData } from "../src/session/types.js";
import type { ToolContext } from "../src/tools/types.js";
import { Logger } from "../src/utils/logger.js";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

function buildSessionData(): AgwSessionData {
  const now = Math.floor(Date.now() / 1000);
  return {
    accountAddress: "0x1111111111111111111111111111111111111111",
    chainId: 11124,
    expiresAt: now + 3600,
    createdAt: now,
    updatedAt: now,
    status: "active",
    sessionConfig: {
      signer: "0x2222222222222222222222222222222222222222",
      expiresAt: String(now + 3600),
      feeLimit: { limitType: "lifetime", limit: "1", period: "0" },
      maxValuePerUse: "1000",
      callPolicies: [{ target: "0x3333333333333333333333333333333333333333", selector: "0xa9059cbb" }],
      transferPolicies: [{ tokenAddress: ZERO_ADDRESS, maxAmountBaseUnit: "1000" }],
    },
    sessionSignerRef: {
      kind: "keyfile",
      value: "/tmp/session.key",
    },
  };
}

describe("send_transaction action parity", () => {
  it("calls sendTransaction on execute mode", async () => {
    const signTransaction = jest.fn<Promise<`0x${string}`>, [Record<string, unknown>]>(async () => "0x1234");
    const sendTransaction = jest.fn<Promise<`0x${string}`>, [Record<string, unknown>]>(async () => "0x5678");

    const context: ToolContext = {
      sessionManager: {
        getSession: () => buildSessionData(),
        getSessionStatus: () => "active",
        createSessionClient: jest.fn(() => ({ signTransaction, sendTransaction })) as unknown as ToolContext["sessionManager"]["createSessionClient"],
      } as unknown as ToolContext["sessionManager"],
      logger: new Logger("test"),
    };

    const result = (await sendTransactionTool.handler(
      {
        to: "0x3333333333333333333333333333333333333333",
        data: "0xa9059cbb",
        value: "1",
        execute: true,
      },
      context,
    )) as Record<string, unknown>;

    expect(sendTransaction).toHaveBeenCalledTimes(1);
    expect(result.txHash).toBe("0x5678");
  });
});
