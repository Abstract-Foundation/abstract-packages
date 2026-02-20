import { encodeFunctionData, isAddress, type Abi, type Address } from "viem";
import { createAgwActionAdapter } from "../agw/actions.js";
import { canCallTargetWithData, canTransferNativeValue } from "../policies/validate.js";
import { assertMainnetPolicyRegistryPreflight } from "../session/mainnet-preflight.js";
import { buildExplorerUrl } from "../utils/explorer.js";
import { resolveToolNetworkConfig } from "./network.js";
import type { ToolHandler } from "./types.js";

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
  description: "Writes to a contract through AGW session keys.",
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
    const address = assertAddress(params.address, "address");
    const abi = assertAbi(params.abi);

    if (typeof params.functionName !== "string") {
      throw new Error("functionName must be a string");
    }

    const functionName = params.functionName;
    const args = assertArgs(params.args);
    const valueRaw = parseValue(params.value);
    const value = BigInt(valueRaw);

    let data: `0x${string}`;
    try {
      data = encodeFunctionData({
        abi,
        functionName,
        args,
      } as never);
    } catch {
      throw new Error("invalid abi/functionName/args payload");
    }

    const status = context.sessionManager.getSessionStatus();
    if (status !== "active") {
      throw new Error(`session must be active (current status: ${status})`);
    }

    const session = context.sessionManager.getSession();
    if (!session) {
      throw new Error("session is missing");
    }

    if (!canCallTargetWithData(session.sessionConfig, address, data)) {
      throw new Error("contract write rejected: call policy does not allow this target/selector");
    }

    if (!canTransferNativeValue(session.sessionConfig, value)) {
      throw new Error("contract write rejected: transfer policy does not allow this value");
    }

    const networkConfig = resolveToolNetworkConfig(context, session.chainId);
    await assertMainnetPolicyRegistryPreflight({
      chainId: session.chainId,
      to: address,
      data,
      value,
      rpcUrl: networkConfig.rpcUrl,
    });

    const sessionClient = context.sessionManager.createSessionClient({
      chain: networkConfig.chain,
      rpcUrl: networkConfig.rpcUrl,
    });
    const agwActions = createAgwActionAdapter(sessionClient);

    const txHash = await agwActions.writeContract({
      account: session.accountAddress as Address,
      chain: undefined,
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
