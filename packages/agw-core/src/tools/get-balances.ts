import {
  type Address,
  createPublicClient,
  erc20Abi,
  formatUnits,
  http,
  isAddress,
} from "viem";
import { resolveNetworkConfig } from "../config/network.js";
import { buildExplorerUrl } from "../utils/explorer.js";
import { resolveToolNetworkConfig } from "./network.js";
import type { ToolHandler } from "./types.js";

export interface CreateBalanceReaderInput {
  chainId: number;
  rpcUrl?: string;
}

export interface BalanceReader {
  getNativeBalance: (accountAddress: Address) => Promise<bigint>;
  getTokenBalance: (
    tokenAddress: Address,
    accountAddress: Address,
  ) => Promise<bigint>;
  getTokenDecimals: (tokenAddress: Address) => Promise<number>;
  getTokenSymbol: (tokenAddress: Address) => Promise<string>;
}

export interface GetBalancesToolDependencies {
  createBalanceReader: (input: CreateBalanceReaderInput) => BalanceReader;
}

function createDefaultBalanceReader(
  input: CreateBalanceReaderInput,
): BalanceReader {
  const networkConfig = resolveNetworkConfig({
    chainId: input.chainId,
    rpcUrl: input.rpcUrl,
  });

  const publicClient = createPublicClient({
    chain: networkConfig.chain,
    transport: http(networkConfig.rpcUrl),
  });

  return {
    getNativeBalance: (accountAddress) =>
      publicClient.getBalance({ address: accountAddress }),
    getTokenBalance: async (tokenAddress, accountAddress) => {
      const balance = await publicClient.readContract({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [accountAddress],
      });

      return balance as bigint;
    },
    getTokenDecimals: async (tokenAddress) => {
      const decimals = await publicClient.readContract({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: "decimals",
      });

      if (typeof decimals !== "number") {
        throw new Error(
          `token ${tokenAddress} returned a non-numeric decimals value`,
        );
      }

      return decimals;
    },
    getTokenSymbol: async (tokenAddress) => {
      const symbol = await publicClient.readContract({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: "symbol",
      });

      if (typeof symbol === "string") {
        return symbol;
      }

      throw new Error(
        `token ${tokenAddress} returned a non-string symbol value`,
      );
    },
  };
}

function normalizeTokenAddresses(value: unknown): Address[] {
  if (value === undefined) {
    return [];
  }

  if (!Array.isArray(value)) {
    throw new Error(
      "tokenAddresses must be an array of token contract addresses",
    );
  }

  const seen = new Set<string>();
  const normalized: Address[] = [];

  for (const [index, entry] of value.entries()) {
    if (typeof entry !== "string" || !isAddress(entry, { strict: false })) {
      throw new Error(
        `tokenAddresses[${index}] must be a valid 0x-prefixed address`,
      );
    }

    const dedupeKey = entry.toLowerCase();
    if (seen.has(dedupeKey)) {
      continue;
    }

    seen.add(dedupeKey);
    normalized.push(entry as Address);
  }

  return normalized;
}

export function createGetBalancesTool(
  dependencies: GetBalancesToolDependencies = {
    createBalanceReader: createDefaultBalanceReader,
  },
): ToolHandler {
  return {
    name: "get_balances",
    description:
      "Returns normalized native and ERC-20 balances for the AGW account in local session storage.",
    inputSchema: {
      type: "object",
      properties: {
        tokenAddresses: {
          type: "array",
          description:
            "Optional ERC-20 token contract addresses to query in addition to native balance.",
          items: {
            type: "string",
          },
        },
      },
    },
    handler: async (params, context) => {
      const session = context.sessionManager.getSession();
      const chainId = session?.chainId ?? context.sessionManager.getChainId();
      const networkConfig = resolveToolNetworkConfig(context, chainId);
      const explorerBase =
        networkConfig.chain.blockExplorers?.default?.url ?? null;

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
          nativeBalance: null,
          tokenBalances: [],
        };
      }

      if (!isAddress(session.accountAddress)) {
        throw new Error("session account address is invalid");
      }

      const tokenAddresses = normalizeTokenAddresses(params.tokenAddresses);
      const accountAddress = session.accountAddress as Address;
      const nativeDecimals = networkConfig.chain.nativeCurrency.decimals;
      const reader = dependencies.createBalanceReader({
        chainId: networkConfig.chainId,
        rpcUrl: networkConfig.rpcUrl,
      });

      const nativeBalanceRaw = await reader.getNativeBalance(accountAddress);

      const tokenBalances = await Promise.all(
        tokenAddresses.map(async (tokenAddress) => {
          const [rawBalance, decimals, symbol] = await Promise.all([
            reader.getTokenBalance(tokenAddress, accountAddress),
            reader.getTokenDecimals(tokenAddress),
            reader.getTokenSymbol(tokenAddress),
          ]);

          return {
            tokenAddress,
            symbol,
            decimals,
            amount: {
              raw: rawBalance.toString(),
              formatted: formatUnits(rawBalance, decimals),
            },
            explorer: {
              token: buildExplorerUrl(explorerBase, `/token/${tokenAddress}`),
              holder: buildExplorerUrl(
                explorerBase,
                `/token/${tokenAddress}?a=${accountAddress}`,
              ),
            },
          };
        }),
      );

      return {
        connected: true,
        sessionStatus: context.sessionManager.getSessionStatus(),
        accountAddress,
        chainId: networkConfig.chainId,
        explorer: {
          chain: explorerBase,
          account: buildExplorerUrl(explorerBase, `/address/${accountAddress}`),
        },
        nativeBalance: {
          symbol: networkConfig.chain.nativeCurrency.symbol,
          decimals: nativeDecimals,
          amount: {
            raw: nativeBalanceRaw.toString(),
            formatted: formatUnits(nativeBalanceRaw, nativeDecimals),
          },
        },
        tokenBalances,
      };
    },
  };
}

export const getBalancesTool = createGetBalancesTool();
