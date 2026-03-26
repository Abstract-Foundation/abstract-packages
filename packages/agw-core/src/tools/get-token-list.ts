import {
  createPublicClient,
  erc20Abi,
  formatUnits,
  getAddress,
  http,
  isAddress,
  parseAbiItem,
  type Address,
  type PublicClient,
} from "viem";
import { resolveNetworkConfig } from "../config/network.js";
import { buildExplorerUrl } from "../utils/explorer.js";
import { resolveToolNetworkConfig } from "./network.js";
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

const ERC20_TRANSFER_EVENT = parseAbiItem("event Transfer(address indexed from, address indexed to, uint256 value)");
const LOG_SCAN_MIN_CHUNK_SIZE = 50_000n;
const BALANCE_QUERY_CONCURRENCY = 8;
const METADATA_QUERY_CONCURRENCY = 8;

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

function isRpcMethodUnavailableError(error: unknown): boolean {
  const message = getErrorMessage(error).toLowerCase();
  return (
    message.includes("rpc method is not whitelisted") ||
    message.includes("method not found") ||
    (message.includes("code\":-32601") && message.includes("zks_getallaccountbalances"))
  );
}

function isLogRangeError(error: unknown): boolean {
  const message = getErrorMessage(error).toLowerCase();
  return (
    message.includes("too many results") ||
    message.includes("response size exceeded") ||
    message.includes("query timeout") ||
    message.includes("block range") ||
    message.includes("limit")
  );
}

async function getTransferLogsWithAdaptiveChunking(
  publicClient: PublicClient,
  latestBlock: bigint,
  args: { from?: Address; to?: Address },
) {
  if (latestBlock < 0n) {
    return [];
  }

  const logs: Awaited<ReturnType<PublicClient["getLogs"]>> = [];
  let chunkSize = latestBlock + 1n;
  let fromBlock = 0n;

  while (fromBlock <= latestBlock) {
    const toBlock = fromBlock + chunkSize - 1n > latestBlock ? latestBlock : fromBlock + chunkSize - 1n;

    try {
      const batch = await publicClient.getLogs({
        event: ERC20_TRANSFER_EVENT,
        args,
        fromBlock,
        toBlock,
      });
      logs.push(...batch);
      fromBlock = toBlock + 1n;
    } catch (error) {
      if (!isLogRangeError(error) || chunkSize <= LOG_SCAN_MIN_CHUNK_SIZE) {
        throw error;
      }

      chunkSize = chunkSize / 2n;
      if (chunkSize < LOG_SCAN_MIN_CHUNK_SIZE) {
        chunkSize = LOG_SCAN_MIN_CHUNK_SIZE;
      }
    }
  }

  return logs;
}

async function mapWithConcurrency<T, TResult>(
  values: T[],
  concurrency: number,
  mapper: (value: T) => Promise<TResult>,
): Promise<TResult[]> {
  if (values.length === 0) {
    return [];
  }

  const workerCount = Math.max(1, Math.min(concurrency, values.length));
  const results: TResult[] = new Array(values.length);
  let nextIndex = 0;

  const workers = Array.from({ length: workerCount }, async () => {
    while (nextIndex < values.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await mapper(values[index]);
    }
  });

  await Promise.all(workers);
  return results;
}

async function getTokenBalancesFromTransferLogs(publicClient: PublicClient, accountAddress: Address): Promise<Record<string, string>> {
  const normalizedAccount = getAddress(accountAddress);
  const latestBlock = await publicClient.getBlockNumber();

  const [incomingLogs, outgoingLogs] = await Promise.all([
    getTransferLogsWithAdaptiveChunking(publicClient, latestBlock, { to: normalizedAccount }),
    getTransferLogsWithAdaptiveChunking(publicClient, latestBlock, { from: normalizedAccount }),
  ]);

  const tokenAddresses = new Map<string, Address>();
  for (const log of [...incomingLogs, ...outgoingLogs]) {
    if (!isAddress(log.address, { strict: false })) {
      continue;
    }

    tokenAddresses.set(log.address.toLowerCase(), log.address as Address);
  }

  const tokenAddressList = Array.from(tokenAddresses.values());
  const balanceEntries = await mapWithConcurrency(tokenAddressList, BALANCE_QUERY_CONCURRENCY, async tokenAddress => {
    try {
      const rawBalance = await publicClient.readContract({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [normalizedAccount],
      });

      if (typeof rawBalance !== "bigint" || rawBalance <= 0n) {
        return null;
      }

      return {
        tokenAddress,
        rawBalance,
      };
    } catch {
      return null;
    }
  });

  const balances: Record<string, string> = {};
  for (const entry of balanceEntries) {
    if (!entry) {
      continue;
    }

    balances[entry.tokenAddress] = entry.rawBalance.toString();
  }

  return balances;
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
      try {
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
      } catch (error) {
        if (!isRpcMethodUnavailableError(error)) {
          throw error;
        }

        return getTokenBalancesFromTransferLogs(publicClient, accountAddress);
      }
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
      const networkConfig = resolveToolNetworkConfig(context, chainId);
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

      const tokenHoldings = (
        await mapWithConcurrency(normalizedTokenBalances, METADATA_QUERY_CONCURRENCY, async ({ tokenAddress, rawValue }) => {
          try {
            const metadata = await reader.getTokenMetadata(tokenAddress);
            return {
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
            };
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            context.logger.warn(`Skipping token ${tokenAddress}: ${message}`);
            return null;
          }
        })
      ).filter((entry): entry is NonNullable<typeof entry> => entry !== null);

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
