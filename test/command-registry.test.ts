import { getCommandDefinition, listCommands, validateCommandRegistry } from "../packages/agw-core/src/index.js";
import type { AgwSchema } from "../packages/agw-core/src/registry/types.js";

function assertRecursiveSchema(schema: AgwSchema): void {
  if (schema.type === "array") {
    assertRecursiveSchema(schema.items);
    return;
  }

  if (schema.type === "unknown") {
    return;
  }

  if (schema.type === "object") {
    Object.values(schema.properties).forEach(assertRecursiveSchema);
  }
}

function assertOpaqueObjectsAreMarked(schema: AgwSchema): void {
  if (schema.type === "array") {
    assertOpaqueObjectsAreMarked(schema.items);
    return;
  }

  if (schema.type === "unknown") {
    return;
  }

  if (schema.type !== "object") {
    return;
  }

  if (schema.additionalProperties === true && Object.keys(schema.properties).length === 0) {
    expect(schema.opaque).toBe(true);
    expect(schema.opaqueReason).toBe("external_data");
  }

  Object.values(schema.properties).forEach(assertOpaqueObjectsAreMarked);
}

describe("shared command registry", () => {
  it("defines stable agent-first metadata for commands", () => {
    const commands = listCommands();

    expect(commands.length).toBeGreaterThan(0);
    expect(commands.map(command => command.id)).toContain("session.status");
    expect(commands.map(command => command.id)).toContain("schema.list");
    expect(commands.map(command => command.id)).toContain("schema.get");
    expect(commands.every(command => command.requestSchema.type === "object")).toBe(true);
    expect(commands.every(command => command.responseSchema.type === "object")).toBe(true);
    commands.forEach(command => {
      assertRecursiveSchema(command.requestSchema);
      assertRecursiveSchema(command.responseSchema);
      assertOpaqueObjectsAreMarked(command.requestSchema);
      assertOpaqueObjectsAreMarked(command.responseSchema);
    });
  });

  it("marks mutating commands as explicit-execute and dry-run aware", () => {
    const txSend = getCommandDefinition("tx.send");

    expect(txSend).toBeDefined();
    expect(txSend?.status).toBe("implemented");
    expect(txSend?.mutation.risk).toBe("state_change");
    expect(txSend?.mutation.requiresExplicitExecute).toBe(true);
    expect(txSend?.mutation.supportsDryRun).toBe(true);
  });

  it("marks large list surfaces as pagination-aware", () => {
    const appList = getCommandDefinition("app.list");

    expect(appList).toBeDefined();
    expect(appList?.output.defaultMode).toBe("ndjson");
    expect(appList?.output.supportsPagination).toBe(true);
    expect(appList?.output.supportsPageAll).toBe(true);
    expect(appList?.output.supportsFieldSelection).toBe(true);
  });

  it("keeps wallet read schemas aligned with the public command output", () => {
    const walletBalances = getCommandDefinition("wallet.balances");
    const walletTokensList = getCommandDefinition("wallet.tokens.list");

    expect(walletBalances?.kind).toBe("command");
    expect(walletTokensList?.kind).toBe("command");
    if (!walletBalances || walletBalances.kind !== "command" || !walletTokensList || walletTokensList.kind !== "command") {
      throw new Error("wallet read commands must be executable commands");
    }

    const walletBalancesRequestSchema = walletBalances.requestSchema;
    const walletBalancesResponseSchema = walletBalances.responseSchema;
    const walletTokensListResponseSchema = walletTokensList.responseSchema;

    if (!walletBalancesRequestSchema || !walletBalancesResponseSchema || !walletTokensListResponseSchema) {
      throw new Error("wallet read commands must expose request and response schemas");
    }

    expect(walletBalancesRequestSchema.properties).toHaveProperty("tokenAddresses");
    expect(walletBalancesResponseSchema.properties).toHaveProperty("nativeBalance");
    expect(walletBalancesResponseSchema.properties).toHaveProperty("tokenBalances");
    expect(walletTokensListResponseSchema.properties).toHaveProperty("items");
    expect(walletTokensListResponseSchema.properties.items.type).toBe("array");
    if (walletTokensListResponseSchema.properties.items.type !== "array") {
      throw new Error("wallet.tokens.list items schema must be an array");
    }
    const itemSchema = walletTokensListResponseSchema.properties.items.items;
    expect(itemSchema.type).toBe("object");
    if (itemSchema.type !== "object") {
      throw new Error("wallet.tokens.list item schema must be an object");
    }
    expect(itemSchema.properties).toHaveProperty("symbol");
    expect(itemSchema.properties).toHaveProperty("value");
  });

  it("removes raw Portal app discovery commands from the public registry", () => {
    expect(getCommandDefinition("portal.apps.list")).toBeUndefined();
    expect(getCommandDefinition("portal.apps.get")).toBeUndefined();
  });

  it("keeps registry metadata internally consistent", () => {
    expect(validateCommandRegistry()).toEqual([]);
  });

  it("derives supported CLI flags for executable commands", () => {
    const txSend = getCommandDefinition("tx.send");

    expect(txSend?.kind).toBe("command");
    if (!txSend || txSend.kind !== "command") {
      throw new Error("tx.send must be an executable command");
    }

    expect(txSend.cli?.supportedFlags.map(flag => flag.name)).toEqual(
      expect.arrayContaining(["--json", "--output", "--dry-run", "--execute"]),
    );
    expect(txSend.cli?.io.stderr).toBe("json_error_envelope_only");
    expect(txSend.cli?.io.outputPrecedence).toEqual([
      "cli flag",
      "payload override",
      "AGW_OUTPUT",
      "non-tty pagination heuristic",
      "command default",
    ]);
  });

  it("keeps runtime configuration out of public auth.init payloads", () => {
    const authInit = getCommandDefinition("auth.init");

    expect(authInit?.kind).toBe("command");
    if (!authInit || authInit.kind !== "command") {
      throw new Error("auth.init must be an executable command");
    }
    const requestSchema = authInit.requestSchema!;
    expect(requestSchema.properties).not.toHaveProperty("storageDir");
    expect(requestSchema.properties).not.toHaveProperty("rpcUrl");
    expect(requestSchema.properties).not.toHaveProperty("appUrl");
    expect(authInit?.config?.env.map(entry => entry.env)).toEqual(
      expect.arrayContaining(["AGW_APP_URL", "AGW_HOME", "AGW_CALLBACK_SIGNING_PUBLIC_KEY"]),
    );
  });
});
