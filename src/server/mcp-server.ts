import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, type CallToolRequest } from "@modelcontextprotocol/sdk/types.js";
import { AuditLog } from "../audit/index.js";
import { toMcpErrorContract } from "../errors/index.js";
import { SessionManager } from "../session/manager.js";
import { getTool, publicTools } from "../tools/index.js";
import { Logger } from "../utils/logger.js";

export interface AgwMcpServerOptions {
  chainId?: number;
  rpcUrl?: string;
  storageDir?: string;
}

export class AgwMcpServer {
  private readonly server: Server;
  private readonly logger: Logger;
  private readonly sessionManager: SessionManager;
  private readonly auditLog: AuditLog;

  constructor(options: AgwMcpServerOptions = {}) {
    this.logger = new Logger("agw-mcp");
    this.sessionManager = new SessionManager(this.logger, {
      storageDir: options.storageDir,
      chainId: options.chainId,
      rpcUrl: options.rpcUrl,
    });
    this.auditLog = new AuditLog(options.storageDir);

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
        tools: publicTools.map(tool => ({
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
        const error = toMcpErrorContract(new Error(`Unknown tool: ${toolName}`), "TOOL_NOT_FOUND");
        return {
          content: [{ type: "text" as const, text: JSON.stringify(error, null, 2) }],
          isError: true,
        };
      }

      try {
        this.auditLog.append({
          timestamp: new Date().toISOString(),
          tool: toolName,
          phase: "request",
          payload: {
            arguments: (request.params.arguments ?? {}) as Record<string, unknown>,
          },
        });

        const result = await tool.handler(request.params.arguments ?? {}, {
          sessionManager: this.sessionManager,
          logger: this.logger.child(toolName),
        });
        this.auditLog.append({
          timestamp: new Date().toISOString(),
          tool: toolName,
          phase: "response",
          payload: {
            result: result as Record<string, unknown>,
          },
        });

        return {
          content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        const mapped = toMcpErrorContract(error);
        this.auditLog.append({
          timestamp: new Date().toISOString(),
          tool: toolName,
          phase: "error",
          payload: mapped as unknown as Record<string, unknown>,
        });
        this.logger.error(`${toolName} failed: ${mapped.message}`);
        return {
          content: [{ type: "text" as const, text: JSON.stringify(mapped, null, 2) }],
          isError: true,
        };
      }
    });
  }

  async start(): Promise<void> {
    this.sessionManager.initialize();
    process.once("beforeExit", () => {
      void this.auditLog.flush().catch(() => undefined);
    });
    await this.server.connect(new StdioServerTransport());
    this.logger.info("AGW MCP server started");
  }
}
