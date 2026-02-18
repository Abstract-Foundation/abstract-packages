import type { SessionManager } from "../session/manager.js";
import type { Logger } from "../utils/logger.js";

export interface ToolContext {
  sessionManager: SessionManager;
  logger: Logger;
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
