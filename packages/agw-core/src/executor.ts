import { getCommandDefinition } from "./command-registry.js";
import { resolveOutputMode, resolveSanitizeProfile } from "./config/runtime.js";
import { AgwCliError, normalizeAgwError } from "./errors.js";
import { createToolContext } from "./execution/context.js";
import { commandHandlers } from "./execution/handlers/index.js";
import {
  applyFieldSelection,
  formatCommandOutput,
  sanitizeOutput,
} from "./execution/output.js";
import type { CommandRuntimeOptions, JsonRecord } from "./execution/types.js";
import {
  parseFields,
  parseJsonInput,
  parseOutputModeValue,
  parsePageAll,
  parseSanitizeProfileValue,
  validateInputAgainstSchema,
} from "./execution/validation.js";
import type {
  AgwExecutableCommandDefinition,
  AgwOutputMode,
} from "./registry/types.js";

export {
  applyFieldSelection,
  formatCommandOutput,
  type JsonRecord,
  parseJsonInput,
};

function normalizeExecuteFlag(
  input: JsonRecord,
  options: CommandRuntimeOptions,
  supportsExecution: boolean,
): JsonRecord {
  if (!supportsExecution) {
    return input;
  }

  if (options.dryRun && options.execute) {
    throw new AgwCliError(
      "INVALID_INPUT",
      "dry-run and execute cannot both be enabled",
      2,
    );
  }

  const payloadExecute = input.execute;
  if (payloadExecute !== undefined && typeof payloadExecute !== "boolean") {
    throw new AgwCliError(
      "INVALID_INPUT",
      "execute must be a boolean when provided",
      2,
    );
  }

  if (options.dryRun && payloadExecute === true) {
    throw new AgwCliError(
      "INVALID_INPUT",
      "dry-run cannot be combined with execute=true in the payload",
      2,
    );
  }
  if (
    options.execute !== undefined &&
    payloadExecute !== undefined &&
    options.execute !== payloadExecute
  ) {
    throw new AgwCliError(
      "INVALID_INPUT",
      "execute flag conflicts with payload execute value",
      2,
    );
  }

  const execute =
    options.execute ?? (options.dryRun ? false : payloadExecute === true);
  return {
    ...input,
    execute,
  };
}

function isPaginatedResult(
  value: unknown,
): value is { items: unknown[]; nextCursor?: string | null } {
  return (
    Boolean(value) &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Array.isArray((value as { items?: unknown[] }).items)
  );
}

function aggregatePaginatedPages(pages: unknown[]): unknown {
  if (pages.length === 0 || !pages.every(isPaginatedResult)) {
    return pages;
  }

  const firstPage = pages[0] as Record<string, unknown>;
  const mergedItems = pages.flatMap(
    (page) => (page as { items: unknown[] }).items,
  );

  return {
    ...firstPage,
    items: mergedItems,
    nextCursor: null,
    pageCount: pages.length,
  };
}

async function executeHandler(
  commandId: string,
  input: JsonRecord,
  options: CommandRuntimeOptions,
): Promise<{
  definition: NonNullable<ReturnType<typeof getCommandDefinition>>;
  rawResult: unknown;
  outputMode: AgwOutputMode;
}> {
  const definition = getCommandDefinition(commandId);
  if (!definition || definition.kind !== "command") {
    throw new AgwCliError(
      "UNKNOWN_COMMAND",
      `Unknown command: ${commandId}`,
      2,
    );
  }
  const executableDefinition = definition as AgwExecutableCommandDefinition;

  const handler = commandHandlers[commandId];
  if (!handler) {
    throw new AgwCliError(
      "NOT_IMPLEMENTED",
      `Command "${commandId}" is registered but not implemented yet.`,
      1,
    );
  }

  try {
    const normalizedInput = normalizeExecuteFlag(
      input,
      options,
      executableDefinition.mutation.supportsExecution,
    );
    validateInputAgainstSchema(
      executableDefinition.requestSchema,
      normalizedInput,
      "json",
    );
    const context = createToolContext(normalizedInput, options);
    const payloadOutputMode = parseOutputModeValue(normalizedInput.output);
    const outputMode = resolveOutputMode({
      explicit: options.outputMode,
      payload: payloadOutputMode,
      defaultMode: executableDefinition.output.defaultMode,
      supportsPagination: executableDefinition.output.supportsPagination,
      stdoutIsTTY: options.stdoutIsTTY,
      env: options.env,
    });
    const pageAll = options.pageAll ?? parsePageAll(normalizedInput) ?? false;
    if (pageAll && !executableDefinition.output.supportsPageAll) {
      throw new AgwCliError(
        "INVALID_INPUT",
        `Command "${commandId}" does not support pageAll`,
        2,
      );
    }

    if (!pageAll) {
      const rawResult = await handler(normalizedInput, context);
      return { definition: executableDefinition, rawResult, outputMode };
    }

    const pages: unknown[] = [];
    let cursor = normalizedInput.cursor;
    do {
      const pageInput =
        cursor === undefined ? normalizedInput : { ...normalizedInput, cursor };
      const page = await handler(pageInput, context);
      pages.push(page);
      cursor = isPaginatedResult(page)
        ? (page.nextCursor ?? undefined)
        : undefined;
    } while (cursor !== undefined && cursor !== null);

    return {
      definition: executableDefinition,
      rawResult:
        outputMode === "ndjson" ? pages : aggregatePaginatedPages(pages),
      outputMode,
    };
  } catch (error) {
    throw normalizeAgwError(error);
  }
}

export async function executeCommand(
  commandId: string,
  input: JsonRecord,
  options: CommandRuntimeOptions = {},
): Promise<{ result: unknown; outputMode: AgwOutputMode }> {
  const { definition, rawResult, outputMode } = await executeHandler(
    commandId,
    input,
    options,
  );
  const fields = parseFields(input);
  const resultWithFields =
    Array.isArray(rawResult) && definition.output.supportsPagination
      ? rawResult.map((page) => applyFieldSelection(page, fields))
      : applyFieldSelection(rawResult, fields);
  const sanitizeProfile = resolveSanitizeProfile({
    explicit:
      options.sanitizeProfile ?? parseSanitizeProfileValue(input.sanitize),
    defaultProfile: definition.sanitization?.defaultProfile ?? "off",
    env: options.env,
  });
  const result = definition.sanitization?.supported
    ? sanitizeOutput(resultWithFields, sanitizeProfile)
    : resultWithFields;

  return { result, outputMode };
}
