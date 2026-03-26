import { getPortalApp } from "../integrations/portal/client.js";
import type { ToolHandler } from "./types.js";

function parsePositiveInt(value: unknown, fieldName: string): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
    throw new Error(`${fieldName} must be a positive integer.`);
  }
  return value;
}

export const portalGetAppTool: ToolHandler = {
  name: "portal_get_app",
  description: "Get a single application from Abstract Portal API.",
  inputSchema: {
    type: "object",
    properties: {
      id: { type: "number", description: "Portal app id." },
      includeContracts: {
        type: "boolean",
        description: "Include contracts metadata.",
      },
    },
    required: ["id"],
  },
  handler: async (params) => {
    const data = await getPortalApp({
      id: parsePositiveInt(params.id, "id"),
      includeContracts: params.includeContracts === true,
    });

    return data;
  },
};
