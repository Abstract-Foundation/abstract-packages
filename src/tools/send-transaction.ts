import { canCallTargetWithData, canTransferNativeValue } from "../policies/validate.js";
import type { ToolHandler } from "./types.js";

export const sendTransactionTool: ToolHandler = {
  name: "send_transaction",
  description: "Sends an EVM transaction through AGW session keys (scaffold: not yet wired to AGW SDK).",
  inputSchema: {
    type: "object",
    properties: {
      to: { type: "string", description: "Target contract or EOA" },
      data: { type: "string", description: "Hex calldata" },
      value: { type: "string", description: "Wei value as decimal string", default: "0" },
    },
    required: ["to", "data"],
  },
  handler: async (params, context) => {
    if (typeof params.to !== "string") {
      throw new Error("to must be a string");
    }
    if (typeof params.data !== "string") {
      throw new Error("data must be a string");
    }

    const valueRaw = typeof params.value === "string" ? params.value : "0";
    if (!/^\d+$/.test(valueRaw)) {
      throw new Error("value must be a non-negative integer string");
    }
    const value = BigInt(valueRaw);

    const status = context.sessionManager.getSessionStatus();
    if (status !== "active") {
      throw new Error(`session must be active (current status: ${status})`);
    }

    const session = context.sessionManager.getSession();
    if (!session) {
      throw new Error("session is missing");
    }

    if (!canCallTargetWithData(session.sessionConfig, params.to, params.data)) {
      throw new Error("transaction rejected: call policy does not allow this target/selector");
    }

    if (!canTransferNativeValue(session.sessionConfig, value)) {
      throw new Error("transaction rejected: transfer policy does not allow this value");
    }

    return {
      ok: false,
      executionRisk: "state_change",
      status: "not_implemented",
      nextStep: "Integrate AGW createSessionClient().sendTransaction() with policy checks",
    };
  },
};
