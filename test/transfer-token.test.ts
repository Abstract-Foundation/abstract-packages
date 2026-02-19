import { getTool } from "../src/tools/index.js";
import { transferTokenTool } from "../src/tools/transfer-token.js";
import type { AgwSessionData } from "../src/session/types.js";
import type { ToolContext } from "../src/tools/types.js";
import { Logger } from "../src/utils/logger.js";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const TOKEN_ADDRESS = "0x3333333333333333333333333333333333333333";
const RECIPIENT = "0x4444444444444444444444444444444444444444";

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
      callPolicies: [{ target: TOKEN_ADDRESS, selector: "0xa9059cbb" }],
      transferPolicies: [
        { tokenAddress: ZERO_ADDRESS, maxAmountBaseUnit: "1000" },
        { tokenAddress: TOKEN_ADDRESS, maxAmountBaseUnit: "5000" },
      ],
    },
    sessionSignerRef: {
      kind: "keyfile",
      value: "/tmp/session.key",
    },
    ...overrides,
  };
}

function buildContext(spies: {
  sendTransaction: jest.Mock<Promise<`0x${string}`>, [Record<string, unknown>]>;
  writeContract: jest.Mock<Promise<`0x${string}`>, [Record<string, unknown>]>;
}): ToolContext {
  const session = buildSessionData();
  return {
    sessionManager: {
      getSession: () => session,
      getSessionStatus: () => "active",
      createSessionClient: jest.fn(() => spies) as unknown as ToolContext["sessionManager"]["createSessionClient"],
    } as unknown as ToolContext["sessionManager"],
    logger: new Logger("test"),
  };
}

describe("transfer_token tool", () => {
  it("is registered in tool index", () => {
    expect(getTool("transfer_token")).toBeDefined();
  });

  it("returns preview by default and does not broadcast", async () => {
    const sendTransaction = jest.fn<Promise<`0x${string}`>, [Record<string, unknown>]>(async () => "0xabc");
    const writeContract = jest.fn<Promise<`0x${string}`>, [Record<string, unknown>]>(async () => "0xdef");
    const result = (await transferTokenTool.handler(
      {
        to: RECIPIENT,
        amount: "10",
      },
      buildContext({ sendTransaction, writeContract }),
    )) as Record<string, unknown>;

    expect(result.broadcast).toBe(false);
    expect(sendTransaction).not.toHaveBeenCalled();
    expect(writeContract).not.toHaveBeenCalled();
  });

  it("executes native transfer via sendTransaction", async () => {
    const sendTransaction = jest.fn<Promise<`0x${string}`>, [Record<string, unknown>]>(async () => "0xabc");
    const writeContract = jest.fn<Promise<`0x${string}`>, [Record<string, unknown>]>(async () => "0xdef");
    const result = (await transferTokenTool.handler(
      {
        to: RECIPIENT,
        amount: "10",
        execute: true,
      },
      buildContext({ sendTransaction, writeContract }),
    )) as Record<string, unknown>;

    expect(sendTransaction).toHaveBeenCalledTimes(1);
    expect(writeContract).not.toHaveBeenCalled();
    expect(result.txHash).toBe("0xabc");
    expect(result.transfer).toEqual({
      tokenAddress: ZERO_ADDRESS,
      to: RECIPIENT,
      amount: "10",
      type: "native",
    });
  });

  it("executes erc20 transfer via writeContract", async () => {
    const sendTransaction = jest.fn<Promise<`0x${string}`>, [Record<string, unknown>]>(async () => "0xabc");
    const writeContract = jest.fn<Promise<`0x${string}`>, [Record<string, unknown>]>(async () => "0xdef");
    const result = (await transferTokenTool.handler(
      {
        to: RECIPIENT,
        tokenAddress: TOKEN_ADDRESS,
        amount: "25",
        execute: true,
      },
      buildContext({ sendTransaction, writeContract }),
    )) as Record<string, unknown>;

    expect(writeContract).toHaveBeenCalledTimes(1);
    expect(sendTransaction).not.toHaveBeenCalled();
    expect(result.txHash).toBe("0xdef");
    expect(result.transfer).toEqual({
      tokenAddress: TOKEN_ADDRESS,
      to: RECIPIENT,
      amount: "25",
      type: "erc20",
    });
  });

  it("rejects erc20 amount above policy limit", async () => {
    const sendTransaction = jest.fn<Promise<`0x${string}`>, [Record<string, unknown>]>(async () => "0xabc");
    const writeContract = jest.fn<Promise<`0x${string}`>, [Record<string, unknown>]>(async () => "0xdef");

    await expect(
      transferTokenTool.handler(
        {
          to: RECIPIENT,
          tokenAddress: TOKEN_ADDRESS,
          amount: "6000",
          execute: true,
        },
        buildContext({ sendTransaction, writeContract }),
      ),
    ).rejects.toThrow("token transfer rejected: transfer policy does not allow this token amount");
  });
});
