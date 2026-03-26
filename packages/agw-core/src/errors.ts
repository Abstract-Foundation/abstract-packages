export interface AgwCliErrorEnvelope {
  error: {
    code: string;
    details?: Record<string, unknown>;
    message: string;
  };
}

export class AgwCliError extends Error {
  readonly code: string;
  readonly details?: Record<string, unknown>;
  readonly exitCode: number;

  constructor(code: string, message: string, exitCode = 1, details?: Record<string, unknown>) {
    super(message);
    this.code = code;
    this.details = details;
    this.exitCode = exitCode;
  }
}

export function normalizeAgwError(error: unknown): AgwCliError {
  if (error instanceof AgwCliError) {
    return error;
  }

  const message = error instanceof Error ? error.message : String(error);
  const normalized = message.toLowerCase();

  if (normalized.includes("must be") || normalized.startsWith("invalid ") || normalized.includes("missing `")) {
    return new AgwCliError("INVALID_INPUT", message, 2);
  }
  if (
    normalized.includes("session must be active") ||
    normalized.includes("session is missing") ||
    normalized.includes("write signer is not configured") ||
    normalized.includes("active session")
  ) {
    return new AgwCliError("SESSION_NOT_READY", message, 1);
  }
  if (normalized.includes("unsupported chain id")) {
    return new AgwCliError("UNSUPPORTED_CHAIN", message, 2);
  }
  if (normalized.includes("not implemented")) {
    return new AgwCliError("NOT_IMPLEMENTED", message, 1);
  }

  return new AgwCliError("RUNTIME_ERROR", message, 1);
}

export function toErrorEnvelope(error: unknown): AgwCliErrorEnvelope {
  const normalized = normalizeAgwError(error);
  return {
    error: {
      code: normalized.code,
      details: normalized.details,
      message: normalized.message,
    },
  };
}
