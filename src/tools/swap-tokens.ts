import { isAddress, type Address } from "viem";
import { createAgwActionAdapter } from "../agw/actions.js";
import { resolveZeroExConfig } from "../config/zeroex.js";
import { createZeroExQuoteAdapter, type ZeroExQuoteAdapter } from "../integrations/zeroex/index.js";
import { canCallTargetWithData, canTransferNativeValue } from "../policies/validate.js";
import { assertMainnetPolicyRegistryPreflight } from "../session/mainnet-preflight.js";
import { buildExplorerUrl } from "../utils/explorer.js";
import { resolveToolNetworkConfig } from "./network.js";
import type { ToolHandler } from "./types.js";

const ZEROEX_NATIVE_ETH_SENTINEL = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

export interface SwapTokensToolDependencies {
  quoteAdapter?: ZeroExQuoteAdapter;
  createQuoteAdapter?: () => ZeroExQuoteAdapter;
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

function parseOptionalInteger(value: unknown, field: string): number | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (typeof value !== "number" || !Number.isInteger(value)) {
    throw new Error(`${field} must be an integer`);
  }
  return value;
}

function parseOptionalString(value: unknown, field: string): string | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${field} must be a non-empty string when provided`);
  }
  return value.trim();
}

function normalizeSwapToken(value: string, nativeSymbol: string): string {
  const normalized = value.trim();
  if (normalized.toUpperCase() === nativeSymbol.toUpperCase()) {
    return ZEROEX_NATIVE_ETH_SENTINEL;
  }

  return normalized;
}

export function createSwapTokensTool(
  dependencies: SwapTokensToolDependencies = {},
): ToolHandler {
  const createQuoteAdapter =
    dependencies.createQuoteAdapter ??
    (() => {
      const zeroExConfig = resolveZeroExConfig();
      return createZeroExQuoteAdapter({ apiKey: zeroExConfig.apiKey });
    });

  return {
    name: "swap_tokens",
    description: "Fetches 0x swap quotes and executes swap transactions through AGW session keys when explicitly requested.",
    inputSchema: {
      type: "object",
      properties: {
        sellToken: { type: "string", description: "Token address to sell, or native symbol (for example ETH)" },
        buyToken: { type: "string", description: "Token address to buy, or native symbol (for example ETH)" },
        sellAmount: { type: "string", description: "Amount to sell in base units (exactly one of sellAmount/buyAmount)" },
        buyAmount: { type: "string", description: "Amount to buy in base units (exactly one of sellAmount/buyAmount)" },
        slippageBps: { type: "number", description: "Optional slippage in bps (0-10000)" },
        execute: { type: "boolean", description: "Broadcast swap transaction when true", default: false },
      },
      required: ["sellToken", "buyToken"],
    },
    handler: async (params, context) => {
      if (typeof params.sellToken !== "string" || !params.sellToken.trim()) {
        throw new Error("sellToken must be a non-empty string");
      }
      if (typeof params.buyToken !== "string" || !params.buyToken.trim()) {
        throw new Error("buyToken must be a non-empty string");
      }

      const status = context.sessionManager.getSessionStatus();
      if (status !== "active") {
        throw new Error(`session must be active (current status: ${status})`);
      }

      const session = context.sessionManager.getSession();
      if (!session) {
        throw new Error("session is missing");
      }

      const execute = parseExecute(params.execute);
      const quoteAdapter = dependencies.quoteAdapter ?? createQuoteAdapter();
      const networkConfig = resolveToolNetworkConfig(context, session.chainId);
      const sellToken = normalizeSwapToken(params.sellToken, networkConfig.chain.nativeCurrency.symbol);
      const buyToken = normalizeSwapToken(params.buyToken, networkConfig.chain.nativeCurrency.symbol);
      const quote = await quoteAdapter.getQuote({
        chainId: session.chainId,
        taker: session.accountAddress,
        sellToken,
        buyToken,
        sellAmount: parseOptionalString(params.sellAmount, "sellAmount"),
        buyAmount: parseOptionalString(params.buyAmount, "buyAmount"),
        slippageBps: parseOptionalInteger(params.slippageBps, "slippageBps"),
      });

      const txTarget = quote.transaction.to;
      const txData = quote.transaction.data as `0x${string}`;
      const txValue = BigInt(quote.transaction.value);
      if (!isAddress(txTarget)) {
        throw new Error("0x quote returned an invalid transaction target");
      }

      if (!canCallTargetWithData(session.sessionConfig, txTarget, txData)) {
        throw new Error("swap rejected: call policy does not allow the quoted swap target/selector");
      }
      if (!canTransferNativeValue(session.sessionConfig, txValue)) {
        throw new Error("swap rejected: transfer policy does not allow the quoted native value");
      }

      const requiresApproval = Boolean(quote.issues.allowance?.spender);
      if (!execute) {
        return {
          execute: false,
          quote,
          approval: {
            required: requiresApproval,
            allowanceTarget: quote.allowanceTarget,
            spender: quote.issues.allowance?.spender ?? null,
          },
        };
      }

      await assertMainnetPolicyRegistryPreflight({
        chainId: session.chainId,
        to: txTarget as Address,
        data: txData,
        value: txValue,
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
        to: txTarget as Address,
        data: txData,
        value: txValue,
      });

      const explorerBase = networkConfig.chain.blockExplorers?.default?.url ?? null;
      return {
        execute: true,
        txHash,
        accountAddress: session.accountAddress,
        chainId: session.chainId,
        quote,
        approval: {
          required: requiresApproval,
          allowanceTarget: quote.allowanceTarget,
          spender: quote.issues.allowance?.spender ?? null,
        },
        explorer: {
          chain: explorerBase,
          transaction: buildExplorerUrl(explorerBase, `/tx/${txHash}`),
        },
      };
    },
  };
}

export const swapTokensTool = createSwapTokensTool();
