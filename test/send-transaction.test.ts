import { abstractTestnet } from "viem/chains";
import { resolveNetworkConfig } from "../src/config/network.js";
import type { AgwSessionData } from "../src/session/types.js";
import { getTool } from "../src/tools/index.js";
import { sendTransactionTool } from "../src/tools/send-transaction.js";
import type { ToolContext } from "../src/tools/types.js";
import { Logger } from "../src/utils/logger.js";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

function buildSessionData(overrides: Partial<AgwSessionData> = {}): AgwSessionData {
  const now = Math.floor(Date.now() / 1000);

  return {
    accountAddress: "0x1111111111111111111111111111111111111111",
    chainId: abstractTestnet.id,
    expiresAt: now + 3600,
    createdAt: now,
    updatedAt: now,
    status: "active",
    sessionConfig: {
      signer: "0x2222222222222222222222222222222222222222",
      expiresAt: String(now + 3600),
      feeLimit: {
        limitType: "lifetime",
        limit: "1000000000000000000",
        period: "0",
      },
      maxValuePerUse: "1000000000000000000",
      callPolicies: [
        {
          target: "0x3333333333333333333333333333333333333333",
          selector: "0xa9059cbb",
        },
      ],
      transferPolicies: [
        {
          tokenAddress: ZERO_ADDRESS,
          maxAmountBaseUnit: "1000",
        },
      ],
    },
    sessionSignerRef: {
      kind: "keyfile",
      value: "/tmp/session.key",
    },
    ...overrides,
  };
}

interface SessionClientSpies {
  signTransaction: jest.Mock<Promise<`0x${string}`>, [Record<string, unknown>]>;
  sendTransaction: jest.Mock<Promise<`0x${string}`>, [Record<string, unknown>]>;
}

function buildContext(session: AgwSessionData, sessionClientSpies: SessionClientSpies): ToolContext {
  return {
    sessionManager: {
      getSession: () => session,
      getSessionStatus: () => "active",
      createSessionClient: jest.fn(() => sessionClientSpies) as unknown as ToolContext["sessionManager"]["createSessionClient"],
    } as unknown as ToolContext["sessionManager"],
    logger: new Logger("test"),
  };
}

describe("send_transaction tool", () => {
  it("is registered in tool index", () => {
    expect(getTool("send_transaction")).toBeDefined();
  });

  it("returns a preview and does not broadcast unless execute is explicitly true", async () => {
    const signTransaction = jest.fn<Promise<`0x${string}`>, [Record<string, unknown>]>(async () => "0x1234");
    const sendTransaction = jest.fn<Promise<`0x${string}`>, [Record<string, unknown>]>(async () => "0xbeef");
    const session = buildSessionData();
    const context = buildContext(session, { signTransaction, sendTransaction });

    const result = (await sendTransactionTool.handler(
      {
        to: "0x3333333333333333333333333333333333333333",
        data: "0xa9059cbb0000000000000000000000000000000000000000000000000000000000000001",
        value: "7",
      },
      context,
    )) as Record<string, unknown>;

    expect(result).toEqual({
      broadcast: false,
      preview: true,
      executionRisk: "state_change",
      requiresExplicitExecute: true,
      accountAddress: session.accountAddress,
      chainId: session.chainId,
      transaction: {
        to: "0x3333333333333333333333333333333333333333",
        data: "0xa9059cbb0000000000000000000000000000000000000000000000000000000000000001",
        value: "7",
      },
    });

    expect(signTransaction).not.toHaveBeenCalled();
    expect(sendTransaction).not.toHaveBeenCalled();
    const createSessionClient = context.sessionManager.createSessionClient as unknown as jest.Mock;
    expect(createSessionClient).not.toHaveBeenCalled();
  });

  it("broadcasts when execute is true and returns tx hash + explorer link", async () => {
    const signTransaction = jest.fn<Promise<`0x${string}`>, [Record<string, unknown>]>(async () => "0x1234");
    const sendTransaction = jest.fn<Promise<`0x${string}`>, [Record<string, unknown>]>(async () =>
      "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    );
    const session = buildSessionData();
    const context = buildContext(session, { signTransaction, sendTransaction });

    const result = (await sendTransactionTool.handler(
      {
        to: "0x3333333333333333333333333333333333333333",
        data: "0xa9059cbb0000000000000000000000000000000000000000000000000000000000000001",
        value: "7",
        execute: true,
      },
      context,
    )) as Record<string, unknown>;

    const networkConfig = resolveNetworkConfig({ chainId: session.chainId });
    const explorerBase = networkConfig.chain.blockExplorers?.default?.url ?? null;

    expect(sendTransaction).toHaveBeenCalledTimes(1);
    expect(sendTransaction).toHaveBeenCalledWith({
      account: session.accountAddress,
      chain: undefined,
      to: "0x3333333333333333333333333333333333333333",
      data: "0xa9059cbb0000000000000000000000000000000000000000000000000000000000000001",
      value: 7n,
    });
    expect(signTransaction).not.toHaveBeenCalled();

    const createSessionClient = context.sessionManager.createSessionClient as unknown as jest.Mock;
    expect(createSessionClient).toHaveBeenCalledWith({
      chain: expect.objectContaining({ id: abstractTestnet.id }),
      rpcUrl: abstractTestnet.rpcUrls.default.http[0],
    });

    expect(result).toEqual({
      broadcast: true,
      txHash: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      accountAddress: session.accountAddress,
      chainId: session.chainId,
      explorer: {
        chain: explorerBase,
        transaction: `${explorerBase}/tx/0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa`,
      },
      transaction: {
        to: "0x3333333333333333333333333333333333333333",
        data: "0xa9059cbb0000000000000000000000000000000000000000000000000000000000000001",
        value: "7",
      },
    });
  });

  it("rejects disallowed targets/selectors and does not broadcast", async () => {
    const signTransaction = jest.fn<Promise<`0x${string}`>, [Record<string, unknown>]>(async () => "0x1234");
    const sendTransaction = jest.fn<Promise<`0x${string}`>, [Record<string, unknown>]>(async () => "0xbeef");
    const session = buildSessionData();
    const context = buildContext(session, { signTransaction, sendTransaction });

    await expect(
      sendTransactionTool.handler(
        {
          to: "0x4444444444444444444444444444444444444444",
          data: "0xa9059cbb0000000000000000000000000000000000000000000000000000000000000001",
          execute: true,
        },
        context,
      ),
    ).rejects.toThrow("transaction rejected: call policy does not allow this target/selector");

    expect(signTransaction).not.toHaveBeenCalled();
    expect(sendTransaction).not.toHaveBeenCalled();
  });

  it("rejects value above transfer policy and does not broadcast", async () => {
    const signTransaction = jest.fn<Promise<`0x${string}`>, [Record<string, unknown>]>(async () => "0x1234");
    const sendTransaction = jest.fn<Promise<`0x${string}`>, [Record<string, unknown>]>(async () => "0xbeef");
    const session = buildSessionData();
    const context = buildContext(session, { signTransaction, sendTransaction });

    await expect(
      sendTransactionTool.handler(
        {
          to: "0x3333333333333333333333333333333333333333",
          data: "0xa9059cbb0000000000000000000000000000000000000000000000000000000000000001",
          value: "1001",
          execute: true,
        },
        context,
      ),
    ).rejects.toThrow("transaction rejected: transfer policy does not allow this value");

    expect(signTransaction).not.toHaveBeenCalled();
    expect(sendTransaction).not.toHaveBeenCalled();
  });
});
