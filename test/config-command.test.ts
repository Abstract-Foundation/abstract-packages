import { buildMcpConfigSnippet } from "../src/config/mcp-config.js";

describe("config helper command", () => {
  it("builds a valid MCP config snippet", () => {
    const snippet = buildMcpConfigSnippet({
      command: "node",
      args: ["/tmp/agw-mcp/dist/index.js", "serve"],
      serverName: "agw-mcp-local",
    });

    expect(snippet).toEqual({
      mcpServers: {
        "agw-mcp-local": {
          command: "node",
          args: ["/tmp/agw-mcp/dist/index.js", "serve"],
        },
      },
    });
  });
});
