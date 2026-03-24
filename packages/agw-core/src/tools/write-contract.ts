import { createPublicClient, encodeFunctionData, http, isAddress, type Abi, type AbiFunction, type Address } from "viem";
import { buildExplorerUrl } from "../utils/explorer.js";
import { assertToolCapability } from "./capability-guard.js";
import { resolveToolNetworkConfig } from "./network.js";
import type { ToolHandler } from "./types.js";

function isViewOrPure(abi: Abi, functionName: string): boolean {
  const fn = abi.find(
    (item): item is AbiFunction =>
      item.type === "function" && item.name === functionName,
  );
  return fn?.stateMutability === "view" || fn?.stateMutability === "pure";
}

function assertAddress(value: unknown, field: string): Address {
  if (typeof value !== "string" || !isAddress(value)) {
    throw new Error(`${field} must be a valid 0x-prefixed address`);
  }

  return value;
}

function assertAbi(value: unknown): Abi {
  if (!Array.isArray(value)) {
    throw new Error("abi must be an array");
  }

  return value as Abi;
}

function assertArgs(value: unknown): readonly unknown[] | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (!Array.isArray(value)) {
    throw new Error("args must be an array when provided");
  }

  return value;
}

function parseValue(value: unknown): string {
  const parsed = typeof value === "string" ? value : "0";
  if (!/^\d+$/.test(parsed)) {
    throw new Error("value must be a non-negative integer string");
  }

  return parsed;
}

export const writeContractTool: ToolHandler = {
  name: "write_contract",
  description: "Writes to a contract through the AGW wallet.",
  inputSchema: {
    type: "object",
    properties: {
      address: { type: "string", description: "Contract address" },
      abi: { type: "array", description: "Contract ABI fragment" },
      functionName: { type: "string", description: "Function name" },
      args: { type: "array", description: "Function args array" },
      value: { type: "string", description: "Wei value as decimal string", default: "0" },
    },
    required: ["address", "abi", "functionName"],
  },
  handler: async (params, context) => {
    assertToolCapability(context, "write_contract");

    const address = assertAddress(params.address, "address");
    const abi = assertAbi(params.abi);

    if (typeof params.functionName !== "string") {
      throw new Error("functionName must be a string");
    }

    const functionName = params.functionName;
    const args = assertArgs(params.args);
    const valueRaw = parseValue(params.value);
    const value = BigInt(valueRaw);

    try {
      encodeFunctionData({
        abi,
        functionName,
        args,
      } as never);
    } catch {
      throw new Error("invalid abi/functionName/args payload");
    }

    const session = context.sessionManager.getSession();
    if (!session) {
      throw new Error("session is missing");
    }

    const networkConfig = resolveToolNetworkConfig(context, session.chainId);

    if (isViewOrPure(abi, functionName)) {
      const publicClient = createPublicClient({
        chain: networkConfig.chain,
        transport: http(networkConfig.rpcUrl),
      });

      const result = await publicClient.readContract({
        address,
        abi,
        functionName,
        args,
      } as never);

      return {
        result,
        accountAddress: session.accountAddress,
        chainId: session.chainId,
        contract: { address, functionName, args: args ?? [] },
      };
    }

    const status = context.sessionManager.getSessionStatus();
    if (status !== "active") {
      throw new Error(`session must be active (current status: ${status})`);
    }

    const abstractClient = await context.sessionManager.getAbstractClient();
    const txHash = await abstractClient.writeContract({
      address,
      abi,
      functionName,
      args,
      value,
    } as never);

    const explorerBase = networkConfig.chain.blockExplorers?.default?.url ?? null;

    return {
      txHash,
      accountAddress: session.accountAddress,
      chainId: session.chainId,
      explorer: {
        chain: explorerBase,
        transaction: buildExplorerUrl(explorerBase, `/tx/${txHash}`),
      },
      contract: {
        address,
        functionName,
        args: args ?? [],
        value: valueRaw,
      },
    };
  },
};
