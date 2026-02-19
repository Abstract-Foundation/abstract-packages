import { isAddress } from "viem";
import { createAgwActionAdapter } from "../agw/actions.js";
import { resolveNetworkConfig } from "../config/network.js";
import type { ToolHandler } from "./types.js";

function resolvePolicySignerAddress(sessionConfig: Record<string, unknown>): string {
  const signer = sessionConfig.signer;
  if (typeof signer !== "string" || !isAddress(signer)) {
    throw new Error("message signing rejected: session policy signer is invalid");
  }

  return signer;
}

export const signMessageTool: ToolHandler = {
  name: "sign_message",
  description: "Signs a UTF-8 message using the active AGW session signer.",
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

    const session = context.sessionManager.getSession();
    if (!session) {
      throw new Error("session is missing");
    }

    const signerAddress = resolvePolicySignerAddress(session.sessionConfig);
    const networkConfig = resolveNetworkConfig({ chainId: session.chainId });
    const sessionClient = context.sessionManager.createSessionClient({
      chain: networkConfig.chain,
      rpcUrl: networkConfig.rpcUrl,
    });
    const agwActions = createAgwActionAdapter(sessionClient);
    const signature = await agwActions.signMessage({ message: params.message });

    return {
      signature,
      message: params.message,
      signerAddress,
      accountAddress: session.accountAddress,
    };
  },
};
