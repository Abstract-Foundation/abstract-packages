import { AgwCliError } from "../errors.js";
import type { AgwSanitizeProfile } from "../registry/types.js";

function isJsonRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function sliceItemsWithCursor<T>(
  items: T[],
  cursor: unknown,
  pageSize: unknown,
): { items: T[]; nextCursor: string | null } {
  const offsetRaw =
    cursor === undefined
      ? 0
      : typeof cursor === "string"
        ? Number.parseInt(cursor, 10)
        : Number.NaN;
  if (!Number.isInteger(offsetRaw) || offsetRaw < 0) {
    throw new AgwCliError(
      "INVALID_INPUT",
      "cursor must be a non-negative integer string when provided",
      2,
    );
  }

  const size =
    pageSize === undefined
      ? items.length
      : typeof pageSize === "number" &&
          Number.isInteger(pageSize) &&
          pageSize > 0
        ? pageSize
        : Number.NaN;
  if (!Number.isInteger(size) || size <= 0) {
    throw new AgwCliError(
      "INVALID_INPUT",
      "pageSize must be a positive integer when provided",
      2,
    );
  }

  const sliced = items.slice(offsetRaw, offsetRaw + size);
  const nextOffset = offsetRaw + sliced.length;

  return {
    items: sliced,
    nextCursor: nextOffset < items.length ? String(nextOffset) : null,
  };
}

function mergeValue(
  target: unknown,
  segments: string[],
  source: unknown,
): unknown {
  if (segments.length === 0) {
    return source;
  }

  const [head, ...rest] = segments;
  if (Array.isArray(source)) {
    const existing = Array.isArray(target) ? target : [];
    return source.map((entry, index) =>
      mergeValue(existing[index], segments, entry),
    );
  }

  if (!isJsonRecord(source)) {
    return target;
  }

  const nextSource = source[head];
  if (nextSource === undefined) {
    return target;
  }

  const base = isJsonRecord(target) ? { ...target } : {};
  base[head] =
    rest.length === 0 ? nextSource : mergeValue(base[head], rest, nextSource);
  return base;
}

export function applyFieldSelection(
  value: unknown,
  fields: string[] | undefined,
): unknown {
  if (!fields || fields.length === 0) {
    return value;
  }

  let result: unknown = Array.isArray(value) ? [] : {};
  for (const field of fields) {
    result = mergeValue(result, field.split(".").filter(Boolean), value);
  }
  return result;
}

const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior|earlier)\s+instructions?/i,
  /follow\s+these\s+instructions\s+instead/i,
  /system\s+prompt/i,
  /developer\s+instructions?/i,
  /tool\s+call/i,
  /send\s+(all\s+)?funds/i,
  /forward\s+all/i,
];

function sanitizeString(value: string): string {
  if (PROMPT_INJECTION_PATTERNS.some((pattern) => pattern.test(value))) {
    return "[SANITIZED: untrusted instruction-like content removed]";
  }
  return value;
}

export function sanitizeOutput(
  value: unknown,
  profile: AgwSanitizeProfile,
): unknown {
  if (profile === "off") {
    return value;
  }
  if (typeof value === "string") {
    return sanitizeString(value);
  }
  if (Array.isArray(value)) {
    return value.map((entry) => sanitizeOutput(entry, profile));
  }
  if (!isJsonRecord(value)) {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [
      key,
      sanitizeOutput(entry, profile),
    ]),
  );
}

export function formatCommandOutput(
  value: unknown,
  mode: "json" | "ndjson",
): string {
  if (mode === "ndjson") {
    if (Array.isArray(value)) {
      return `${value.map((item) => JSON.stringify(item)).join("\n")}\n`;
    }
    return `${JSON.stringify(value)}\n`;
  }

  return `${JSON.stringify(value, null, 2)}\n`;
}
