import type { ToolHandler } from "./types.js";

export const getSessionStatusTool: ToolHandler = {
  name: "get_session_status",
  description: "Returns the local AGW session status.",
  inputSchema: {
    type: "object",
    properties: {},
  },
  handler: async (_params, context) => {
    const session = context.sessionManager.getSession();
    const localStatus = context.sessionManager.getSessionStatus();
    const readiness = context.sessionManager.getSessionReadiness();
    const signerBinding = session?.privySignerBinding;

    return {
      status: localStatus,
      readiness,
      active: localStatus === "active",
      writeReady: readiness === "active_write_ready",
      accountAddress: session?.accountAddress ?? null,
      chainId: session?.chainId ?? context.sessionManager.getChainId(),
      policyPreset: session?.policyMeta?.presetId ?? null,
      enabledTools: session?.policyMeta?.enabledTools ?? null,
      signerType: signerBinding?.type ?? null,
      signerId: signerBinding?.id ?? null,
      signerFingerprint: signerBinding?.fingerprint ?? null,
      signerLabel: signerBinding?.label ?? null,
      signerCreatedAt: signerBinding?.createdAt ?? null,
      walletId: session?.privyWalletId ?? null,
      policyIds: signerBinding?.policyIds ?? null,
      capabilitySummary: session?.capabilitySummary ?? null,
    };
  },
};
