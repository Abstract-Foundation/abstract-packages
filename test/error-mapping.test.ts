import { ZeroExQuoteError } from "../src/integrations/zeroex/quote-adapter.js";
import { createMcpToolError, toMcpErrorContract } from "../src/errors/contract.js";

describe("error mapping", () => {
  it("preserves structured McpToolError fields", () => {
    const mapped = toMcpErrorContract(
      createMcpToolError("POLICY_DENIED", "blocked", {
        reason: "selector",
      }),
    );

    expect(mapped).toEqual({
      code: "POLICY_DENIED",
      message: "blocked",
      details: {
        reason: "selector",
      },
      raw: {
        name: "McpToolError",
        message: "blocked",
      },
    });
  });

  it("maps 0x adapter errors into deterministic contract", () => {
    const mapped = toMcpErrorContract(
      new ZeroExQuoteError({
        code: "ZEROEX_HTTP_ERROR",
        message: "quote failed",
        status: 500,
        details: {
          body: "oops",
        },
      }),
    );

    expect(mapped).toEqual({
      code: "ZEROEX_HTTP_ERROR",
      message: "quote failed",
      details: {
        status: 500,
        body: "oops",
      },
      raw: {
        name: "ZeroExQuoteError",
        message: "quote failed",
      },
    });
  });

  it("derives known codes from generic errors", () => {
    const mapped = toMcpErrorContract(new Error("session must be active (current status: missing)"));

    expect(mapped.code).toBe("SESSION_INACTIVE");
    expect(mapped.message).toContain("session must be active");
  });
});
