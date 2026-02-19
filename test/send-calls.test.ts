import { getTool } from "../src/tools/index.js";
import { sendCallsTool } from "../src/tools/send-calls.js";
import type { AgwSessionData } from "../src/session/types.js";
import type { ToolContext } from "../src/tools/types.js";
import { Logger } from "../src/utils/logger.js";

const TARGET = "0x3333333333333333333333333333333333333333";
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

function buildSessionData(overrides: Partial<AgwSessionData> = {}): AgwSessionData {
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
      feeLimit: { limitType: "lifetime", limit: "1000000", period: "0" },
      maxValuePerUse: "1000000",
      callPolicies: [{ target: TARGET, selector: "0xa9059cbb" }],
      transferPolicies: [{ tokenAddress: ZERO_ADDRESS, maxAmountBaseUnit: "1000" }],
    },
    sessionSignerRef: { kind: "keyfile", value: "/tmp/session.key" },
    ...overrides,
  };
}

function buildContext(sendCalls: jest.Mock<Promise<{ id: string }>, [Record<string, unknown>]>): ToolContext {
  return {
    sessionManager: {
      getSession: () => buildSessionData(),
      getSessionStatus: () => "active",
      createSessionClient: jest.fn(() => ({ sendCalls })) as unknown as ToolContext["sessionManager"]["createSessionClient"],
    } as unknown as ToolContext["sessionManager"],
    logger: new Logger("test"),
  };
}

describe("send_calls tool", () => {
  it("is registered in tool index", () => {
    expect(getTool("send_calls")).toBeDefined();
  });

  it("returns preview in non-execute mode", async () => {
    const sendCalls = jest.fn<Promise<{ id: string }>, [Record<string, unknown>]>(async () => ({ id: "bundle-1" }));
    const result = (await sendCallsTool.handler(
      {
        calls: [{ to: TARGET, data: "0xa9059cbb", value: "0" }],
      },
      buildContext(sendCalls),
    )) as Record<string, unknown>;

    expect(result.preview).toBe(true);
    expect(sendCalls).not.toHaveBeenCalled();
  });

  it("executes sendCalls when execute=true", async () => {
    const sendCalls = jest.fn<Promise<{ id: string }>, [Record<string, unknown>]>(async () => ({ id: "bundle-1" }));
    const result = (await sendCallsTool.handler(
      {
        execute: true,
        calls: [{ to: TARGET, data: "0xa9059cbb", value: "7" }],
      },
      buildContext(sendCalls),
    )) as Record<string, unknown>;

    expect(sendCalls).toHaveBeenCalledTimes(1);
    expect(result.id).toBe("bundle-1");
    expect(result.callCount).toBe(1);
  });

  it("rejects calls blocked by call policy", async () => {
    const sendCalls = jest.fn<Promise<{ id: string }>, [Record<string, unknown>]>(async () => ({ id: "bundle-1" }));

    await expect(
      sendCallsTool.handler(
        {
          execute: true,
          calls: [{ to: "0x9999999999999999999999999999999999999999", data: "0xa9059cbb", value: "0" }],
        },
        buildContext(sendCalls),
      ),
    ).rejects.toThrow("send_calls rejected: call policy does not allow calls[0] target/selector");
  });
});
