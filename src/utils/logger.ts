export type LogLevel = "INFO" | "WARN" | "ERROR" | "DEBUG";

export class Logger {
  constructor(private readonly context = "agw-mcp") {}

  private write(level: LogLevel, message: string): void {
    const timestamp = new Date().toISOString();
    process.stderr.write(`[${timestamp}] [${level}] [${this.context}] ${message}\n`);
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
    if (process.env.DEBUG || process.env.AGW_MCP_DEBUG) {
      this.write("DEBUG", message);
    }
  }

  child(childContext: string): Logger {
    return new Logger(`${this.context}:${childContext}`);
  }
}
