import { assertToolCapability } from "./capability-guard.js";
import type { ToolHandler } from "./types.js";

export const signMessageTool: ToolHandler = {
  name: "sign_message",
  description: "Signs a UTF-8 message using the AGW wallet signer.",
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
    assertToolCapability(context, "sign_message");

    if (typeof params.message !== "string") {
      throw new Error("message must be a string");
    }

    const status = context.sessionManager.getSessionStatus();
    if (status !== "active") {
      throw new Error(`session must be active (current status: ${status})`);
    }

    const session = context.sessionManager.getSession();
    if (!session) {
      throw new Error("session is missing");
    }

    const abstractClient = await context.sessionManager.getAbstractClient();
    const signature = await abstractClient.signMessage({ message: params.message });

    return {
      signature,
      message: params.message,
      accountAddress: session.accountAddress,
    };
  },
};
