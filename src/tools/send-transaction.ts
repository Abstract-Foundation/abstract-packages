import { isAddress, type Address, type Hex } from "viem";
import { createAgwActionAdapter } from "../agw/actions.js";
import { canCallTargetWithData, canTransferNativeValue } from "../policies/validate.js";
import { assertMainnetPolicyRegistryPreflight } from "../session/mainnet-preflight.js";
import { buildExplorerUrl } from "../utils/explorer.js";
import { resolveToolNetworkConfig } from "./network.js";
import type { ToolHandler } from "./types.js";

const HEX_DATA_PATTERN = /^0x[0-9a-fA-F]*$/;

function parseValue(value: unknown): string {
  const parsed = typeof value === "string" ? value : "0";
  if (!/^\d+$/.test(parsed)) {
    throw new Error("value must be a non-negative integer string");
  }
  return parsed;
}

function parseExecute(execute: unknown): boolean {
  if (execute === undefined) {
    return false;
  }

  if (typeof execute !== "boolean") {
    throw new Error("execute must be a boolean");
  }

  return execute;
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

export const sendTransactionTool: ToolHandler = {
  name: "send_transaction",
  description:
    "Sends an EVM transaction through AGW session keys. Defaults to preview mode; set execute=true to broadcast.",
  inputSchema: {
    type: "object",
    properties: {
      to: { type: "string", description: "Target contract or EOA" },
      data: { type: "string", description: "Hex calldata" },
      value: { type: "string", description: "Wei value as decimal string", default: "0" },
      execute: { type: "boolean", description: "Broadcast when true; preview only when omitted/false", default: false },
    },
    required: ["to", "data"],
  },
  handler: async (params, context) => {
    const to = assertAddress(params.to, "to");
    const data = assertHexData(params.data);
    const valueRaw = parseValue(params.value);
    const value = BigInt(valueRaw);
    const execute = parseExecute(params.execute);

    const status = context.sessionManager.getSessionStatus();
    if (status !== "active") {
      throw new Error(`session must be active (current status: ${status})`);
    }

    const session = context.sessionManager.getSession();
    if (!session) {
      throw new Error("session is missing");
    }

    if (!canCallTargetWithData(session.sessionConfig, to, data)) {
      throw new Error("transaction rejected: call policy does not allow this target/selector");
    }

    if (!canTransferNativeValue(session.sessionConfig, value)) {
      throw new Error("transaction rejected: transfer policy does not allow this value");
    }

    if (!execute) {
      return {
        broadcast: false,
        preview: true,
        executionRisk: "state_change",
        requiresExplicitExecute: true,
        accountAddress: session.accountAddress,
        chainId: session.chainId,
        transaction: {
          to,
          data,
          value: valueRaw,
        },
      };
    }

    const networkConfig = resolveToolNetworkConfig(context, session.chainId);
    await assertMainnetPolicyRegistryPreflight({
      chainId: session.chainId,
      to,
      data,
      value,
      rpcUrl: networkConfig.rpcUrl,
    });

    const sessionClient = context.sessionManager.createSessionClient({
      chain: networkConfig.chain,
      rpcUrl: networkConfig.rpcUrl,
    });
    const agwActions = createAgwActionAdapter(sessionClient);

    const txHash = await agwActions.sendTransaction({
      account: session.accountAddress as Address,
      chain: undefined,
      to,
      data,
      value,
    });

    const explorerBase = networkConfig.chain.blockExplorers?.default?.url ?? null;

    return {
      broadcast: true,
      txHash,
      accountAddress: session.accountAddress,
      chainId: session.chainId,
      explorer: {
        chain: explorerBase,
        transaction: buildExplorerUrl(explorerBase, `/tx/${txHash}`),
      },
      transaction: {
        to,
        data,
        value: valueRaw,
      },
    };
  },
};
