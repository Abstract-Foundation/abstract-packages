import {
  buildSchemaGetResult,
  buildSchemaListResult,
  getExposedMcpCommands,
  invokeGeneratedMcpTool,
  listGeneratedMcpTools,
} from "../packages/agw-core/src/index.js";

describe("generated agw mcp exposure", () => {
  it("exposes only implemented mcp-backed commands", () => {
    const commands = getExposedMcpCommands(undefined).map(command => command.id);

    expect(commands).toContain("schema.list");
    expect(commands).toContain("schema.get");
    expect(commands).toContain("session.status");
    expect(commands).toContain("wallet.address");
    expect(commands).toContain("wallet.balances");
    expect(commands).toContain("tx.send");
    expect(commands).toContain("contract.write");
    expect(commands).toContain("app.list");
    expect(commands).toContain("app.show");
    expect(commands).not.toContain("portal.apps.list");
    expect(commands).not.toContain("portal.apps.get");
    expect(commands).not.toContain("mcp.serve");
  });

  it("supports filtering by top-level service group", () => {
    const commands = getExposedMcpCommands(["wallet"]).map(command => command.id);

    expect(commands).toContain("wallet.address");
    expect(commands).toContain("wallet.balances");
    expect(commands).not.toContain("session.status");
  });

  it("publishes registry-backed MCP tool metadata", () => {
    const tools = listGeneratedMcpTools(undefined);
    const schemaGet = tools.find(tool => tool.name === "schema.get");

    expect(tools.map(tool => tool.name)).toContain("schema.list");
    expect(schemaGet?.inputSchema.properties).toHaveProperty("commandId");
  });

  it("returns the same schema list payload through MCP discovery", async () => {
    const result = await invokeGeneratedMcpTool("schema.list");

    expect(result.isError).toBeUndefined();
    expect(JSON.parse(result.content[0].text)).toEqual(buildSchemaListResult());
  });

  it("returns the same schema get payload through MCP discovery", async () => {
    const result = await invokeGeneratedMcpTool("schema.get", {
      commandId: "tx.send",
    });

    expect(result.isError).toBeUndefined();
    expect(JSON.parse(result.content[0].text)).toEqual({
      command: buildSchemaGetResult("tx.send"),
    });
  });

  it("returns deterministic envelopes for MCP errors", async () => {
    const result = await invokeGeneratedMcpTool("schema.get", {
      commandId: "missing.command",
    });

    expect(result.isError).toBe(true);
    expect(JSON.parse(result.content[0].text)).toEqual({
      error: {
        code: "SCHEMA_NOT_FOUND",
        details: undefined,
        message: "Unknown command schema: missing.command",
      },
    });
  });
});
