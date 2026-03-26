import type {
  AgwAuthRequirement,
  AgwCommandDefinition,
  AgwCommandRisk,
  AgwConfigDependency,
  AgwExposureContract,
  AgwMutationContract,
  AgwObjectSchema,
  AgwOutputContract,
  AgwSanitizationContract,
  AgwSchema,
} from "./types.js";

export function defineCommand(
  definition: AgwCommandDefinition,
): AgwCommandDefinition {
  return {
    sanitization: sanitize(false),
    ...definition,
  };
}

export function stringSchema(
  options: Omit<Extract<AgwSchema, { type: "string" }>, "type"> = {},
): AgwSchema {
  return { type: "string", ...options };
}

export function numberSchema(
  options: Omit<Extract<AgwSchema, { type: "number" }>, "type"> = {},
): AgwSchema {
  return { type: "number", ...options };
}

export function integerSchema(
  options: Omit<Extract<AgwSchema, { type: "integer" }>, "type"> = {},
): AgwSchema {
  return { type: "integer", minimum: 0, ...options };
}

export function booleanSchema(
  options: Omit<Extract<AgwSchema, { type: "boolean" }>, "type"> = {},
): AgwSchema {
  return { type: "boolean", ...options };
}

export function nullSchema(
  options: Omit<Extract<AgwSchema, { type: "null" }>, "type"> = {},
): AgwSchema {
  return { type: "null", ...options };
}

export function unknownSchema(
  options: Omit<Extract<AgwSchema, { type: "unknown" }>, "type"> = {},
): AgwSchema {
  return { type: "unknown", ...options };
}

export function arraySchema(
  items: AgwSchema,
  options: Omit<Extract<AgwSchema, { type: "array" }>, "type" | "items"> = {},
): AgwSchema {
  return { type: "array", items, ...options };
}

export function objectSchema(
  properties: Record<string, AgwSchema>,
  options: Omit<AgwObjectSchema, "type" | "properties"> = {},
): AgwObjectSchema {
  return { type: "object", properties, ...options };
}

export function opaqueObjectSchema(description: string): AgwObjectSchema {
  return objectSchema(
    {},
    {
      additionalProperties: true,
      description,
      opaque: true,
      opaqueReason: "external_data",
    },
  );
}

export const emptyObjectSchema = (): AgwObjectSchema => ({
  type: "object",
  properties: {},
});

export const authNone = (): AgwAuthRequirement => ({ kind: "none" });

export const authSession = (
  readiness: AgwAuthRequirement["readiness"],
): AgwAuthRequirement => ({
  kind: "local_session",
  readiness,
});

export const authApproval = (): AgwAuthRequirement => ({
  kind: "companion_web_approval",
});

export const readMutation = (): AgwMutationContract => ({
  risk: "read",
  defaultMode: "read",
  requiresExplicitExecute: false,
  supportsDryRun: false,
  supportsExecution: false,
  supportsPreview: false,
});

export const writeMutation = (
  risk: AgwCommandRisk = "state_change",
): AgwMutationContract => ({
  risk,
  defaultMode: "preview",
  requiresExplicitExecute: true,
  supportsDryRun: true,
  supportsExecution: true,
  supportsPreview: true,
});

export const jsonOutput = (
  supportsFieldSelection: boolean,
  supportsPagination = false,
  supportsPageAll = false,
): AgwOutputContract => ({
  defaultMode: "json",
  supportsFieldSelection,
  supportsPagination,
  supportsPageAll,
});

export const ndjsonOutput = (
  supportsFieldSelection: boolean,
  supportsPagination: boolean,
  supportsPageAll = supportsPagination,
): AgwOutputContract => ({
  defaultMode: "ndjson",
  supportsFieldSelection,
  supportsPagination,
  supportsPageAll,
});

export const exposure = (
  cli: boolean,
  mcp: boolean,
  skillHints: string[] = [],
): AgwExposureContract => ({
  cli,
  mcp,
  skillHints,
});

export const sanitize = (
  supported: boolean,
  defaultProfile: AgwSanitizationContract["defaultProfile"] = "off",
): AgwSanitizationContract => ({
  supported,
  defaultProfile,
});

export const config = (
  ...env: AgwConfigDependency[]
): { env: AgwConfigDependency[] } => ({ env });

export const idSchema = (description: string): AgwSchema =>
  stringSchema({
    description,
    format: "resource-id",
    minLength: 1,
    pattern: "^[^?#%]+$",
  });

export const addressSchema = (description: string): AgwSchema =>
  stringSchema({
    description,
    format: "address",
    pattern: "^0x[a-fA-F0-9]{40}$",
  });

export const hexSchema = (description: string): AgwSchema =>
  stringSchema({ description, format: "hex", pattern: "^0x[0-9a-fA-F]*$" });

export const decimalStringSchema = (description: string): AgwSchema =>
  stringSchema({ description, format: "decimal-string", pattern: "^\\d+$" });

export const fieldsSchema = (): AgwSchema =>
  arraySchema(
    stringSchema({ description: "Response field path", minLength: 1 }),
    {
      description: "Optional response field selection paths.",
    },
  );

export const paginationRequestSchema = (): AgwObjectSchema =>
  objectSchema({
    cursor: stringSchema({ description: "Opaque cursor for the next page." }),
    pageSize: integerSchema({
      description: "Maximum number of items to return per page.",
      minimum: 1,
    }),
    pageAll: booleanSchema({
      description: "When true, fetch all pages through the executor.",
      default: false,
    }),
  });

export const transactionRequestSchema: AgwObjectSchema = objectSchema(
  {
    to: addressSchema("Target contract or EOA address."),
    data: hexSchema("Hex calldata for the transaction."),
    value: decimalStringSchema("Wei value as a decimal string. Defaults to 0."),
    execute: booleanSchema({
      description: "Execute immediately when true. Preview by default.",
      default: false,
    }),
  },
  { required: ["to", "data"] },
);

export const transactionPreviewSchema = objectSchema(
  {
    to: addressSchema("Target contract or EOA address."),
    data: hexSchema("Hex calldata."),
    value: decimalStringSchema("Wei value as a decimal string."),
  },
  { required: ["to", "data", "value"] },
);

export const explorerLinksSchema = objectSchema(
  {
    chain: stringSchema({ description: "Chain explorer base URL." }),
    transaction: stringSchema({
      description: "Explorer URL for the transaction.",
    }),
  },
  { additionalProperties: false },
);

export const transactionResponseSchema: AgwObjectSchema = objectSchema({
  broadcast: booleanSchema({
    description: "Whether the transaction was broadcast.",
  }),
  preview: booleanSchema({ description: "Whether the response is a preview." }),
  txHash: stringSchema({ description: "Broadcast transaction hash." }),
  requiresExplicitExecute: booleanSchema({
    description: "Whether execute intent is required.",
  }),
  transaction: transactionPreviewSchema,
  explorer: explorerLinksSchema,
});

export function listResponseSchema(
  itemSchema: AgwSchema = opaqueObjectSchema("Opaque list item payload."),
): AgwObjectSchema {
  return objectSchema(
    {
      items: arraySchema(itemSchema, { description: "Page items." }),
      nextCursor: stringSchema({
        description: "Cursor to request the next page.",
      }),
      totalItems: integerSchema({
        description: "Total number of items available when known.",
      }),
    },
    { required: ["items"] },
  );
}
