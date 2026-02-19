import { sessionKeyValidatorAddress } from "@abstract-foundation/agw-client/constants";
import { SessionKeyValidatorAbi, getSessionHash, type SessionConfig } from "@abstract-foundation/agw-client/sessions";
import { encodeFunctionData, type Address, type Hash } from "viem";
import { createAgwActionAdapter } from "../agw/actions.js";
import { resolveNetworkConfig } from "../config/network.js";
import { assertMainnetPolicyRegistryPreflight } from "../session/mainnet-preflight.js";
import { buildExplorerUrl } from "../utils/explorer.js";
import type { ToolHandler } from "./types.js";

function deriveSessionHash(sessionConfig: Record<string, unknown>): Hash {
  try {
    return getSessionHash(sessionConfig as unknown as SessionConfig);
  } catch {
    throw new Error("revoke rejected: session config is not compatible with AGW session hashing");
  }
}

export const revokeSessionTool: ToolHandler = {
  name: "revoke_session",
  description: "Revokes the active AGW session key and invalidates the local session immediately.",
  inputSchema: {
    type: "object",
    properties: {},
  },
  handler: async (_params, context) => {
    const status = context.sessionManager.getSessionStatus();
    if (status !== "active") {
      throw new Error(`session must be active (current status: ${status})`);
    }

    const session = context.sessionManager.getSession();
    if (!session) {
      throw new Error("session is missing");
    }

    const sessionHash = deriveSessionHash(session.sessionConfig);
    const networkConfig = resolveNetworkConfig({ chainId: session.chainId });
    const data = encodeFunctionData({
      abi: SessionKeyValidatorAbi,
      functionName: "revokeKeys",
      args: [[sessionHash]],
    });
    await assertMainnetPolicyRegistryPreflight({
      chainId: session.chainId,
      to: sessionKeyValidatorAddress,
      data,
      value: 0n,
      rpcUrl: networkConfig.rpcUrl,
    });

    const sessionClient = context.sessionManager.createSessionClient({
      chain: networkConfig.chain,
      rpcUrl: networkConfig.rpcUrl,
    });
    const agwActions = createAgwActionAdapter(sessionClient);

    const transactionHash = await agwActions.writeContract({
      account: session.accountAddress as Address,
      chain: undefined,
      address: sessionKeyValidatorAddress,
      abi: SessionKeyValidatorAbi,
      functionName: "revokeKeys",
      args: [[sessionHash]],
    } as never);

    context.sessionManager.markSessionRevoked();

    return {
      revoked: true,
      transactionHash,
      sessionHash,
      accountAddress: session.accountAddress,
      chainId: session.chainId,
      explorer: {
        chain: networkConfig.chain.blockExplorers?.default?.url ?? null,
        transaction: buildExplorerUrl(networkConfig.chain.blockExplorers?.default?.url ?? null, `/tx/${transactionHash}`),
      },
      localStatus: context.sessionManager.getSessionStatus(),
    };
  },
};
