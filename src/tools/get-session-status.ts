import { reconcileSessionLifecycle } from "../session/reconcile.js";
import type { ToolHandler } from "./types.js";

export const getSessionStatusTool: ToolHandler = {
  name: "get_session_status",
  description: "Returns on-chain AGW session status and local expiry metadata.",
  inputSchema: {
    type: "object",
    properties: {},
  },
  handler: async (_params, context) => {
    const sessionBefore = context.sessionManager.getSession();
    const reconciliation = await reconcileSessionLifecycle(context.sessionManager, context.logger);
    const sessionAfter = context.sessionManager.getSession();
    const session = sessionAfter ?? sessionBefore;
    const onchain =
      reconciliation === null
        ? await context.sessionManager.getOnchainSessionStatus()
        : {
            status: reconciliation.onchainStatus,
            statusCode: reconciliation.onchainStatusCode,
            source: reconciliation.source,
            checkedAt: reconciliation.checkedAt,
          };
    const localStatus = context.sessionManager.getSessionStatus();
    const expiresAt = session?.expiresAt ?? null;
    const expiresInSeconds = expiresAt === null ? null : Math.max(expiresAt - onchain.checkedAt, 0);

    return {
      status: onchain.status,
      statusCode: onchain.statusCode,
      source: onchain.source,
      active: onchain.status === "Active",
      localStatus,
      accountAddress: session?.accountAddress ?? null,
      chainId: session?.chainId ?? context.sessionManager.getChainId(),
      expiresAt,
      checkedAt: onchain.checkedAt,
      expiresInSeconds,
    };
  },
};
