import type { SessionManager } from "../session/manager.js";
import type { Logger } from "../utils/logger.js";

export interface ToolRuntimeConfig {
  appUrl?: string;
  chainId?: number;
  env?: NodeJS.ProcessEnv;
  homeDir?: string;
  rpcUrl?: string;
  source?: "cli" | "mcp" | "extension" | "test";
}

export interface ToolContext {
  sessionManager: SessionManager;
  logger: Logger;
  runtime: ToolRuntimeConfig;
}

export interface ToolHandler {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
  handler: (params: Record<string, unknown>, context: ToolContext) => Promise<unknown>;
}
