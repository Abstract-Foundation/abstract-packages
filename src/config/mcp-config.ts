export interface BuildMcpConfigSnippetInput {
  command?: string;
  args?: string[];
  serverName?: string;
  npx?: boolean;
  chainId?: string;
}

export function buildMcpConfigSnippet(input: BuildMcpConfigSnippetInput = {}): Record<string, unknown> {
  const serverName = input.serverName ?? "agw-mcp";

  if (input.npx) {
    const args = ["-y", "@abstract-foundation/agw-mcp", "serve"];
    if (input.chainId) {
      args.push("--chain-id", input.chainId);
    }
    return {
      mcpServers: {
        [serverName]: {
          command: "npx",
          args,
        },
      },
    };
  }

  const command = input.command ?? process.execPath;
  const args = input.args ?? [process.argv[1] ?? "dist/index.js", "serve"];

  return {
    mcpServers: {
      [serverName]: {
        command,
        args,
      },
    },
  };
}
