import { encodeFunctionData, erc20Abi, isAddress, zeroAddress, type Address } from "viem";
import { createAgwActionAdapter } from "../agw/actions.js";
import { resolveNetworkConfig } from "../config/network.js";
import { canCallTargetWithData, canTransferNativeValue, canTransferTokenValue } from "../policies/validate.js";
import { assertMainnetPolicyRegistryPreflight } from "../session/mainnet-preflight.js";
import { buildExplorerUrl } from "../utils/explorer.js";
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
  description: "Transfers native/ERC-20 tokens through AGW session keys with policy preflight and optional execute mode.",
  inputSchema: {
    type: "object",
    properties: {
      to: { type: "string", description: "Recipient address" },
      amount: { type: "string", description: "Transfer amount in base units (decimal string)" },
      tokenAddress: {
        type: "string",
        description: "Token contract address (omit or use zero address for native transfer)",
      },
      execute: {
        type: "boolean",
        description: "Broadcast transaction when true; preview only when omitted/false",
        default: false,
      },
    },
    required: ["to", "amount"],
  },
  handler: async (params, context) => {
    const to = assertAddress(params.to, "to");
    const amountRaw = parseAmount(params.amount);
    const amount = BigInt(amountRaw);
    const tokenAddress = params.tokenAddress === undefined ? zeroAddress : assertAddress(params.tokenAddress, "tokenAddress");
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

    let data: `0x${string}`;
    let value: bigint;
    if (isNativeTransfer) {
      data = "0x";
      value = amount;
      if (!canTransferNativeValue(session.sessionConfig, amount)) {
        throw new Error("token transfer rejected: transfer policy does not allow this native amount");
      }
    } else {
      data = encodeFunctionData({
        abi: erc20Abi,
        functionName: "transfer",
        args: [to, amount],
      });
      value = 0n;

      if (!canCallTargetWithData(session.sessionConfig, tokenAddress, data)) {
        throw new Error("token transfer rejected: call policy does not allow token transfer selector");
      }
      if (!canTransferTokenValue(session.sessionConfig, tokenAddress, amount)) {
        throw new Error("token transfer rejected: transfer policy does not allow this token amount");
      }
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

    const networkConfig = resolveNetworkConfig({ chainId: session.chainId });
    await assertMainnetPolicyRegistryPreflight({
      chainId: session.chainId,
      to: isNativeTransfer ? to : tokenAddress,
      data,
      value,
      rpcUrl: networkConfig.rpcUrl,
    });

    const sessionClient = context.sessionManager.createSessionClient({
      chain: networkConfig.chain,
      rpcUrl: networkConfig.rpcUrl,
    });
    const agwActions = createAgwActionAdapter(sessionClient);

    const txHash = isNativeTransfer
      ? await agwActions.sendTransaction({
          account: session.accountAddress as Address,
          chain: undefined,
          to,
          data: "0x",
          value,
        })
      : await agwActions.writeContract({
          account: session.accountAddress as Address,
          chain: undefined,
          address: tokenAddress,
          abi: erc20Abi,
          functionName: "transfer",
          args: [to, amount],
          value: 0n,
        });

    const explorerBase = networkConfig.chain.blockExplorers?.default?.url ?? null;

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
