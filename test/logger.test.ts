import { Logger } from "../packages/agw-core/src/utils/logger.js";

describe("Logger", () => {
  let stderrWriteSpy: jest.SpyInstance;

  beforeEach(() => {
    stderrWriteSpy = jest.spyOn(process.stderr, "write").mockImplementation(() => true);
  });

  afterEach(() => {
    stderrWriteSpy.mockRestore();
  });

  it("creates child logger", () => {
    const logger = new Logger("root");
    const child = logger.child("child");
    expect(child).toBeInstanceOf(Logger);
  });

  it("redacts session signer material from structured log messages", () => {
    const logger = new Logger("root");
    const signerSecret = "SESSION_SIGNER_SECRET_123";

    logger.error(`bootstrap failed: {"sessionSignerRef":{"kind":"raw","value":"${signerSecret}"}}`);

    const output = stderrWriteSpy.mock.calls.map(call => String(call[0])).join("");
    expect(output).toContain("[REDACTED]");
    expect(output).not.toContain(signerSecret);
  });

  it("redacts signer key-value fragments in log messages", () => {
    const logger = new Logger("root");
    const signerSecret = "file:///tmp/agw-private-key.json";

    logger.warn(`session error signerRef=${signerSecret}`);

    const output = stderrWriteSpy.mock.calls.map(call => String(call[0])).join("");
    expect(output).toContain("signerRef=[REDACTED]");
    expect(output).not.toContain(signerSecret);
  });
});
