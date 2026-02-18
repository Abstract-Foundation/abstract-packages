import { canCallAddress } from "../policies/validate.js";
import type { ToolHandler } from "./types.js";

export const writeContractTool: ToolHandler = {
  name: "write_contract",
  description: "Writes to a contract through AGW session keys (scaffold: not yet wired to AGW SDK).",
  inputSchema: {
    type: "object",
    properties: {
      address: { type: "string", description: "Contract address" },
      abi: { type: "array", description: "Contract ABI fragment" },
      functionName: { type: "string", description: "Function name" },
      args: { type: "array", description: "Function args" },
    },
    required: ["address", "abi", "functionName"],
  },
  handler: async (params, context) => {
    if (typeof params.address !== "string") {
      throw new Error("address must be a string");
    }
    if (typeof params.functionName !== "string") {
      throw new Error("functionName must be a string");
    }

    const status = context.sessionManager.getSessionStatus();
    if (status !== "active") {
      throw new Error(`session must be active (current status: ${status})`);
    }

    const session = context.sessionManager.getSession();
    if (!session) {
      throw new Error("session is missing");
    }

    if (!canCallAddress(session.sessionConfig, params.address)) {
      throw new Error("contract write rejected: call policy does not allow this target");
    }

    return {
      ok: false,
      executionRisk: "state_change",
      status: "not_implemented",
      nextStep: "Integrate AGW writeContractForSession() or session client contract write flow",
    };
  },
};
