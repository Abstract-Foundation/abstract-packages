import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { resolveNetworkConfig } from "../src/config/network.js";
import { SessionManager } from "../src/session/manager.js";
import type { AgwSessionData } from "../src/session/types.js";
import {
  createGetTokenListTool,
  type CreateTokenListReaderInput,
  type TokenListReader,
} from "../src/tools/get-token-list.js";
import { getTool } from "../src/tools/index.js";
import type { ToolContext } from "../src/tools/types.js";
import { Logger } from "../src/utils/logger.js";

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
      feeLimit: {
        limitType: "lifetime",
        limit: "1000000000000000",
        period: "0",
      },
      maxValuePerUse: "1000000000000000",
      callPolicies: [],
      transferPolicies: [],
    },
    sessionSignerRef: {
      kind: "keyfile",
      value: "/tmp/session.key",
    },
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
  };
}

describe("get_token_list tool", () => {
  it("is registered in tool index", () => {
    expect(getTool("get_token_list")).toBeDefined();
  });

  it("returns disconnected shape when no session is present", async () => {
    const createTokenListReader = jest.fn<TokenListReader, [CreateTokenListReaderInput]>();
    const tool = createGetTokenListTool({ createTokenListReader });

    const context = buildContext({
      getSession: () => null,
      getSessionStatus: () => "missing",
    });

    const result = (await tool.handler({}, context)) as Record<string, unknown>;

    expect(result).toEqual({
      connected: false,
      sessionStatus: "missing",
      accountAddress: null,
      chainId: 11124,
      explorer: {
        chain: "https://sepolia.abscan.org",
        account: null,
      },
      tokenHoldings: [],
    });
    expect(createTokenListReader).not.toHaveBeenCalled();
  });

  it("validates session account address", async () => {
    const createTokenListReader = jest.fn<TokenListReader, [CreateTokenListReaderInput]>();
    const tool = createGetTokenListTool({ createTokenListReader });

    const context = buildContext({
      getSession: () =>
        buildSessionData({
          accountAddress: "not-an-address",
        }),
    });

    await expect(tool.handler({}, context)).rejects.toThrow("session account address is invalid");
    expect(createTokenListReader).not.toHaveBeenCalled();
  });

  it("returns normalized token holdings with symbol, decimals, and value fields", async () => {
    const tokenAddress = "0x3333333333333333333333333333333333333333";
    const zeroBalanceTokenAddress = "0x4444444444444444444444444444444444444444";
    const reader: TokenListReader = {
      getTokenBalances: async () => ({
        [tokenAddress]: "1234500",
        [zeroBalanceTokenAddress]: "0",
      }),
      getTokenMetadata: async targetTokenAddress => {
        if (targetTokenAddress.toLowerCase() === tokenAddress.toLowerCase()) {
          return {
            symbol: "USDC",
            decimals: 6,
          };
        }

        return {
          symbol: "ZERO",
          decimals: 18,
        };
      },
    };

    const createTokenListReader = jest.fn<TokenListReader, [CreateTokenListReaderInput]>(() => reader);
    const tool = createGetTokenListTool({ createTokenListReader });
    const context = buildContext({});

    const result = (await tool.handler({}, context)) as Record<string, unknown>;
    const expectedNetwork = resolveNetworkConfig({ chainId: 11124 });

    expect(result).toEqual({
      connected: true,
      sessionStatus: "active",
      accountAddress: "0x1111111111111111111111111111111111111111",
      chainId: 11124,
      explorer: {
        chain: "https://sepolia.abscan.org",
        account: "https://sepolia.abscan.org/address/0x1111111111111111111111111111111111111111",
      },
      tokenHoldings: [
        {
          tokenAddress,
          symbol: "USDC",
          decimals: 6,
          value: {
            raw: "1234500",
            formatted: "1.2345",
          },
          explorer: {
            token: "https://sepolia.abscan.org/token/0x3333333333333333333333333333333333333333",
            holder:
              "https://sepolia.abscan.org/token/0x3333333333333333333333333333333333333333?a=0x1111111111111111111111111111111111111111",
          },
        },
      ],
    });

    expect(createTokenListReader).toHaveBeenCalledWith({
      chainId: 11124,
      rpcUrl: expectedNetwork.rpcUrl,
    });
  });

  it("integrates with SessionManager and resolves reader for session chain", async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "agw-mcp-get-token-list-"));
    const logger = new Logger("test");

    try {
      const manager = new SessionManager(logger, {
        storageDir: tmpDir,
        chainId: 11124,
      });

      manager.setSession(
        buildSessionData({
          chainId: 2741,
          accountAddress: "0x9999999999999999999999999999999999999999",
        }),
      );

      const tokenAddress = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
      const reader: TokenListReader = {
        getTokenBalances: async () => ({
          [tokenAddress]: "1000000000000000000",
        }),
        getTokenMetadata: async () => ({
          symbol: "TKN",
          decimals: 18,
        }),
      };
      const createTokenListReader = jest.fn<TokenListReader, [CreateTokenListReaderInput]>(() => reader);
      const tool = createGetTokenListTool({ createTokenListReader });

      const result = (await tool.handler(
        {},
        {
          sessionManager: manager,
          logger,
        },
      )) as Record<string, unknown>;

      const expectedNetwork = resolveNetworkConfig({ chainId: 2741 });

      expect(createTokenListReader).toHaveBeenCalledWith({
        chainId: 2741,
        rpcUrl: expectedNetwork.rpcUrl,
      });

      expect(result.chainId).toBe(2741);
      expect(result.accountAddress).toBe("0x9999999999999999999999999999999999999999");
      expect(result.tokenHoldings).toEqual([
        {
          tokenAddress,
          symbol: "TKN",
          decimals: 18,
          value: {
            raw: "1000000000000000000",
            formatted: "1",
          },
          explorer: {
            token: "https://abscan.org/token/0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            holder: "https://abscan.org/token/0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa?a=0x9999999999999999999999999999999999999999",
          },
        },
      ]);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});
