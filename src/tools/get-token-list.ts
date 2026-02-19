import { createPublicClient, erc20Abi, formatUnits, http, isAddress, type Address } from "viem";
import { resolveNetworkConfig } from "../config/network.js";
import { buildExplorerUrl } from "../utils/explorer.js";
import type { ToolHandler } from "./types.js";

export interface CreateTokenListReaderInput {
  chainId: number;
  rpcUrl?: string;
}

export interface TokenMetadata {
  symbol: string;
  decimals: number;
}

export interface TokenListReader {
  getTokenBalances: (accountAddress: Address) => Promise<Record<string, string>>;
  getTokenMetadata: (tokenAddress: Address) => Promise<TokenMetadata>;
}

export interface GetTokenListToolDependencies {
  createTokenListReader: (input: CreateTokenListReaderInput) => TokenListReader;
}

interface TokenBalanceEntry {
  tokenAddress: Address;
  rawValue: bigint;
}

function normalizeTokenBalances(value: unknown): TokenBalanceEntry[] {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("token balances payload must be an object");
  }

  const entries: TokenBalanceEntry[] = [];

  for (const [tokenAddress, rawValue] of Object.entries(value as Record<string, unknown>)) {
    if (!isAddress(tokenAddress, { strict: false })) {
      continue;
    }

    if (typeof rawValue !== "string") {
      throw new Error(`token balance for ${tokenAddress} must be a string`);
    }

    let parsedRawValue: bigint;
    try {
      parsedRawValue = BigInt(rawValue);
    } catch {
      throw new Error(`token balance for ${tokenAddress} is not a valid bigint string`);
    }

    if (parsedRawValue < 0n) {
      throw new Error(`token balance for ${tokenAddress} must be non-negative`);
    }

    if (parsedRawValue === 0n) {
      continue;
    }

    entries.push({
      tokenAddress: tokenAddress as Address,
      rawValue: parsedRawValue,
    });
  }

  entries.sort((left, right) => {
    if (left.rawValue === right.rawValue) {
      return left.tokenAddress.toLowerCase().localeCompare(right.tokenAddress.toLowerCase());
    }

    return left.rawValue > right.rawValue ? -1 : 1;
  });

  return entries;
}

function createDefaultTokenListReader(input: CreateTokenListReaderInput): TokenListReader {
  const networkConfig = resolveNetworkConfig({
    chainId: input.chainId,
    rpcUrl: input.rpcUrl,
  });
  const publicClient = createPublicClient({
    chain: networkConfig.chain,
    transport: http(networkConfig.rpcUrl),
  });

  return {
    getTokenBalances: async accountAddress => {
      const request = publicClient.request as unknown as (args: { method: string; params: unknown[] }) => Promise<unknown>;
      const response = await request({
        method: "zks_getAllAccountBalances",
        params: [accountAddress],
      });

      if (typeof response !== "object" || response === null || Array.isArray(response)) {
        throw new Error("zks_getAllAccountBalances returned an invalid response payload");
      }

      const balances: Record<string, string> = {};
      for (const [tokenAddress, rawValue] of Object.entries(response as Record<string, unknown>)) {
        if (typeof rawValue !== "string") {
          throw new Error(`token balance for ${tokenAddress} returned a non-string value`);
        }
        balances[tokenAddress] = rawValue;
      }

      return balances;
    },
    getTokenMetadata: async tokenAddress => {
      const [symbol, decimals] = await Promise.all([
        publicClient.readContract({
          address: tokenAddress,
          abi: erc20Abi,
          functionName: "symbol",
        }),
        publicClient.readContract({
          address: tokenAddress,
          abi: erc20Abi,
          functionName: "decimals",
        }),
      ]);

      if (typeof symbol !== "string") {
        throw new Error(`token ${tokenAddress} returned a non-string symbol value`);
      }
      if (typeof decimals !== "number" || !Number.isInteger(decimals) || decimals < 0) {
        throw new Error(`token ${tokenAddress} returned an invalid decimals value`);
      }

      return {
        symbol,
        decimals,
      };
    },
  };
}

export function createGetTokenListTool(
  dependencies: GetTokenListToolDependencies = {
    createTokenListReader: createDefaultTokenListReader,
  },
): ToolHandler {
  return {
    name: "get_token_list",
    description: "Returns AGW wallet ERC-20 token holdings with normalized value fields.",
    inputSchema: {
      type: "object",
      properties: {},
    },
    handler: async (_params, context) => {
      const session = context.sessionManager.getSession();
      const chainId = session?.chainId ?? context.sessionManager.getChainId();
      const networkConfig = resolveNetworkConfig({ chainId });
      const explorerBase = networkConfig.chain.blockExplorers?.default?.url ?? null;

      if (!session) {
        return {
          connected: false,
          sessionStatus: context.sessionManager.getSessionStatus(),
          accountAddress: null,
          chainId: networkConfig.chainId,
          explorer: {
            chain: explorerBase,
            account: null,
          },
          tokenHoldings: [],
        };
      }

      if (!isAddress(session.accountAddress)) {
        throw new Error("session account address is invalid");
      }

      const accountAddress = session.accountAddress as Address;
      const reader = dependencies.createTokenListReader({
        chainId: networkConfig.chainId,
        rpcUrl: networkConfig.rpcUrl,
      });
      const rawTokenBalances = await reader.getTokenBalances(accountAddress);
      const normalizedTokenBalances = normalizeTokenBalances(rawTokenBalances);

      const tokenHoldings = [];
      for (const { tokenAddress, rawValue } of normalizedTokenBalances) {
        try {
          const metadata = await reader.getTokenMetadata(tokenAddress);
          tokenHoldings.push({
            tokenAddress,
            symbol: metadata.symbol,
            decimals: metadata.decimals,
            value: {
              raw: rawValue.toString(),
              formatted: formatUnits(rawValue, metadata.decimals),
            },
            explorer: {
              token: buildExplorerUrl(explorerBase, `/token/${tokenAddress}`),
              holder: buildExplorerUrl(explorerBase, `/token/${tokenAddress}?a=${accountAddress}`),
            },
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          context.logger.warn(`Skipping token ${tokenAddress}: ${message}`);
        }
      }

      return {
        connected: true,
        sessionStatus: context.sessionManager.getSessionStatus(),
        accountAddress,
        chainId: networkConfig.chainId,
        explorer: {
          chain: explorerBase,
          account: buildExplorerUrl(explorerBase, `/address/${accountAddress}`),
        },
        tokenHoldings,
      };
    },
  };
}

export const getTokenListTool = createGetTokenListTool();
