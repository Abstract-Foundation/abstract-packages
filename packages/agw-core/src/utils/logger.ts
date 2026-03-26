export type LogLevel = "INFO" | "WARN" | "ERROR" | "DEBUG";

const REDACTED = "[REDACTED]";
const SENSITIVE_KEYS = new Set([
  "sessionsignerref",
  "signerref",
  "sessionsigner",
  "privatekey",
  "secret",
  "mnemonic",
  "seedphrase",
  "apikey",
  "accesstoken",
]);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function redactSensitiveData(value: unknown, keyHint?: string): unknown {
  const normalizedKey = keyHint?.toLowerCase();
  if (normalizedKey && SENSITIVE_KEYS.has(normalizedKey)) {
    if (normalizedKey === "sessionsignerref" && isPlainObject(value)) {
      const kind = typeof value.kind === "string" ? value.kind : "redacted";
      return { kind, value: REDACTED };
    }
    return REDACTED;
  }

  if (Array.isArray(value)) {
    return value.map(item => redactSensitiveData(item));
  }

  if (isPlainObject(value)) {
    const redacted: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value)) {
      redacted[key] = redactSensitiveData(entry, key);
    }
    return redacted;
  }

  return value;
}

function redactKeyValueFragments(message: string): string {
  let sanitized = message;

  sanitized = sanitized.replace(
    /("sessionSignerRef"\s*:\s*\{[^{}]*"value"\s*:\s*)"[^"]*"/gi,
    `$1"${REDACTED}"`,
  );
  sanitized = sanitized.replace(
    /("(?:sessionSignerRef(?:\\.value)?|signerRef|sessionSigner|privateKey|secret|mnemonic|seedPhrase|apiKey|accessToken)"\s*:\s*)"[^"]*"/gi,
    `$1"${REDACTED}"`,
  );
  sanitized = sanitized.replace(
    /\b(sessionSignerRef(?:\.value)?|signerRef|sessionSigner|privateKey|secret|mnemonic|seed(?:Phrase)?|apiKey|accessToken)\b(\s*[:=]\s*)("[^"]*"|'[^']*'|[^,\s\]}]+)/gi,
    (_match, key: string, separator: string) => `${key}${separator}${REDACTED}`,
  );
  sanitized = sanitized.replace(/\b0x[a-fA-F0-9]{64}\b/g, REDACTED);

  return sanitized;
}

function sanitizeMessage(message: string): string {
  const trimmed = message.trim();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      return JSON.stringify(redactSensitiveData(parsed));
    } catch {
      // Fall through to fragment-based redaction.
    }
  }
  return redactKeyValueFragments(message);
}

export class Logger {
  constructor(private readonly context = "agw") {}

  private write(level: LogLevel, message: string): void {
    const timestamp = new Date().toISOString();
    process.stderr.write(`[${timestamp}] [${level}] [${this.context}] ${sanitizeMessage(message)}\n`);
  }

  info(message: string): void {
    this.write("INFO", message);
  }

  warn(message: string): void {
    this.write("WARN", message);
  }

  error(message: string): void {
    this.write("ERROR", message);
  }

  debug(message: string): void {
    if (process.env.DEBUG || process.env.AGW_DEBUG) {
      this.write("DEBUG", message);
    }
  }

  child(childContext: string): Logger {
    return new Logger(`${this.context}:${childContext}`);
  }
}
