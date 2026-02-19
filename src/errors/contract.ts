import { ZeroExQuoteError } from "../integrations/zeroex/quote-adapter.js";

export interface McpErrorContract {
  code: string;
  message: string;
  details: Record<string, unknown> | null;
  raw: {
    name: string;
    message: string;
  } | null;
}

export class McpToolError extends Error {
  readonly code: string;
  readonly details: Record<string, unknown> | null;
  readonly raw: { name: string; message: string } | null;

  constructor(input: {
    code: string;
    message: string;
    details?: Record<string, unknown> | null;
    raw?: { name: string; message: string } | null;
  }) {
    super(input.message);
    this.name = "McpToolError";
    this.code = input.code;
    this.details = input.details ?? null;
    this.raw = input.raw ?? null;
  }
}

function deriveCodeFromMessage(message: string): string {
  const normalized = message.toLowerCase();

  if (normalized.includes("session must be active")) {
    return "SESSION_INACTIVE";
  }
  if (normalized.includes("session is missing")) {
    return "SESSION_MISSING";
  }
  if (normalized.includes("unsupported chain id")) {
    return "NETWORK_UNSUPPORTED";
  }
  if (normalized.includes("must be a valid 0x-prefixed address") || normalized.includes("must be a hex string")) {
    return "VALIDATION_ERROR";
  }
  if (normalized.includes("policy") || normalized.includes("rejected") || normalized.includes("denied")) {
    return "POLICY_DENIED";
  }
  if (normalized.includes("insufficient funds")) {
    return "AGW_INSUFFICIENT_FUNDS";
  }
  if (normalized.includes("user rejected") || normalized.includes("user denied")) {
    return "USER_REJECTED";
  }

  return "INTERNAL_ERROR";
}

function toRaw(error: unknown): { name: string; message: string } | null {
  if (!(error instanceof Error)) {
    return null;
  }

  return {
    name: error.name,
    message: error.message,
  };
}

export function toMcpErrorContract(error: unknown, fallbackCode = "INTERNAL_ERROR"): McpErrorContract {
  if (error instanceof McpToolError) {
    return {
      code: error.code,
      message: error.message,
      details: error.details,
      raw: error.raw ?? toRaw(error),
    };
  }

  if (error instanceof ZeroExQuoteError) {
    return {
      code: error.code,
      message: error.message,
      details: {
        status: error.status ?? null,
        ...(error.details ?? {}),
      },
      raw: toRaw(error),
    };
  }

  if (error instanceof Error) {
    return {
      code: deriveCodeFromMessage(error.message) || fallbackCode,
      message: error.message,
      details: null,
      raw: toRaw(error),
    };
  }

  const message = String(error);
  return {
    code: fallbackCode,
    message,
    details: null,
    raw: {
      name: "UnknownError",
      message,
    },
  };
}

export function createMcpToolError(
  code: string,
  message: string,
  details?: Record<string, unknown> | null,
  raw?: { name: string; message: string } | null,
): McpToolError {
  return new McpToolError({
    code,
    message,
    details,
    raw,
  });
}
