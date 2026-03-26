import { SessionManager } from "../session/manager.js";
import { SessionStorage } from "../session/storage.js";
import type { AgwSessionData } from "../session/types.js";
import type { ToolContext } from "../tools/types.js";
import { Logger } from "../utils/logger.js";
import { parseOptionalNumber } from "./validation.js";
import type { CommandRuntimeOptions, JsonRecord } from "./types.js";

export function createToolContext(input: JsonRecord, options: CommandRuntimeOptions = {}): ToolContext {
  const logger = new Logger("agw");
  const sessionManager = new SessionManager(logger, {
    homeDir: options.homeDir,
    chainId: options.chainId ?? parseOptionalNumber(input.chainId, "chainId"),
    rpcUrl: options.rpcUrl,
    appUrl: options.appUrl,
  });
  sessionManager.initialize();
  return {
    sessionManager,
    logger,
    runtime: {
      appUrl: options.appUrl,
      chainId: options.chainId,
      env: options.env,
      homeDir: options.homeDir,
      rpcUrl: options.rpcUrl,
      source: options.source,
    },
  };
}

export function createSessionStorage(_input: JsonRecord, options: CommandRuntimeOptions = {}): SessionStorage {
  return new SessionStorage(options.homeDir);
}

export function requireActiveSession(context: ToolContext): AgwSessionData {
  const status = context.sessionManager.getSessionStatus();
  if (status !== "active") {
    throw new Error(`session must be active (current status: ${status})`);
  }

  const session = context.sessionManager.getSession();
  if (!session) {
    throw new Error("session is missing");
  }

  return session;
}
