export interface BuildMcpConfigSnippetInput {
  command?: string;
  args?: string[];
  serverName?: string;
}

export function buildMcpConfigSnippet(input: BuildMcpConfigSnippetInput = {}): Record<string, unknown> {
  const serverName = input.serverName ?? "agw-mcp";
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
