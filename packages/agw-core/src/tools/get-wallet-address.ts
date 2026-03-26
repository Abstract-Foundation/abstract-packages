import type { ToolHandler } from "./types.js";

export const getWalletAddressTool: ToolHandler = {
  name: "get_wallet_address",
  description: "Returns the AGW account address currently loaded in local session storage.",
  inputSchema: {
    type: "object",
    properties: {},
  },
  handler: async (_params, context) => {
    const session = context.sessionManager.getSession();
    if (!session) {
      return {
        connected: false,
        sessionStatus: "missing",
      };
    }

    return {
      connected: true,
      accountAddress: session.accountAddress,
      chainId: session.chainId,
      sessionStatus: context.sessionManager.getSessionStatus(),
    };
  },
};
