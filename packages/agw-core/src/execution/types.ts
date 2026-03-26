import type { ToolContext } from "../tools/types.js";
import type { AgwOutputMode, AgwSanitizeProfile } from "../registry/types.js";

export type JsonRecord = Record<string, unknown>;

export type CommandHandler = (input: JsonRecord, context: ToolContext) => Promise<unknown>;

export interface CommandRuntimeOptions {
  appUrl?: string;
  chainId?: number;
  cwd?: string;
  dryRun?: boolean;
  env?: NodeJS.ProcessEnv;
  execute?: boolean;
  homeDir?: string;
  outputMode?: AgwOutputMode;
  pageAll?: boolean;
  rpcUrl?: string;
  sanitizeProfile?: AgwSanitizeProfile;
  source?: "cli" | "mcp" | "extension" | "test";
  stdoutIsTTY?: boolean;
}

export function isJsonRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(entry => typeof entry === "string");
}
