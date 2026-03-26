import { resolveNetworkConfig } from "../config/network.js";

export function getExplorerBaseUrl(chainId: number): string | null {
  const networkConfig = resolveNetworkConfig({ chainId });
  const baseUrl = networkConfig.chain.blockExplorers?.default?.url;
  return typeof baseUrl === "string" && baseUrl.trim()
    ? baseUrl.replace(/\/$/, "")
    : null;
}

export function buildExplorerUrl(
  baseUrl: string | null,
  suffix: string,
): string | null {
  if (!baseUrl) {
    return null;
  }

  return `${baseUrl.replace(/\/$/, "")}${suffix}`;
}

export function getAccountExplorerUrl(
  chainId: number,
  accountAddress: string,
): string | null {
  return buildExplorerUrl(
    getExplorerBaseUrl(chainId),
    `/address/${accountAddress}`,
  );
}

export function getTransactionExplorerUrl(
  chainId: number,
  txHash: string,
): string | null {
  return buildExplorerUrl(getExplorerBaseUrl(chainId), `/tx/${txHash}`);
}

export function getTokenExplorerUrl(
  chainId: number,
  tokenAddress: string,
): string | null {
  return buildExplorerUrl(
    getExplorerBaseUrl(chainId),
    `/token/${tokenAddress}`,
  );
}
