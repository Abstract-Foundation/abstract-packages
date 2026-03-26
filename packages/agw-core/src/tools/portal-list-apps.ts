import { listPortalApps } from "../integrations/portal/client.js";
import type { ToolHandler } from "./types.js";

function parseOptionalPositiveInt(
  value: unknown,
  fieldName: string,
): number | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
    throw new Error(`${fieldName} must be a positive integer.`);
  }
  return value;
}

export const portalListAppsTool: ToolHandler = {
  name: "portal_list_apps",
  description: "List applications from Abstract Portal API.",
  inputSchema: {
    type: "object",
    properties: {
      page: { type: "number", description: "Optional pagination page (>=1)." },
      limit: {
        type: "number",
        description: "Optional pagination limit (1-100).",
      },
    },
  },
  handler: async (params) => {
    const data = await listPortalApps({
      page: parseOptionalPositiveInt(params.page, "page"),
      limit: parseOptionalPositiveInt(params.limit, "limit"),
    });

    return data;
  },
};
