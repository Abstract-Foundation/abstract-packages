import { describe, expect, it } from "vitest";
import { compileGuidedPolicy } from "../policy-compiler";

describe("policy compiler", () => {
  it("builds selector-scoped call policies for curated app selectors", () => {
    const compiled = compileGuidedPolicy({
      presetId: "trading",
      expiresInSeconds: 3600,
      feeLimit: "2000000000000000",
      maxValuePerUse: "5000000000000000",
      selectedAppIds: ["136"],
      transferTargets: [],
    });

    expect(compiled.sessionConfig.callPolicies).toEqual([
      {
        target: "0x3272596F776470D2D7C3f7dfF3dc50888b7D8967",
        selector: "0x5d7a2f89",
      },
      {
        target: "0x3272596F776470D2D7C3f7dfF3dc50888b7D8967",
        selector: "0x379607f5",
      },
      {
        target: "0x3272596F776470D2D7C3f7dfF3dc50888b7D8967",
        selector: "0x83a84ba9",
      },
      {
        target: "0xe6765C9cb1B42D3CC36Fcd3D2B4fc938db456EaD",
        selector: "0x4a5eafef",
      },
    ]);
    expect(compiled.sessionConfig.transferPolicies).toEqual([]);
    expect(
      compiled.sessionConfig.callPolicies.every((policy) =>
        Boolean(policy.selector),
      ),
    ).toBe(true);
  });

  it("does not emit unscoped call policies for legacy high-risk presets", () => {
    const compiled = compileGuidedPolicy({
      presetId: "full_app_control",
      expiresInSeconds: 3600,
      feeLimit: "2000000000000000",
      maxValuePerUse: "5000000000000000",
      selectedAppIds: ["136"],
      transferTargets: [],
    });

    expect(
      compiled.sessionConfig.callPolicies.every((policy) =>
        Boolean(policy.selector),
      ),
    ).toBe(true);
  });

  it("only includes explicit recipient transfer targets for payments", () => {
    const compiled = compileGuidedPolicy({
      presetId: "payments",
      expiresInSeconds: 3600,
      feeLimit: "2000000000000000",
      maxValuePerUse: "5000000000000000",
      selectedAppIds: [],
      transferTargets: ["0x1111111111111111111111111111111111111111"],
    });

    expect(compiled.sessionConfig.transferPolicies).toEqual([
      {
        target: "0x1111111111111111111111111111111111111111",
        maxValuePerUse: "5000000000000000",
      },
    ]);
  });
});
