import { canCallAddress, canCallTargetWithData, canTransferNativeValue } from "../src/policies/validate.js";

describe("policy validation", () => {
  const sessionConfig = {
    callPolicies: [{ target: "0xabc0000000000000000000000000000000000000", selector: "0xa9059cbb" }],
    transferPolicies: [{ tokenAddress: "0x0000000000000000000000000000000000000000", maxAmountBaseUnit: "100" }],
  };

  it("allows matching target and selector", () => {
    expect(canCallTargetWithData(sessionConfig, "0xAbC0000000000000000000000000000000000000", "0xa9059cbb000000")).toBe(true);
  });

  it("blocks non-matching selector", () => {
    expect(canCallTargetWithData(sessionConfig, "0xabc0000000000000000000000000000000000000", "0x23b872dd")).toBe(false);
  });

  it("allows target-only check", () => {
    expect(canCallAddress(sessionConfig, "0xabc0000000000000000000000000000000000000")).toBe(true);
  });

  it("enforces transfer cap", () => {
    expect(canTransferNativeValue(sessionConfig, 50n)).toBe(true);
    expect(canTransferNativeValue(sessionConfig, 200n)).toBe(false);
  });
});
