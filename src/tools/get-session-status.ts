import type { ToolHandler } from "./types.js";

export const getSessionStatusTool: ToolHandler = {
  name: "get_session_status",
  description: "Returns local AGW session status, expiry, and risk metadata.",
  inputSchema: {
    type: "object",
    properties: {},
  },
  handler: async (_params, context) => {
    const session = context.sessionManager.getSession();
    const status = context.sessionManager.getSessionStatus();

    return {
      status,
      active: status === "active",
      accountAddress: session?.accountAddress ?? null,
      chainId: session?.chainId ?? context.sessionManager.getChainId(),
      expiresAt: session?.expiresAt ?? null,
    };
  },
};
