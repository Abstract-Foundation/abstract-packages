import { getBalancesTool } from "../../tools/get-balances.js";
import { getTokenListTool } from "../../tools/get-token-list.js";
import { getWalletAddressTool } from "../../tools/get-wallet-address.js";
import { sliceItemsWithCursor } from "../output.js";
import type { CommandHandler, JsonRecord } from "../types.js";

function isJsonRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export const walletHandlers: Record<string, CommandHandler> = {
  "wallet.address": async (_input, context) =>
    getWalletAddressTool.handler({}, context),
  "wallet.balances": async (input, context) =>
    getBalancesTool.handler({ tokenAddresses: input.tokenAddresses }, context),
  "wallet.tokens.list": async (input, context) => {
    const result = await getTokenListTool.handler({}, context);
    if (!isJsonRecord(result) || !Array.isArray(result.tokenHoldings)) {
      return result;
    }

    return {
      connected: result.connected ?? false,
      sessionStatus: result.sessionStatus ?? null,
      accountAddress: result.accountAddress ?? null,
      chainId: result.chainId ?? null,
      explorer: result.explorer ?? null,
      ...sliceItemsWithCursor(
        result.tokenHoldings,
        input.cursor,
        input.pageSize,
      ),
      totalItems: result.tokenHoldings.length,
    };
  },
};
