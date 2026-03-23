import { buildMcpConfigSnippet } from "../packages/agw-cli/src/config/mcp-config.js";

describe("config helper command", () => {
  it("builds a valid MCP config snippet", () => {
    const snippet = buildMcpConfigSnippet({
      command: "node",
      args: ["/tmp/agw/dist/index.mjs", "mcp", "serve"],
      serverName: "agw-local",
    });

    expect(snippet).toEqual({
      mcpServers: {
        "agw-local": {
          command: "node",
          args: ["/tmp/agw/dist/index.mjs", "mcp", "serve"],
        },
      },
    });
  });

  it("builds a strict-sanitize default snippet for the published package", () => {
    const snippet = buildMcpConfigSnippet({
      npx: true,
      serverName: "agw-cli",
      chainId: "2741",
    });

    expect(snippet).toEqual({
      mcpServers: {
        "agw-cli": {
          command: "npx",
          args: ["-y", "@abstract-foundation/agw-cli", "mcp", "serve", "--sanitize", "strict", "--chain-id", "2741"],
          env: {
            AGW_SANITIZE_PROFILE: "strict",
          },
        },
      },
    });
  });
});
