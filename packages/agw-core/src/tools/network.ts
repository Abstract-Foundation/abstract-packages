import {
  type ResolvedNetworkConfig,
  resolveNetworkConfig,
} from "../config/network.js";
import type { ToolContext } from "./types.js";

export function resolveToolNetworkConfig(
  context: ToolContext,
  chainId: number,
): ResolvedNetworkConfig {
  const manager = context.sessionManager as unknown as {
    getNetworkConfig?: (id?: number) => ResolvedNetworkConfig;
  };

  if (typeof manager.getNetworkConfig === "function") {
    return manager.getNetworkConfig(chainId);
  }

  return resolveNetworkConfig({ chainId });
}
