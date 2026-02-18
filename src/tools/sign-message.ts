import type { ToolHandler } from "./types.js";

export const signMessageTool: ToolHandler = {
  name: "sign_message",
  description: "Signs a message using AGW session delegation (scaffold: not yet wired to AGW SDK).",
  inputSchema: {
    type: "object",
    properties: {
      message: {
        type: "string",
        description: "UTF-8 message to sign",
      },
    },
    required: ["message"],
  },
  handler: async (params, context) => {
    if (typeof params.message !== "string") {
      throw new Error("message must be a string");
    }

    const status = context.sessionManager.getSessionStatus();
    if (status !== "active") {
      throw new Error(`session must be active (current status: ${status})`);
    }

    return {
      ok: false,
      status: "not_implemented",
      nextStep: "Integrate AGW createSessionClient().signMessage()",
    };
  },
};
