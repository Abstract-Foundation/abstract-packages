import { describe, expect, it } from "vitest";
import { getPolicyPreview } from "../policy-validation";

describe("policy validation", () => {
  it("builds payments preset preview", () => {
    const preview = getPolicyPreview({
      presetId: "payments",
      nowUnixSeconds: 1_700_000_000,
    });

    expect(preview.presetId).toBe("payments");
    expect(preview.policyPayload.expiresAt).toBe(1_700_001_800);
    expect(preview.policyPayload.sessionConfig.maxValuePerUse).toBe(
      "5000000000000000",
    );
  });

  it("parses custom policy json", () => {
    const customPolicyJson = JSON.stringify({
      expiresInSeconds: 900,
      sessionConfig: {
        feeLimit: "1000",
        maxValuePerUse: "7",
        callPolicies: [],
        transferPolicies: [],
      },
    });

    const preview = getPolicyPreview({
      presetId: "custom",
      policyMode: "advanced",
      customPolicyJson,
      nowUnixSeconds: 1_700_000_000,
    });

    expect(preview.presetId).toBe("custom");
    expect(preview.policyPayload.expiresAt).toBe(1_700_000_900);
    expect(preview.policyPayload.sessionConfig.maxValuePerUse).toBe("7");
  });

  it("throws for malformed custom policy", () => {
    expect(() =>
      getPolicyPreview({
        presetId: "custom",
        policyMode: "advanced",
        customPolicyJson: "{invalid-json",
      }),
    ).toThrow("Invalid custom policy");
  });

  it("rejects custom policy with invalid call policy target", () => {
    const customPolicyJson = JSON.stringify({
      expiresInSeconds: 900,
      sessionConfig: {
        feeLimit: "1000",
        maxValuePerUse: "7",
        callPolicies: [{ target: "not-an-address", selector: "0x12345678" }],
        transferPolicies: [],
      },
    });

    expect(() =>
      getPolicyPreview({
        presetId: "custom",
        policyMode: "advanced",
        customPolicyJson,
      }),
    ).toThrow("Invalid custom policy");
  });

  it("rejects custom policy with invalid selector format", () => {
    const customPolicyJson = JSON.stringify({
      expiresInSeconds: 900,
      sessionConfig: {
        feeLimit: "1000",
        maxValuePerUse: "7",
        callPolicies: [
          {
            target: "0x1111111111111111111111111111111111111111",
            selector: "0x12",
          },
        ],
        transferPolicies: [],
      },
    });

    expect(() =>
      getPolicyPreview({
        presetId: "custom",
        policyMode: "advanced",
        customPolicyJson,
      }),
    ).toThrow("Invalid custom policy");
  });

  it("builds guided trading preset with app selection", () => {
    const preview = getPolicyPreview({
      presetId: "trading",
      nowUnixSeconds: 1_700_000_000,
      guidedDraft: {
        selectedAppIds: ["136"],
        transferTargets: [],
        expiresInSeconds: 3600,
        feeLimit: "1000",
        maxValuePerUse: "7",
      },
    });

    expect(preview.presetId).toBe("trading");
    expect(
      preview.policyPayload.sessionConfig.callPolicies.length,
    ).toBeGreaterThan(0);
    expect(preview.policyPayload.policyMeta?.selectedAppIds).toEqual(["136"]);
  });
});
