import { abstract, abstractTestnet, type ChainEIP712 } from "viem/chains";

const CHAIN_ID_ENV_KEYS = ["AGW_CHAIN_ID"] as const;
const RPC_URL_ENV_KEYS = ["AGW_RPC_URL"] as const;
const SUPPORTED_CHAINS: Record<number, ChainEIP712> = {
  [abstractTestnet.id]: abstractTestnet,
  [abstract.id]: abstract,
};

export const DEFAULT_CHAIN_ID = abstract.id;

export interface ResolveNetworkConfigInput {
  chainId?: number | string;
  rpcUrl?: string;
  env?: NodeJS.ProcessEnv;
}

export interface ResolvedNetworkConfig {
  chainId: number;
  chain: ChainEIP712;
  rpcUrl?: string;
}

function normalizeOptionalString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim();
  return normalized ? normalized : undefined;
}

function parseChainId(value: number | string, source: string): number {
  if (typeof value === "string" && !/^\d+$/.test(value.trim())) {
    throw new Error(`Invalid chain id from ${source}. Expected a positive integer.`);
  }

  const chainId = typeof value === "number" ? value : Number.parseInt(value, 10);
  if (!Number.isInteger(chainId) || chainId <= 0) {
    throw new Error(`Invalid chain id from ${source}. Expected a positive integer.`);
  }

  return chainId;
}

function resolveEnvValue(env: NodeJS.ProcessEnv, keys: readonly string[]): string | undefined {
  for (const key of keys) {
    const value = normalizeOptionalString(env[key]);
    if (value) {
      return value;
    }
  }

  return undefined;
}

function resolveChain(chainId: number): ChainEIP712 {
  const chain = SUPPORTED_CHAINS[chainId];
  if (chain) {
    return chain;
  }

  const supported = Object.keys(SUPPORTED_CHAINS)
    .map(value => Number.parseInt(value, 10))
    .sort((a, b) => a - b)
    .join(", ");

  throw new Error(`Unsupported chain id: ${chainId}. Supported chain ids: ${supported}.`);
}

function getDefaultRpcUrl(chain: ChainEIP712): string | undefined {
  const [defaultRpcUrl] = chain.rpcUrls.default.http;
  return defaultRpcUrl;
}

export function resolveNetworkConfig(input: ResolveNetworkConfigInput = {}): ResolvedNetworkConfig {
  const env = input.env ?? process.env;

  const chainIdFromCli = input.chainId === undefined ? undefined : parseChainId(input.chainId, "--chain-id");
  const chainIdFromEnvRaw = resolveEnvValue(env, CHAIN_ID_ENV_KEYS);
  const chainIdFromEnv = chainIdFromEnvRaw === undefined ? undefined : parseChainId(chainIdFromEnvRaw, "environment");

  const chainId = chainIdFromCli ?? chainIdFromEnv ?? DEFAULT_CHAIN_ID;
  const chain = resolveChain(chainId);

  const rpcUrl = normalizeOptionalString(input.rpcUrl) ?? resolveEnvValue(env, RPC_URL_ENV_KEYS) ?? getDefaultRpcUrl(chain);

  return {
    chainId,
    chain,
    rpcUrl,
  };
}
