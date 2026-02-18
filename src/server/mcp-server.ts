import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, type CallToolRequest } from "@modelcontextprotocol/sdk/types.js";
import { SessionManager } from "../session/manager.js";
import { getTool, tools } from "../tools/index.js";
import { Logger } from "../utils/logger.js";

export interface AgwMcpServerOptions {
  chainId?: number;
  storageDir?: string;
}

export class AgwMcpServer {
  private readonly server: Server;
  private readonly logger: Logger;
  private readonly sessionManager: SessionManager;

  constructor(options: AgwMcpServerOptions = {}) {
    this.logger = new Logger("agw-mcp");
    this.sessionManager = new SessionManager(this.logger, {
      storageDir: options.storageDir,
      chainId: options.chainId,
    });

    this.server = new Server(
      {
        name: "agw-mcp-server",
        version: "0.1.0",
      },
      {
        capabilities: { tools: {} },
      },
    );

    this.setupHandlers();
  }

  private setupHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: tools.map(tool => ({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema,
        })),
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
      const toolName = request.params.name;
      const tool = getTool(toolName);
      if (!tool) {
        return {
          content: [{ type: "text" as const, text: JSON.stringify({ error: `Unknown tool: ${toolName}` }) }],
          isError: true,
        };
      }

      try {
        const result = await tool.handler(request.params.arguments ?? {}, {
          sessionManager: this.sessionManager,
          logger: this.logger.child(toolName),
        });

        return {
          content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.error(`${toolName} failed: ${message}`);
        return {
          content: [{ type: "text" as const, text: JSON.stringify({ error: message }, null, 2) }],
          isError: true,
        };
      }
    });
  }

  async start(): Promise<void> {
    this.sessionManager.initialize();
    await this.server.connect(new StdioServerTransport());
    this.logger.info("AGW MCP server started");
  }
}
