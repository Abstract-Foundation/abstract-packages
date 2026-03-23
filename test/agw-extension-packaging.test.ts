import fs from "node:fs";
import path from "node:path";
import { buildMcpConfigSnippet } from "../packages/agw-cli/src/config/mcp-config.js";

describe("agw extension packaging", () => {
  it("ships Gemini extension descriptors", () => {
    const descriptorPath = path.join(process.cwd(), "packages/agw-cli/extensions/gemini/gemini-extension.json");
    const contextPath = path.join(process.cwd(), "packages/agw-cli/extensions/gemini/GEMINI.md");
    const installationGuidePath = path.join(process.cwd(), "docs/guide/installation.md");

    expect(fs.existsSync(descriptorPath)).toBe(true);
    expect(fs.existsSync(contextPath)).toBe(true);
    expect(fs.existsSync(installationGuidePath)).toBe(true);

    const descriptor = JSON.parse(fs.readFileSync(descriptorPath, "utf8")) as {
      mcpServers?: Record<string, { command?: string; args?: string[] }>;
    };
    const defaultSnippet = buildMcpConfigSnippet() as {
      mcpServers: Record<string, { command?: string; args?: string[] }>;
    };

    expect(descriptor.mcpServers?.["agw-cli"]?.command).toBe("agw-cli");
    expect(descriptor.mcpServers?.["agw-cli"]?.args).toEqual(["mcp", "serve", "--sanitize", "strict"]);
    expect(descriptor.mcpServers?.["agw-cli"]).toEqual(
      expect.objectContaining(defaultSnippet.mcpServers["agw-cli"]),
    );
  });

  it("ships Claude Code plugin descriptors", () => {
    const pluginPath = path.join(process.cwd(), "packages/agw-cli/extensions/claude-code/.claude-plugin/plugin.json");
    const mcpPath = path.join(process.cwd(), "packages/agw-cli/extensions/claude-code/.mcp.json");

    expect(fs.existsSync(pluginPath)).toBe(true);
    expect(fs.existsSync(mcpPath)).toBe(true);

    const mcpConfig = JSON.parse(fs.readFileSync(mcpPath, "utf8")) as {
      mcpServers?: Record<string, { command?: string; args?: string[]; env?: Record<string, string>; type?: string }>;
    };

    expect(mcpConfig.mcpServers?.["agw-cli"]?.type).toBe("stdio");
    expect(mcpConfig.mcpServers?.["agw-cli"]?.command).toBe("agw-cli");
    expect(mcpConfig.mcpServers?.["agw-cli"]?.args).toEqual(["mcp", "serve", "--sanitize", "strict"]);
    expect(mcpConfig.mcpServers?.["agw-cli"]?.env).toEqual({ AGW_SANITIZE_PROFILE: "strict" });
  });
});
