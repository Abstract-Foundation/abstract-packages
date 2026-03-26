import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, type CallToolRequest } from "@modelcontextprotocol/sdk/types.js";
import { listCommands, type AgwExecutableCommandDefinition } from "./command-registry.js";
import { toErrorEnvelope } from "./errors.js";
import { executeCommand, type JsonRecord } from "./executor.js";
import type { CommandRuntimeOptions } from "./execution/types.js";

export interface ServeGeneratedMcpOptions {
  services?: string[];
  runtime?: CommandRuntimeOptions;
}

export function getExposedMcpCommands(services: string[] | undefined): AgwExecutableCommandDefinition[] {
  const serviceSet = services && services.length > 0 ? new Set(services) : null;
  return listCommands().filter(command => {
    if (!command.exposure.mcp || command.status !== "implemented") {
      return false;
    }
    if (!serviceSet) {
      return true;
    }
    return serviceSet.has(command.path[0]);
  });
}

export function listGeneratedMcpTools(services: string[] | undefined): Array<{
  description: string;
  inputSchema: AgwExecutableCommandDefinition["requestSchema"];
  name: string;
}> {
  return getExposedMcpCommands(services).map(command => ({
    description: command.description,
    inputSchema: command.requestSchema,
    name: command.id,
  }));
}

export async function invokeGeneratedMcpTool(
  name: string,
  args: JsonRecord = {},
  options: ServeGeneratedMcpOptions = {},
): Promise<{ content: Array<{ text: string; type: "text" }>; isError?: boolean }> {
  const command = getExposedMcpCommands(options.services).find(entry => entry.id === name);
  if (!command) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            error: {
              code: "TOOL_NOT_FOUND",
              message: `Unknown generated MCP tool: ${name}`,
            },
          }),
        },
      ],
      isError: true,
    };
  }

  try {
    const { result } = await executeCommand(command.id, args, {
      ...(options.runtime ?? {}),
      sanitizeProfile: options.runtime?.sanitizeProfile ?? "strict",
      source: options.runtime?.source ?? "mcp",
      stdoutIsTTY: false,
    });
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  } catch (error) {
    return {
      content: [{ type: "text", text: JSON.stringify(toErrorEnvelope(error)) }],
      isError: true,
    };
  }
}

export async function serveGeneratedMcp(options: ServeGeneratedMcpOptions = {}): Promise<void> {
  const tools = listGeneratedMcpTools(options.services);
  const runtime = options.runtime ?? {};
  const server = new Server(
    {
      name: "agw",
      version: "0.1.0",
    },
    {
      capabilities: { tools: {} },
    },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools,
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
    return invokeGeneratedMcpTool(request.params.name, (request.params.arguments ?? {}) as JsonRecord, {
      runtime,
      services: options.services,
    });
  });

  await server.connect(new StdioServerTransport());
}
