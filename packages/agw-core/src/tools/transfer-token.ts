import { type Address, erc20Abi, isAddress, zeroAddress } from "viem";
import { buildExplorerUrl } from "../utils/explorer.js";
import { assertToolCapability } from "./capability-guard.js";
import { resolveToolNetworkConfig } from "./network.js";
import type { ToolHandler } from "./types.js";

function assertAddress(value: unknown, field: string): Address {
  if (typeof value !== "string" || !isAddress(value)) {
    throw new Error(`${field} must be a valid 0x-prefixed address`);
  }
  return value;
}

function parseAmount(value: unknown): string {
  if (typeof value !== "string" || !/^\d+$/.test(value)) {
    throw new Error("amount must be a non-negative integer string");
  }
  if (value === "0") {
    throw new Error("amount must be greater than zero");
  }
  return value;
}

function parseExecute(value: unknown): boolean {
  if (value === undefined) {
    return false;
  }
  if (typeof value !== "boolean") {
    throw new Error("execute must be a boolean");
  }
  return value;
}

export const transferTokenTool: ToolHandler = {
  name: "transfer_token",
  description:
    "Transfers native/ERC-20 tokens through the AGW wallet with optional execute mode.",
  inputSchema: {
    type: "object",
    properties: {
      to: { type: "string", description: "Recipient address" },
      amount: {
        type: "string",
        description: "Transfer amount in base units (decimal string)",
      },
      tokenAddress: {
        type: "string",
        description:
          "Token contract address (omit or use zero address for native transfer)",
      },
      execute: {
        type: "boolean",
        description:
          "Broadcast transaction when true; preview only when omitted/false",
        default: false,
      },
    },
    required: ["to", "amount"],
  },
  handler: async (params, context) => {
    assertToolCapability(context, "transfer_token");

    const to = assertAddress(params.to, "to");
    const amountRaw = parseAmount(params.amount);
    const amount = BigInt(amountRaw);
    const tokenAddress =
      params.tokenAddress === undefined
        ? zeroAddress
        : assertAddress(params.tokenAddress, "tokenAddress");
    const isNativeTransfer = tokenAddress.toLowerCase() === zeroAddress;
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
        broadcast: false,
        requiresExplicitExecute: true,
        accountAddress: session.accountAddress,
        chainId: session.chainId,
        transfer: {
          tokenAddress: isNativeTransfer ? zeroAddress : tokenAddress,
          to,
          amount: amountRaw,
          type: isNativeTransfer ? "native" : "erc20",
        },
      };
    }

    const abstractClient = await context.sessionManager.getAbstractClient();

    const txHash = isNativeTransfer
      ? await abstractClient.sendTransaction({ to, data: "0x", value: amount })
      : await abstractClient.writeContract({
          address: tokenAddress,
          abi: erc20Abi,
          functionName: "transfer",
          args: [to, amount],
        } as never);

    const networkConfig = resolveToolNetworkConfig(context, session.chainId);
    const explorerBase =
      networkConfig.chain.blockExplorers?.default?.url ?? null;

    return {
      broadcast: true,
      txHash,
      accountAddress: session.accountAddress,
      chainId: session.chainId,
      transfer: {
        tokenAddress: isNativeTransfer ? zeroAddress : tokenAddress,
        to,
        amount: amountRaw,
        type: isNativeTransfer ? "native" : "erc20",
      },
      explorer: {
        chain: explorerBase,
        transaction: buildExplorerUrl(explorerBase, `/tx/${txHash}`),
      },
    };
  },
};
