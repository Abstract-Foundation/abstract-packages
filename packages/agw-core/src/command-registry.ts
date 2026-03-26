export {
  listResponseSchema,
  transactionRequestSchema,
  transactionResponseSchema,
} from "./registry/helpers.js";
export type * from "./registry/types.js";

import { AgwCliError } from "./errors.js";
import { appNamespaceDefinition } from "./registry/app.js";
import { authNamespaceDefinition } from "./registry/auth.js";
import { contractNamespaceDefinition } from "./registry/contract.js";
import { mcpNamespaceDefinition } from "./registry/mcp.js";
import { portalNamespaceDefinition } from "./registry/portal.js";
import { schemaNamespaceDefinition } from "./registry/schema.js";
import { sessionNamespaceDefinition } from "./registry/session.js";
import { txNamespaceDefinition } from "./registry/tx.js";
import type {
  AgwCliContract,
  AgwCliFlagDefinition,
  AgwCliFlagName,
  AgwCommandDefinition,
  AgwExecutableCommandDefinition,
  AgwSchema,
} from "./registry/types.js";
import { walletNamespaceDefinition } from "./registry/wallet.js";

const CLI_FLAG_DESCRIPTIONS: Record<AgwCliFlagName, string> = {
  "--app-url": "Companion app URL override.",
  "--chain-id": "Chain id override for runtime configuration.",
  "--dry-run": "Validate and preview without executing mutations.",
  "--execute": "Execute a mutating command.",
  "--home": "AGW home directory override.",
  "--json": "Inline JSON payload or @path-to-json-file.",
  "--output": "Output mode override: json or ndjson.",
  "--page-all": "Fetch all pages for pagination-aware commands.",
  "--rpc-url": "RPC URL override for runtime configuration.",
  "--sanitize": "Sanitize agent-facing response content: off or strict.",
};

const OUTPUT_PRECEDENCE = [
  "cli flag",
  "payload override",
  "AGW_OUTPUT",
  "non-tty pagination heuristic",
  "command default",
];
const SANITIZE_PRECEDENCE = [
  "cli flag",
  "payload override",
  "AGW_SANITIZE_PROFILE",
  "command default",
];
const RUNTIME_CONFIG_PRECEDENCE = [
  "cli flag",
  "AGW_* env var",
  "runtime default",
];

function flagDefinition(name: AgwCliFlagName): AgwCliFlagDefinition {
  return {
    description: CLI_FLAG_DESCRIPTIONS[name],
    name,
  };
}

function deriveCliContract(
  definition: AgwCommandDefinition,
): AgwCliContract | undefined {
  if (definition.kind !== "command") {
    return undefined;
  }

  const envDeps = new Set(
    definition.config?.env.map((entry) => entry.env) ?? [],
  );
  const supportedFlags: AgwCliFlagName[] = ["--json"];

  if (definition.id === "mcp.serve") {
    supportedFlags.push(
      "--sanitize",
      "--home",
      "--chain-id",
      "--rpc-url",
      "--app-url",
    );
  } else {
    supportedFlags.push("--output");
  }
  if (definition.mutation.supportsDryRun) {
    supportedFlags.push("--dry-run");
  }
  if (definition.mutation.supportsExecution) {
    supportedFlags.push("--execute");
  }
  if (definition.sanitization?.supported) {
    supportedFlags.push("--sanitize");
  }
  if (definition.output.supportsPageAll) {
    supportedFlags.push("--page-all");
  }
  if (envDeps.has("AGW_HOME")) {
    supportedFlags.push("--home");
  }
  if (envDeps.has("AGW_CHAIN_ID")) {
    supportedFlags.push("--chain-id");
  }
  if (envDeps.has("AGW_RPC_URL")) {
    supportedFlags.push("--rpc-url");
  }
  if (envDeps.has("AGW_APP_URL")) {
    supportedFlags.push("--app-url");
  }

  const uniqueFlags = [...new Set(supportedFlags)];

  return {
    io: {
      outputPrecedence: OUTPUT_PRECEDENCE,
      runtimeConfigPrecedence: RUNTIME_CONFIG_PRECEDENCE,
      sanitizePrecedence: SANITIZE_PRECEDENCE,
      stderr: "json_error_envelope_only",
      stdout: "machine_readable_only",
    },
    supportedFlags: uniqueFlags.map(flagDefinition),
  };
}

function enrichDefinition(
  definition: AgwCommandDefinition,
): AgwCommandDefinition {
  return {
    ...definition,
    children: definition.children?.map(enrichDefinition),
    cli: deriveCliContract(definition),
  };
}

export const commandRegistry: AgwCommandDefinition[] = [
  schemaNamespaceDefinition,
  mcpNamespaceDefinition,
  authNamespaceDefinition,
  sessionNamespaceDefinition,
  walletNamespaceDefinition,
  txNamespaceDefinition,
  contractNamespaceDefinition,
  portalNamespaceDefinition,
  appNamespaceDefinition,
].map(enrichDefinition);

export function flattenCommandRegistry(
  definitions = commandRegistry,
): AgwCommandDefinition[] {
  return definitions.flatMap((definition) => [
    definition,
    ...(definition.children ? flattenCommandRegistry(definition.children) : []),
  ]);
}

function isExecutableCommand(
  definition: AgwCommandDefinition,
): definition is AgwExecutableCommandDefinition {
  return (
    definition.kind === "command" &&
    Boolean(definition.requestSchema) &&
    Boolean(definition.responseSchema)
  );
}

export function listCommands(): AgwExecutableCommandDefinition[] {
  return flattenCommandRegistry().filter(isExecutableCommand);
}

export function getCommandDefinition(
  id: string,
): AgwCommandDefinition | undefined {
  return flattenCommandRegistry().find((definition) => definition.id === id);
}

export function findCommandDefinition(
  id: string,
): AgwCommandDefinition | undefined {
  return getCommandDefinition(id);
}

export function listCommandDefinitions(): AgwCommandDefinition[] {
  return flattenCommandRegistry();
}

export function buildSchemaListResult(): {
  commandCount: number;
  commands: AgwExecutableCommandDefinition[];
} {
  const commands = listCommands();
  return {
    commandCount: commands.length,
    commands,
  };
}

export function buildSchemaGetResult(
  commandId: string,
): AgwExecutableCommandDefinition {
  const definition = listCommands().find((command) => command.id === commandId);
  if (!definition) {
    throw new AgwCliError(
      "SCHEMA_NOT_FOUND",
      `Unknown command schema: ${commandId}`,
      2,
    );
  }
  return definition;
}

function validateSchema(
  schema: AgwSchema,
  path: string,
  errors: string[],
): void {
  if (schema.type === "array") {
    validateSchema(schema.items, `${path}.items`, errors);
    return;
  }

  if (schema.type === "unknown") {
    return;
  }

  if (schema.type === "object") {
    if (
      schema.additionalProperties === true &&
      Object.keys(schema.properties).length === 0 &&
      !schema.opaque
    ) {
      errors.push(
        `${path} uses an opaque object schema without an explicit opaque marker`,
      );
    }
    for (const [propertyName, propertySchema] of Object.entries(
      schema.properties,
    )) {
      validateSchema(
        propertySchema,
        `${path}.properties.${propertyName}`,
        errors,
      );
    }
  }
}

export function getCommandValidationErrors(
  command: AgwExecutableCommandDefinition,
): string[] {
  const errors: string[] = [];
  validateSchema(command.requestSchema, `${command.id}.requestSchema`, errors);
  validateSchema(
    command.responseSchema,
    `${command.id}.responseSchema`,
    errors,
  );

  if (
    command.mutation.requiresExplicitExecute &&
    !command.mutation.supportsExecution
  ) {
    errors.push(
      `${command.id} requires explicit execute but does not support execution`,
    );
  }
  if (command.mutation.supportsDryRun && !command.mutation.supportsExecution) {
    errors.push(`${command.id} supports dry-run without supporting execution`);
  }
  if (command.output.supportsPageAll && !command.output.supportsPagination) {
    errors.push(`${command.id} supports pageAll without pagination support`);
  }
  if (command.output.supportsPagination) {
    const requestFields = command.requestSchema.properties;
    const responseFields = command.responseSchema.properties;
    if (!("cursor" in requestFields)) {
      errors.push(`${command.id} pagination request schema is missing cursor`);
    }
    if (!("pageSize" in requestFields)) {
      errors.push(
        `${command.id} pagination request schema is missing pageSize`,
      );
    }
    if (!("pageAll" in requestFields)) {
      errors.push(`${command.id} pagination request schema is missing pageAll`);
    }
    if (!("items" in responseFields)) {
      errors.push(`${command.id} pagination response schema is missing items`);
    }
    if (!("nextCursor" in responseFields)) {
      errors.push(
        `${command.id} pagination response schema is missing nextCursor`,
      );
    }
  }
  if (!command.cli || command.cli.supportedFlags.length === 0) {
    errors.push(`${command.id} is missing supported CLI flag metadata`);
  }

  return errors;
}

export function validateCommandRegistry(): string[] {
  return listCommands().flatMap(getCommandValidationErrors);
}
