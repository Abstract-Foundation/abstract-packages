import {
  authNone,
  booleanSchema,
  config,
  defineCommand,
  exposure,
  jsonOutput,
  objectSchema,
  readMutation,
  sanitize,
  stringSchema,
} from "./helpers.js";
import type { AgwCommandDefinition } from "./types.js";

export const mcpNamespaceDefinition: AgwCommandDefinition = defineCommand({
  id: "mcp",
  path: ["mcp"],
  kind: "namespace",
  description:
    "Generated MCP surface projected from the shared command registry.",
  status: "planned",
  inputMode: "json",
  auth: authNone(),
  mutation: readMutation(),
  output: jsonOutput(false, false),
  exposure: exposure(true, false),
  children: [
    defineCommand({
      id: "mcp.serve",
      path: ["mcp", "serve"],
      kind: "command",
      description:
        "Run the stdio MCP server generated from the shared AGW registry.",
      status: "implemented",
      inputMode: "json",
      auth: authNone(),
      requestSchema: objectSchema({
        services: { type: "array", items: stringSchema({ minLength: 1 }) },
        sanitize: stringSchema({
          enum: ["off", "strict"],
          description: "Default sanitize profile for MCP tool responses.",
        }),
        debug: booleanSchema({
          description: "Enable debug logging for the MCP server.",
          default: false,
        }),
      }),
      responseSchema: objectSchema(
        {
          transport: stringSchema(),
          services: { type: "array", items: stringSchema({ minLength: 1 }) },
        },
        { required: ["transport", "services"] },
      ),
      mutation: readMutation(),
      output: jsonOutput(false, false),
      sanitization: sanitize(false),
      exposure: exposure(true, false),
      config: config(
        {
          env: "AGW_HOME",
          description: "AGW home directory override for the MCP runtime.",
        },
        {
          env: "AGW_CHAIN_ID",
          description: "Default chain id for MCP tool execution.",
        },
        {
          env: "AGW_RPC_URL",
          description: "Default RPC URL for MCP tool execution.",
        },
        {
          env: "AGW_APP_URL",
          description: "Companion app URL for MCP tool execution.",
        },
        {
          env: "AGW_SANITIZE_PROFILE",
          description: "Default sanitize profile for MCP tool responses.",
        },
      ),
    }),
  ],
});
