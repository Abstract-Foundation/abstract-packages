export interface BuildMcpConfigSnippetInput {
  command?: string;
  args?: string[];
  serverName?: string;
  npx?: boolean;
  chainId?: string;
}

export function buildMcpConfigSnippet(
  input: BuildMcpConfigSnippetInput = {},
): Record<string, unknown> {
  const serverName = input.serverName ?? "agw-cli";

  if (input.npx) {
    const args = [
      "-y",
      "@abstract-foundation/agw-cli",
      "mcp",
      "serve",
      "--sanitize",
      "strict",
    ];
    if (input.chainId) {
      args.push("--chain-id", input.chainId);
    }
    return {
      mcpServers: {
        [serverName]: {
          command: "npx",
          args,
          env: {
            AGW_SANITIZE_PROFILE: "strict",
          },
        },
      },
    };
  }

  const command = input.command ?? "agw-cli";
  const args = input.args ?? ["mcp", "serve", "--sanitize", "strict"];

  return {
    mcpServers: {
      [serverName]: {
        command,
        args,
        ...(input.args ? {} : { env: { AGW_SANITIZE_PROFILE: "strict" } }),
      },
    },
  };
}
