import { runRemoteRevokeFlow } from "../auth/revoke.js";
import type { ToolHandler } from "./types.js";

export const revokeSessionTool: ToolHandler = {
  name: "revoke_session",
  description:
    "Opens the hosted revoke flow, verifies the AGW CLI signer was removed from your wallet, then deletes the local authorization key.",
  inputSchema: {
    type: "object",
    properties: {},
  },
  handler: async (_params, context) => {
    const status = context.sessionManager.getSessionStatus();
    if (status !== "active") {
      throw new Error(`session must be active (current status: ${status})`);
    }

    const session = context.sessionManager.getSession();
    if (!session) {
      throw new Error("session is missing");
    }
    if (!session.privySignerBinding || !session.privyWalletId) {
      throw new Error("session does not have a remotely provisioned signer to revoke");
    }

    await runRemoteRevokeFlow(context.logger, session, {
      appUrl: context.runtime.appUrl,
    });

    context.sessionManager.markSessionRevoked();

    return {
      revoked: true,
      accountAddress: session.accountAddress,
      chainId: session.chainId,
      localStatus: context.sessionManager.getSessionStatus(),
      walletId: session.privyWalletId,
      signerId: session.privySignerBinding.id,
      signerLabel: session.privySignerBinding.label,
      note: "Signer removed from the wallet and local authorization key deleted.",
    };
  },
};
