import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { resolveNetworkConfig } from "../packages/agw-core/src/config/network.js";
import { SessionManager } from "../packages/agw-core/src/session/manager.js";
import type { AgwSessionData } from "../packages/agw-core/src/session/types.js";
import { createGetBalancesTool, type BalanceReader, type CreateBalanceReaderInput } from "../packages/agw-core/src/tools/get-balances.js";
import { getTool } from "../packages/agw-core/src/tools/index.js";
import type { ToolContext } from "../packages/agw-core/src/tools/types.js";
import { Logger } from "../packages/agw-core/src/utils/logger.js";

function buildSessionData(overrides: Partial<AgwSessionData> = {}): AgwSessionData {
  const now = Math.floor(Date.now() / 1000);

  return {
    accountAddress: "0x1111111111111111111111111111111111111111",
    chainId: 11124,
    createdAt: now,
    updatedAt: now,
    status: "active",
    ...overrides,
  };
}

function buildContext(overrides: Partial<ToolContext["sessionManager"]>): ToolContext {
  return {
    sessionManager: {
      getSession: () => buildSessionData(),
      getSessionStatus: () => "active",
      getChainId: () => 11124,
      ...overrides,
    } as unknown as ToolContext["sessionManager"],
    logger: new Logger("test"),
    runtime: {},
  };
}

describe("get_balances tool", () => {
  it("is registered in tool index", () => {
    expect(getTool("get_balances")).toBeDefined();
  });

  it("returns disconnected shape when no session is present", async () => {
    const createBalanceReader = jest.fn<BalanceReader, [CreateBalanceReaderInput]>();
    const tool = createGetBalancesTool({ createBalanceReader });

    const context = buildContext({
      getSession: () => null,
      getSessionStatus: () => "missing",
    });

    const result = (await tool.handler({}, context)) as Record<string, unknown>;
    const expectedNetwork = resolveNetworkConfig({ chainId: 11124 });

    expect(result).toEqual({
      connected: false,
      sessionStatus: "missing",
      accountAddress: null,
      chainId: 11124,
      explorer: {
        chain: expectedNetwork.chain.blockExplorers?.default?.url ?? null,
        account: null,
      },
      nativeBalance: null,
      tokenBalances: [],
    });
    expect(createBalanceReader).not.toHaveBeenCalled();
  });

  it("validates tokenAddresses input", async () => {
    const createBalanceReader = jest.fn<BalanceReader, [CreateBalanceReaderInput]>();
    const tool = createGetBalancesTool({ createBalanceReader });
    const context = buildContext({});

    await expect(tool.handler({ tokenAddresses: "nope" }, context)).rejects.toThrow(
      "tokenAddresses must be an array of token contract addresses",
    );

    await expect(tool.handler({ tokenAddresses: ["not-an-address"] }, context)).rejects.toThrow(
      "tokenAddresses[0] must be a valid 0x-prefixed address",
    );
    expect(createBalanceReader).not.toHaveBeenCalled();
  });

  it("returns normalized native and token balances with explorer references", async () => {
    const reader: BalanceReader = {
      getNativeBalance: async () => 1230000000000000000n,
      getTokenBalance: async () => 1234500n,
      getTokenDecimals: async () => 6,
      getTokenSymbol: async () => "USDC",
    };

    const createBalanceReader = jest.fn<BalanceReader, [CreateBalanceReaderInput]>(() => reader);
    const tool = createGetBalancesTool({ createBalanceReader });
    const context = buildContext({});

    const tokenAddress = "0x3333333333333333333333333333333333333333";
    const result = (await tool.handler({ tokenAddresses: [tokenAddress] }, context)) as Record<string, unknown>;
    const expectedNetwork = resolveNetworkConfig({ chainId: 11124 });
    const explorerBase = expectedNetwork.chain.blockExplorers?.default?.url ?? null;

    expect(result).toEqual({
      connected: true,
      sessionStatus: "active",
      accountAddress: "0x1111111111111111111111111111111111111111",
      chainId: 11124,
      explorer: {
        chain: explorerBase,
        account: `${explorerBase}/address/0x1111111111111111111111111111111111111111`,
      },
      nativeBalance: {
        symbol: "ETH",
        decimals: 18,
        amount: {
          raw: "1230000000000000000",
          formatted: "1.23",
        },
      },
      tokenBalances: [
        {
          tokenAddress,
          symbol: "USDC",
          decimals: 6,
          amount: {
            raw: "1234500",
            formatted: "1.2345",
          },
          explorer: {
            token: `${explorerBase}/token/${tokenAddress}`,
            holder: `${explorerBase}/token/${tokenAddress}?a=0x1111111111111111111111111111111111111111`,
          },
        },
      ],
    });

    expect(createBalanceReader).toHaveBeenCalledWith({
      chainId: 11124,
      rpcUrl: expectedNetwork.rpcUrl,
    });
  });

  it("integrates with SessionManager and de-duplicates token addresses", async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "agw-mcp-get-balances-"));
    const logger = new Logger("test");

    try {
      const manager = new SessionManager(logger, {
        homeDir: tmpDir,
        chainId: 11124,
      });

      manager.setSession(
        buildSessionData({
          chainId: 2741,
          accountAddress: "0x9999999999999999999999999999999999999999",
        }),
      );

      const reader: BalanceReader = {
        getNativeBalance: async () => 1n,
        getTokenBalance: async () => 2n,
        getTokenDecimals: async () => 18,
        getTokenSymbol: async () => "TKN",
      };

      const createBalanceReader = jest.fn<BalanceReader, [CreateBalanceReaderInput]>(() => reader);
      const tool = createGetBalancesTool({ createBalanceReader });

      const result = (await tool.handler(
        {
          tokenAddresses: [
            "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            "0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
          ],
        },
        {
          sessionManager: manager,
          logger,
          runtime: {},
        },
      )) as Record<string, unknown>;

      const expectedNetwork = resolveNetworkConfig({ chainId: 2741 });

      expect(createBalanceReader).toHaveBeenCalledWith({
        chainId: 2741,
        rpcUrl: expectedNetwork.rpcUrl,
      });

      expect(result.chainId).toBe(2741);
      expect((result.tokenBalances as unknown[]).length).toBe(1);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});
