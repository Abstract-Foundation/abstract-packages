import { type Address, type Hex, isAddress } from "viem";
import { assertToolCapability } from "./capability-guard.js";
import type { ToolHandler } from "./types.js";

const HEX_DATA_PATTERN = /^0x[0-9a-fA-F]*$/;

function parseValue(value: unknown): string {
  const parsed = typeof value === "string" ? value : "0";
  if (!/^\d+$/.test(parsed)) {
    throw new Error("value must be a non-negative integer string");
  }
  return parsed;
}

function assertHexData(data: unknown): Hex {
  if (typeof data !== "string") {
    throw new Error("data must be a hex string");
  }

  if (!HEX_DATA_PATTERN.test(data) || data.length % 2 !== 0) {
    throw new Error("data must be a 0x-prefixed hex string with even length");
  }

  return data as Hex;
}

function assertAddress(value: unknown, field: string): Address {
  if (typeof value !== "string" || !isAddress(value)) {
    throw new Error(`${field} must be a valid 0x-prefixed address`);
  }

  return value;
}

export const signTransactionTool: ToolHandler = {
  name: "sign_transaction",
  description:
    "Signs an EVM transaction through the AGW wallet and returns signed payload only (no broadcast).",
  inputSchema: {
    type: "object",
    properties: {
      to: { type: "string", description: "Target contract or EOA" },
      data: { type: "string", description: "Hex calldata" },
      value: {
        type: "string",
        description: "Wei value as decimal string",
        default: "0",
      },
    },
    required: ["to", "data"],
  },
  handler: async (params, context) => {
    assertToolCapability(context, "sign_transaction");

    const to = assertAddress(params.to, "to");
    const data = assertHexData(params.data);
    const valueRaw = parseValue(params.value);
    const value = BigInt(valueRaw);

    const status = context.sessionManager.getSessionStatus();
    if (status !== "active") {
      throw new Error(`session must be active (current status: ${status})`);
    }

    const session = context.sessionManager.getSession();
    if (!session) {
      throw new Error("session is missing");
    }

    const abstractClient = await context.sessionManager.getAbstractClient();
    const signedPayload = await abstractClient.signTransaction({
      to,
      data,
      value,
    });

    return {
      signedPayload,
      broadcast: false,
      accountAddress: session.accountAddress,
      chainId: session.chainId,
      transaction: {
        to,
        data,
        value: valueRaw,
      },
    };
  },
};
