import fs from "node:fs";
import { authKeyfileExists } from "../../privy/auth.js";
import { getSessionStatusTool } from "../../tools/get-session-status.js";
import { revokeSessionTool } from "../../tools/revoke-session.js";
import { AgwCliError } from "../../errors.js";
import type { CommandHandler } from "../types.js";
import { createSessionStorage } from "../context.js";

export const authSessionHandlers: Record<string, CommandHandler> = {
  "auth.init": async (input, context) => {
    const chainId = input.chainId;
    if (typeof chainId !== "number" || !Number.isFinite(chainId)) {
      throw new AgwCliError("INVALID_INPUT", "chainId is required", 2);
    }

    const execute = input.execute === true;
    if (!execute) {
      return {
        preview: true,
        requiresExplicitExecute: true,
        action: "open_companion_approval",
        chainId,
        appUrl: context.runtime.appUrl ?? null,
        homeDir: context.runtime.homeDir ?? null,
      };
    }

    const { runBootstrapFlow } = await import("../../auth/bootstrap.js");
    const session = await runBootstrapFlow(context.logger, {
      chainId,
      rpcUrl: context.runtime.rpcUrl,
      appUrl: context.runtime.appUrl,
      homeDir: context.runtime.homeDir,
    });

    return {
      preview: false,
      approved: true,
      accountAddress: session.accountAddress,
      chainId: session.chainId,
      status: session.status,
      signerId: session.privySignerBinding?.id ?? null,
      walletId: session.privyWalletId ?? null,
      policyPreset: session.policyMeta?.presetId ?? null,
    };
  },
  "auth.revoke": async (input, context) => {
    const session = context.sessionManager.getSession();
    if (!session) {
      throw new Error("session is missing");
    }
    const execute = input.execute === true;
    if (!execute) {
      return {
        preview: true,
        requiresExplicitExecute: true,
        action: "revoke_signer",
        accountAddress: session.accountAddress,
        chainId: session.chainId,
        signerId: session.privySignerBinding?.id ?? null,
      };
    }

    return revokeSessionTool.handler({}, context);
  },
  "session.status": async (_input, context) => getSessionStatusTool.handler({}, context),
  "session.doctor": async (input, context) => {
    const storage = createSessionStorage(input, { homeDir: context.runtime.homeDir });
    const session = context.sessionManager.getSession();
    const readiness = context.sessionManager.getSessionReadiness();
    const checks = [
      { name: "storage_dir", ok: fs.existsSync(storage.storageDir), detail: storage.storageDir },
      { name: "session_file", ok: fs.existsSync(storage.path), detail: storage.path },
      {
        name: "session_loaded",
        ok: session !== null,
        detail: session ? context.sessionManager.getSessionStatus() : "missing",
      },
      {
        name: "auth_keyfile",
        ok: session?.privyAuthKeyRef ? authKeyfileExists(storage.storageDir) : true,
        detail: session?.privyAuthKeyRef ? "required" : "not_required",
      },
      {
        name: "write_readiness",
        ok: readiness !== "incomplete_signer_session",
        detail: readiness,
      },
    ];

    return {
      ok: checks.every(check => check.ok),
      checks,
      status: context.sessionManager.getSessionStatus(),
      readiness,
    };
  },
};
