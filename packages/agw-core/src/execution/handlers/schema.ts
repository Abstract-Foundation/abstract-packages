import { buildSchemaGetResult, buildSchemaListResult } from "../../command-registry.js";
import { AgwCliError } from "../../errors.js";
import type { CommandHandler } from "../types.js";

export const schemaHandlers: Record<string, CommandHandler> = {
  "schema.get": async input => {
    if (typeof input.commandId !== "string" || input.commandId.trim() === "") {
      throw new AgwCliError("INVALID_INPUT", "commandId must be a non-empty string", 2);
    }
    return {
      command: buildSchemaGetResult(input.commandId.trim()),
    };
  },
  "schema.list": async () => buildSchemaListResult(),
};
