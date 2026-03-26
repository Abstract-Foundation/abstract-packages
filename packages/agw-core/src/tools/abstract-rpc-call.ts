import { callAbstractRpc, getAllowedMethods } from "../integrations/abstract-rpc/client.js";
import { resolveToolNetworkConfig } from "./network.js";
import type { ToolHandler } from "./types.js";

export const abstractRpcCallTool: ToolHandler = {
  name: "abstract_rpc_call",
  description:
    "Call supported Abstract JSON-RPC methods in this build (no sendRawTransaction/debug/pubsub/filter lifecycle).",
  inputSchema: {
    type: "object",
    properties: {
      method: { type: "string", description: "JSON-RPC method name." },
      params: { type: "array", description: "JSON-RPC params array." },
    },
    required: ["method"],
  },
  handler: async (params, context) => {
    if (typeof params.method !== "string" || params.method.trim().length === 0) {
      throw new Error("method is required.");
    }

    if (params.params !== undefined && !Array.isArray(params.params)) {
      throw new Error("params must be an array when provided.");
    }

    const networkConfig = resolveToolNetworkConfig(context, context.sessionManager.getChainId());
    if (!networkConfig.rpcUrl) {
      throw new Error("No RPC URL is configured for the selected chain.");
    }

    const result = await callAbstractRpc({
      rpcUrl: networkConfig.rpcUrl,
      method: params.method,
      params: params.params,
    });

    return {
      method: params.method,
      chainId: networkConfig.chainId,
      rpcUrl: networkConfig.rpcUrl,
      result: result.result,
      allowedMethods: getAllowedMethods(),
    };
  },
};
