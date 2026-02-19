import { type Abi, type Address } from "viem";
import { abstract } from "viem/chains";
import { createAgwActionAdapter } from "../agw/actions.js";
import { resolveNetworkConfig } from "../config/network.js";
import { buildExplorerUrl } from "../utils/explorer.js";
import type { ToolHandler } from "./types.js";

function parseExecute(value: unknown): boolean {
  if (value === undefined) {
    return false;
  }
  if (typeof value !== "boolean") {
    throw new Error("execute must be a boolean");
  }
  return value;
}

function assertAbi(value: unknown): Abi {
  if (!Array.isArray(value)) {
    throw new Error("abi must be an array");
  }
  return value as Abi;
}

function assertBytecode(value: unknown): `0x${string}` {
  if (typeof value !== "string" || !/^0x[0-9a-fA-F]+$/.test(value) || value.length % 2 !== 0) {
    throw new Error("bytecode must be a 0x-prefixed hex string with even length");
  }
  return value as `0x${string}`;
}

export const deployContractTool: ToolHandler = {
  name: "deploy_contract",
  description: "Deploys a contract through AGW deployContract action with ABI+bytecode validation.",
  inputSchema: {
    type: "object",
    properties: {
      abi: { type: "array", description: "Constructor ABI fragment" },
      bytecode: { type: "string", description: "Contract bytecode (0x-prefixed hex)" },
      execute: { type: "boolean", description: "Broadcast deployment when true", default: false },
    },
    required: ["abi", "bytecode"],
  },
  handler: async (params, context) => {
    const abi = assertAbi(params.abi);
    const bytecode = assertBytecode(params.bytecode);
    const execute = parseExecute(params.execute);

    const status = context.sessionManager.getSessionStatus();
    if (status !== "active") {
      throw new Error(`session must be active (current status: ${status})`);
    }

    const session = context.sessionManager.getSession();
    if (!session) {
      throw new Error("session is missing");
    }

    if (!execute) {
      return {
        preview: true,
        execute: false,
        requiresExplicitExecute: true,
        accountAddress: session.accountAddress,
        chainId: session.chainId,
        deployment: {
          abiLength: abi.length,
          bytecodeLength: bytecode.length,
        },
      };
    }

    const networkConfig = resolveNetworkConfig({ chainId: session.chainId });
    if (session.chainId === abstract.id) {
      throw new Error("deploy rejected: mainnet deploy preflight is not supported; use testnet or explicit manual flow");
    }

    const sessionClient = context.sessionManager.createSessionClient({
      chain: networkConfig.chain,
      rpcUrl: networkConfig.rpcUrl,
    });
    const agwActions = createAgwActionAdapter(sessionClient);

    const txHash = await agwActions.deployContract({
      account: session.accountAddress as Address,
      chain: undefined,
      abi,
      bytecode,
    });

    const explorerBase = networkConfig.chain.blockExplorers?.default?.url ?? null;
    return {
      execute: true,
      txHash,
      accountAddress: session.accountAddress,
      chainId: session.chainId,
      explorer: {
        chain: explorerBase,
        transaction: buildExplorerUrl(explorerBase, `/tx/${txHash}`),
      },
    };
  },
};
