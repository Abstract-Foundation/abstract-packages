import { abstract, abstractTestnet } from "viem/chains";
import { SUPPORTED_CHAIN_IDS } from "./config";

export type SupportedChainId = (typeof SUPPORTED_CHAIN_IDS)[number];

export function isSupportedChainId(
  chainId: number,
): chainId is SupportedChainId {
  return SUPPORTED_CHAIN_IDS.includes(chainId as SupportedChainId);
}

export function resolveChain(chainId: SupportedChainId) {
  if (chainId === 11124) {
    return abstractTestnet;
  }
  return abstract;
}
