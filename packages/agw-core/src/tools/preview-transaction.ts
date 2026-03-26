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

function resolveSelector(data: Hex): string | null {
  if (data.length < 10) {
    return null;
  }

  return data.slice(0, 10).toLowerCase();
}

function buildImpactSummary(
  to: Address,
  selector: string | null,
  valueRaw: string,
  value: bigint,
): string {
  const callPart = selector
    ? `Calls selector ${selector} on ${to}`
    : `Calls ${to} with custom calldata`;
  const valuePart =
    value > 0n ? `transfers ${valueRaw} wei` : "transfers no native value";

  return `${callPart} and ${valuePart}.`;
}

function buildImpactLabels(
  to: Address,
  selector: string | null,
  valueRaw: string,
  value: bigint,
): string[] {
  const labels: string[] = [];
  if (selector) {
    labels.push(`Calls selector ${selector}`);
  } else {
    labels.push("Uses calldata without a standard 4-byte selector");
  }
  labels.push(`Targets ${to}`);
  labels.push(value > 0n ? `Transfers ${valueRaw} wei` : "Transfers 0 wei");
  return labels;
}

function resolveRiskLevel(data: Hex, value: bigint): "low" | "medium" | "high" {
  if (data !== "0x" && value > 0n) {
    return "high";
  }
  if (data !== "0x" || value > 0n) {
    return "medium";
  }
  return "low";
}

function buildRiskLabels(data: Hex, value: bigint): string[] {
  const labels: string[] = [];
  if (data !== "0x") {
    labels.push("Contract call may change state");
  }
  if (value > 0n) {
    labels.push("Native value transfer increases financial exposure");
  }
  if (labels.length === 0) {
    labels.push("No material execution risk detected");
  }
  return labels;
}

export const previewTransactionTool: ToolHandler = {
  name: "preview_transaction",
  description:
    "Previews transaction impact and risk labels without signing or broadcasting.",
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
    assertToolCapability(context, "preview_transaction");

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

    const selector = resolveSelector(data);

    return {
      preview: true,
      accountAddress: session.accountAddress,
      chainId: session.chainId,
      transaction: {
        to,
        data,
        value: valueRaw,
      },
      impact: {
        summary: buildImpactSummary(to, selector, valueRaw, value),
        labels: buildImpactLabels(to, selector, valueRaw, value),
      },
      risk: {
        level: resolveRiskLevel(data, value),
        labels: buildRiskLabels(data, value),
      },
    };
  },
};
