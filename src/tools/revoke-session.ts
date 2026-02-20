import { revokeSessionOnchain } from "../session/revoke.js";
import { buildExplorerUrl } from "../utils/explorer.js";
import { resolveToolNetworkConfig } from "./network.js";
import type { ToolHandler } from "./types.js";

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

    const networkConfig = resolveToolNetworkConfig(context, session.chainId);
    const { sessionHash, transactionHash } = await revokeSessionOnchain(session, {
      rpcUrl: networkConfig.rpcUrl,
    });

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
