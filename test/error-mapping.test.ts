import { createMcpToolError, toMcpErrorContract } from "../packages/agw-core/src/errors/contract.js";

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

  it("derives known codes from generic errors", () => {
    const mapped = toMcpErrorContract(new Error("session must be active (current status: missing)"));

    expect(mapped.code).toBe("SESSION_INACTIVE");
    expect(mapped.message).toContain("session must be active");
  });
});
