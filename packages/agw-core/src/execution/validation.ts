import fs from "node:fs";
import path from "node:path";
import { isAddress } from "viem";
import { AgwCliError } from "../errors.js";
import type { AgwSchema } from "../registry/types.js";
import type { AgwOutputMode, AgwSanitizeProfile } from "../registry/types.js";
import type { JsonRecord } from "./types.js";

const FORBIDDEN_RUNTIME_FIELDS = new Set(["appUrl", "homeDir", "rpcUrl", "storageDir"]);

function isJsonRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(entry => typeof entry === "string");
}

export function rejectDisallowedControlCharacters(value: string, field: string): void {
  for (const char of value) {
    const code = char.charCodeAt(0);
    const allowedWhitespace = code === 9 || code === 10 || code === 13;
    if (code < 32 && !allowedWhitespace) {
      throw new AgwCliError("INVALID_INPUT", `${field} contains disallowed control characters`, 2);
    }
  }
}

function rejectControlCharactersInValue(value: unknown, field: string): void {
  if (typeof value === "string") {
    rejectDisallowedControlCharacters(value, field);
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((entry, index) => rejectControlCharactersInValue(entry, `${field}[${index}]`));
    return;
  }

  if (!isJsonRecord(value)) {
    return;
  }

  for (const [key, entry] of Object.entries(value)) {
    rejectControlCharactersInValue(entry, `${field}.${key}`);
  }
}

function assertNoEmbeddedQueryFragments(value: string, field: string): void {
  if (value.includes("?") || value.includes("#")) {
    throw new AgwCliError("INVALID_INPUT", `${field} must not include query or fragment characters`, 2);
  }
}

function assertNoEncodedTraversal(value: string, field: string): void {
  if (/%2e|%2f|%5c/i.test(value)) {
    throw new AgwCliError("INVALID_INPUT", `${field} must not contain encoded traversal or slash characters`, 2);
  }
}

function assertNoForbiddenRuntimeFields(value: unknown, field = "json"): void {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => assertNoForbiddenRuntimeFields(entry, `${field}[${index}]`));
    return;
  }
  if (!isJsonRecord(value)) {
    return;
  }

  for (const [key, entry] of Object.entries(value)) {
    if (FORBIDDEN_RUNTIME_FIELDS.has(key)) {
      throw new AgwCliError("INVALID_INPUT", `${field}.${key} is runtime configuration and must not be supplied in JSON payloads`, 2);
    }
    assertNoForbiddenRuntimeFields(entry, `${field}.${key}`);
  }
}

export function parseOptionalString(value: unknown, field: string): string | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (typeof value !== "string" || value.trim() === "") {
    throw new AgwCliError("INVALID_INPUT", `${field} must be a non-empty string when provided`, 2);
  }
  rejectDisallowedControlCharacters(value, field);

  if (field.endsWith("Id") || field === "address" || field === "appId") {
    assertNoEmbeddedQueryFragments(value, field);
    assertNoEncodedTraversal(value, field);
  }

  return value.trim();
}

export function parseOptionalNumber(value: unknown, field: string): number | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new AgwCliError("INVALID_INPUT", `${field} must be a finite number when provided`, 2);
  }
  return value;
}

export function parseOptionalBoolean(value: unknown, field: string): boolean | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (typeof value !== "boolean") {
    throw new AgwCliError("INVALID_INPUT", `${field} must be a boolean when provided`, 2);
  }
  return value;
}

export function assertDecimalString(value: unknown, field: string): string {
  if (typeof value !== "string" || !/^\d+$/.test(value)) {
    throw new AgwCliError("INVALID_INPUT", `${field} must be a non-negative integer string`, 2);
  }
  return value;
}

export function assertHexString(value: unknown, field: string): string {
  if (typeof value !== "string" || !/^0x[0-9a-fA-F]*$/.test(value) || value.length % 2 !== 0) {
    throw new AgwCliError("INVALID_INPUT", `${field} must be a 0x-prefixed hex string with even length`, 2);
  }
  return value;
}

export function assertAddressString(value: unknown, field: string): string {
  if (typeof value !== "string" || !isAddress(value)) {
    throw new AgwCliError("INVALID_INPUT", `${field} must be a valid 0x-prefixed address`, 2);
  }
  return value;
}

export function resolveSafeJsonFilePath(fileRef: string, cwd = process.cwd()): string {
  const trimmed = fileRef.trim();
  if (trimmed === "") {
    throw new AgwCliError("INVALID_INPUT", "json file path must not be empty", 2);
  }
  if (path.isAbsolute(trimmed)) {
    throw new AgwCliError("INVALID_INPUT", "json file path must be relative to the current working directory", 2);
  }

  const cwdRealPath = fs.realpathSync(cwd);
  const candidatePath = path.resolve(cwd, trimmed);
  const resolvedPath = fs.realpathSync(candidatePath);

  if (resolvedPath !== cwdRealPath && !resolvedPath.startsWith(`${cwdRealPath}${path.sep}`)) {
    throw new AgwCliError("INVALID_INPUT", "json file path must stay within the current working directory", 2);
  }

  return resolvedPath;
}

export function parseJsonInput(raw: string, options: { cwd?: string } = {}): JsonRecord {
  const source = raw.trim() === "" ? "{}" : raw;
  const payload = source.startsWith("@")
    ? fs.readFileSync(resolveSafeJsonFilePath(source.slice(1), options.cwd), "utf8")
    : source;
  rejectDisallowedControlCharacters(payload, "json");

  const parsed = JSON.parse(payload) as unknown;
  if (!isJsonRecord(parsed)) {
    throw new AgwCliError("INVALID_INPUT", "json input must deserialize to an object", 2);
  }
  rejectControlCharactersInValue(parsed, "json");
  assertNoForbiddenRuntimeFields(parsed);
  return parsed;
}

export function parseFields(input: JsonRecord): string[] | undefined {
  if (input.fields === undefined) {
    return undefined;
  }
  if (!isStringArray(input.fields)) {
    throw new AgwCliError("INVALID_INPUT", "fields must be an array of strings", 2);
  }
  input.fields.forEach((field, index) => {
    rejectDisallowedControlCharacters(field, `fields[${index}]`);
    assertNoEmbeddedQueryFragments(field, `fields[${index}]`);
  });
  return input.fields;
}

export function parseOutputModeValue(value: unknown): AgwOutputMode | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (value !== "json" && value !== "ndjson") {
    throw new AgwCliError("INVALID_INPUT", 'output must be either "json" or "ndjson"', 2);
  }
  return value;
}

export function parseSanitizeProfileValue(value: unknown): AgwSanitizeProfile | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (value !== "off" && value !== "strict") {
    throw new AgwCliError("INVALID_INPUT", 'sanitize must be either "off" or "strict"', 2);
  }
  return value;
}

export function parsePageAll(input: JsonRecord): boolean | undefined {
  if (input.pageAll === undefined) {
    return undefined;
  }
  if (typeof input.pageAll !== "boolean") {
    throw new AgwCliError("INVALID_INPUT", "pageAll must be a boolean when provided", 2);
  }
  return input.pageAll;
}

function validateStringFormat(format: AgwSchema["format"], value: string, field: string): void {
  switch (format) {
    case "address":
      assertAddressString(value, field);
      return;
    case "decimal-string":
      assertDecimalString(value, field);
      return;
    case "hex":
      assertHexString(value, field);
      return;
    case "resource-id":
      assertNoEmbeddedQueryFragments(value, field);
      assertNoEncodedTraversal(value, field);
      return;
    case "url":
      try {
        new URL(value);
      } catch {
        throw new AgwCliError("INVALID_INPUT", `${field} must be a valid URL`, 2);
      }
      return;
    default:
      return;
  }
}

export function validateInputAgainstSchema(schema: AgwSchema, value: unknown, field: string): void {
  if (value === undefined) {
    return;
  }

  switch (schema.type) {
    case "string":
      if (typeof value !== "string") {
        throw new AgwCliError("INVALID_INPUT", `${field} must be a string`, 2);
      }
      rejectDisallowedControlCharacters(value, field);
      validateStringFormat(schema.format, value, field);
      return;
    case "number":
      if (typeof value !== "number" || !Number.isFinite(value)) {
        throw new AgwCliError("INVALID_INPUT", `${field} must be a finite number`, 2);
      }
      if (schema.minimum !== undefined && value < schema.minimum) {
        throw new AgwCliError("INVALID_INPUT", `${field} must be greater than or equal to ${schema.minimum}`, 2);
      }
      return;
    case "integer":
      if (typeof value !== "number" || !Number.isInteger(value)) {
        throw new AgwCliError("INVALID_INPUT", `${field} must be an integer`, 2);
      }
      if (schema.minimum !== undefined && value < schema.minimum) {
        throw new AgwCliError("INVALID_INPUT", `${field} must be greater than or equal to ${schema.minimum}`, 2);
      }
      return;
    case "boolean":
      if (typeof value !== "boolean") {
        throw new AgwCliError("INVALID_INPUT", `${field} must be a boolean`, 2);
      }
      return;
    case "null":
      if (value !== null) {
        throw new AgwCliError("INVALID_INPUT", `${field} must be null`, 2);
      }
      return;
    case "unknown":
      return;
    case "array":
      if (!Array.isArray(value)) {
        throw new AgwCliError("INVALID_INPUT", `${field} must be an array`, 2);
      }
      if (schema.minItems !== undefined && value.length < schema.minItems) {
        throw new AgwCliError("INVALID_INPUT", `${field} must contain at least ${schema.minItems} items`, 2);
      }
      value.forEach((entry, index) => validateInputAgainstSchema(schema.items, entry, `${field}[${index}]`));
      return;
    case "object":
      if (!isJsonRecord(value)) {
        throw new AgwCliError("INVALID_INPUT", `${field} must be an object`, 2);
      }
      for (const requiredField of schema.required ?? []) {
        if (value[requiredField] === undefined) {
          throw new AgwCliError("INVALID_INPUT", `${field}.${requiredField} is required`, 2);
        }
      }
      for (const [key, entry] of Object.entries(value)) {
        const propertySchema = schema.properties[key];
        if (propertySchema) {
          validateInputAgainstSchema(propertySchema, entry, `${field}.${key}`);
          continue;
        }
        if (schema.additionalProperties === false) {
          throw new AgwCliError("INVALID_INPUT", `${field}.${key} is not a supported field`, 2);
        }
        if (schema.additionalProperties && typeof schema.additionalProperties === "object") {
          validateInputAgainstSchema(schema.additionalProperties, entry, `${field}.${key}`);
        }
      }
      return;
  }
}
