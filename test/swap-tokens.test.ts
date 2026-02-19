import { getTool } from "../src/tools/index.js";
import { createSwapTokensTool } from "../src/tools/swap-tokens.js";
import type { AgwSessionData } from "../src/session/types.js";
import type { ToolContext } from "../src/tools/types.js";
import { Logger } from "../src/utils/logger.js";

const AGGREGATOR = "0x3333333333333333333333333333333333333333";

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
      callPolicies: [{ target: AGGREGATOR, selector: "0xa9059cbb" }],
      transferPolicies: [{ tokenAddress: "0x0000000000000000000000000000000000000000", maxAmountBaseUnit: "1000" }],
    },
    sessionSignerRef: { kind: "keyfile", value: "/tmp/session.key" },
    ...overrides,
  };
}

function buildContext(sendTransaction: jest.Mock<Promise<`0x${string}`>, [Record<string, unknown>]>): ToolContext {
  return {
    sessionManager: {
      getSession: () => buildSessionData(),
      getSessionStatus: () => "active",
      createSessionClient: jest.fn(() => ({ sendTransaction })) as unknown as ToolContext["sessionManager"]["createSessionClient"],
    } as unknown as ToolContext["sessionManager"],
    logger: new Logger("test"),
  };
}

describe("swap_tokens tool", () => {
  it("is registered in tool index", () => {
    expect(getTool("swap_tokens")).toBeDefined();
  });

  it("returns quote metadata in non-execute mode", async () => {
    const quoteAdapter = {
      getQuote: jest.fn(async () => ({
        quoteId: "q1",
        chainId: 11124,
        sellToken: "ETH",
        buyToken: "USDC",
        sellAmount: "100",
        buyAmount: "200",
        minBuyAmount: "198",
        price: "2",
        grossPrice: "2",
        estimatedPriceImpact: "0.1",
        allowanceTarget: AGGREGATOR,
        gas: { limit: "1", price: "1", estimatedFee: "1" },
        transaction: {
          to: AGGREGATOR,
          data: "0xa9059cbb",
          value: "0",
        },
        fees: {
          integratorFee: null,
          zeroExFee: null,
          gasFee: null,
        },
        issues: {
          allowance: { actual: "0", spender: AGGREGATOR },
          balance: null,
          simulationIncomplete: false,
          invalidSourcesPassed: [],
        },
        route: { fills: [] },
      })),
    };

    const tool = createSwapTokensTool({ quoteAdapter });
    const sendTransaction = jest.fn<Promise<`0x${string}`>, [Record<string, unknown>]>(async () => "0xabc");
    const result = (await tool.handler(
      { sellToken: "ETH", buyToken: "USDC", sellAmount: "100" },
      buildContext(sendTransaction),
    )) as Record<string, unknown>;

    expect(result.execute).toBe(false);
    expect(result.approval).toEqual({
      required: true,
      allowanceTarget: AGGREGATOR,
      spender: AGGREGATOR,
    });
    expect(sendTransaction).not.toHaveBeenCalled();
  });

  it("broadcasts swap in execute mode", async () => {
    const quoteAdapter = {
      getQuote: jest.fn(async () => ({
        quoteId: "q1",
        chainId: 11124,
        sellToken: "ETH",
        buyToken: "USDC",
        sellAmount: "100",
        buyAmount: "200",
        minBuyAmount: "198",
        price: "2",
        grossPrice: "2",
        estimatedPriceImpact: "0.1",
        allowanceTarget: null,
        gas: { limit: "1", price: "1", estimatedFee: "1" },
        transaction: {
          to: AGGREGATOR,
          data: "0xa9059cbb",
          value: "0",
        },
        fees: {
          integratorFee: null,
          zeroExFee: null,
          gasFee: null,
        },
        issues: {
          allowance: null,
          balance: null,
          simulationIncomplete: false,
          invalidSourcesPassed: [],
        },
        route: { fills: [] },
      })),
    };

    const tool = createSwapTokensTool({ quoteAdapter });
    const sendTransaction = jest.fn<Promise<`0x${string}`>, [Record<string, unknown>]>(async () => "0xabc");
    const result = (await tool.handler(
      { sellToken: "ETH", buyToken: "USDC", sellAmount: "100", execute: true },
      buildContext(sendTransaction),
    )) as Record<string, unknown>;

    expect(result.execute).toBe(true);
    expect(result.txHash).toBe("0xabc");
    expect(sendTransaction).toHaveBeenCalledTimes(1);
  });

  it("rejects quote that violates call policy", async () => {
    const quoteAdapter = {
      getQuote: jest.fn(async () => ({
        quoteId: "q1",
        chainId: 11124,
        sellToken: "ETH",
        buyToken: "USDC",
        sellAmount: "100",
        buyAmount: "200",
        minBuyAmount: "198",
        price: "2",
        grossPrice: "2",
        estimatedPriceImpact: "0.1",
        allowanceTarget: null,
        gas: { limit: "1", price: "1", estimatedFee: "1" },
        transaction: {
          to: "0x9999999999999999999999999999999999999999",
          data: "0xa9059cbb",
          value: "0",
        },
        fees: {
          integratorFee: null,
          zeroExFee: null,
          gasFee: null,
        },
        issues: {
          allowance: null,
          balance: null,
          simulationIncomplete: false,
          invalidSourcesPassed: [],
        },
        route: { fills: [] },
      })),
    };

    const tool = createSwapTokensTool({ quoteAdapter });
    const sendTransaction = jest.fn<Promise<`0x${string}`>, [Record<string, unknown>]>(async () => "0xabc");

    await expect(
      tool.handler({ sellToken: "ETH", buyToken: "USDC", sellAmount: "100" }, buildContext(sendTransaction)),
    ).rejects.toThrow("swap rejected: call policy does not allow the quoted swap target/selector");
  });
});
