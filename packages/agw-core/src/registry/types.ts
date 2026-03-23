export type AgwCommandStatus = "implemented" | "planned";
export type AgwCommandKind = "namespace" | "command";
export type AgwAuthMode = "none" | "local_session" | "companion_web_approval";
export type AgwCommandRisk = "read" | "state_change" | "destructive";
export type AgwOutputMode = "json" | "ndjson";
export type AgwCommandExecutionMode = "read" | "preview" | "execute";
export type AgwSanitizeProfile = "off" | "strict";
export type AgwSchemaFormat = "address" | "decimal-string" | "hex" | "resource-id" | "url";
export type AgwCliFlagName =
  | "--app-url"
  | "--chain-id"
  | "--dry-run"
  | "--execute"
  | "--home"
  | "--json"
  | "--output"
  | "--page-all"
  | "--rpc-url"
  | "--sanitize";

export interface AgwSchemaBase {
  description?: string;
  default?: unknown;
  examples?: unknown[];
  format?: AgwSchemaFormat;
  opaque?: boolean;
  opaqueReason?: "external_data";
}

export interface AgwStringSchema extends AgwSchemaBase {
  type: "string";
  enum?: string[];
  pattern?: string;
  minLength?: number;
}

export interface AgwNumberSchema extends AgwSchemaBase {
  type: "number";
  minimum?: number;
}

export interface AgwIntegerSchema extends AgwSchemaBase {
  type: "integer";
  minimum?: number;
}

export interface AgwBooleanSchema extends AgwSchemaBase {
  type: "boolean";
}

export interface AgwNullSchema extends AgwSchemaBase {
  type: "null";
}

export interface AgwUnknownSchema extends AgwSchemaBase {
  type: "unknown";
}

export interface AgwArraySchema extends AgwSchemaBase {
  type: "array";
  items: AgwSchema;
  minItems?: number;
}

export interface AgwObjectSchema extends AgwSchemaBase {
  type: "object";
  properties: Record<string, AgwSchema>;
  required?: string[];
  additionalProperties?: boolean | AgwSchema;
}

export type AgwSchema =
  | AgwArraySchema
  | AgwBooleanSchema
  | AgwIntegerSchema
  | AgwNullSchema
  | AgwNumberSchema
  | AgwObjectSchema
  | AgwStringSchema
  | AgwUnknownSchema;

export interface AgwConfigDependency {
  env: string;
  description: string;
  required?: boolean;
}

export interface AgwAuthRequirement {
  kind: AgwAuthMode;
  readiness?: "missing_ok" | "active_required" | "write_ready_required";
}

export interface AgwMutationContract {
  risk: AgwCommandRisk;
  defaultMode: AgwCommandExecutionMode;
  requiresExplicitExecute: boolean;
  supportsDryRun: boolean;
  supportsExecution: boolean;
  supportsPreview: boolean;
}

export interface AgwOutputContract {
  defaultMode: AgwOutputMode;
  supportsFieldSelection: boolean;
  supportsPagination: boolean;
  supportsPageAll: boolean;
}

export interface AgwSanitizationContract {
  supported: boolean;
  defaultProfile: AgwSanitizeProfile;
}

export interface AgwExposureContract {
  cli: boolean;
  mcp: boolean;
  skillHints: string[];
}

export interface AgwCliFlagDefinition {
  description: string;
  name: AgwCliFlagName;
}

export interface AgwCliContract {
  io: {
    outputPrecedence: string[];
    runtimeConfigPrecedence: string[];
    sanitizePrecedence: string[];
    stderr: "json_error_envelope_only";
    stdout: "machine_readable_only";
  };
  supportedFlags: AgwCliFlagDefinition[];
}

export interface AgwCommandDefinition {
  id: string;
  path: string[];
  kind: AgwCommandKind;
  description: string;
  status: AgwCommandStatus;
  inputMode: "json";
  auth: AgwAuthRequirement;
  requestSchema?: AgwObjectSchema;
  responseSchema?: AgwObjectSchema;
  mutation: AgwMutationContract;
  output: AgwOutputContract;
  sanitization?: AgwSanitizationContract;
  exposure: AgwExposureContract;
  cli?: AgwCliContract;
  config?: {
    env: AgwConfigDependency[];
  };
  children?: AgwCommandDefinition[];
}

export interface AgwExecutableCommandDefinition extends AgwCommandDefinition {
  kind: "command";
  requestSchema: AgwObjectSchema;
  responseSchema: AgwObjectSchema;
}
