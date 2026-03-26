import { listPortalStreams } from "../integrations/portal/client.js";
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

function parsePositiveInt(value: unknown, fieldName: string): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
    throw new Error(`${fieldName} must be a positive integer.`);
  }
  return value;
}

export const portalListStreamsTool: ToolHandler = {
  name: "portal_list_streams",
  description: "List streams for an app from Abstract Portal API.",
  inputSchema: {
    type: "object",
    properties: {
      app: { type: "number", description: "Portal app id." },
      page: { type: "number", description: "Optional pagination page (>=1)." },
      limit: {
        type: "number",
        description: "Optional pagination limit (1-100).",
      },
      sortBy: {
        type: "string",
        description: "Optional sort mode: latest or recommended.",
      },
      language: {
        type: "string",
        description: "Optional stream language filter.",
      },
    },
    required: ["app"],
  },
  handler: async (params) => {
    const sortBy =
      params.sortBy === undefined
        ? undefined
        : params.sortBy === "latest" || params.sortBy === "recommended"
          ? params.sortBy
          : (() => {
              throw new Error(
                'sortBy must be either "latest" or "recommended".',
              );
            })();

    const language =
      params.language === undefined
        ? undefined
        : typeof params.language === "string"
          ? params.language
          : (() => {
              throw new Error("language must be a string.");
            })();

    const data = await listPortalStreams({
      app: parsePositiveInt(params.app, "app"),
      page: parseOptionalPositiveInt(params.page, "page"),
      limit: parseOptionalPositiveInt(params.limit, "limit"),
      sortBy,
      language,
    });

    return data;
  },
};
