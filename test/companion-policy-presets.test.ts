import {
  buildPolicyPreview,
  getDefaultCustomPolicyTemplate,
  parseCustomPolicyTemplate,
  listPolicyPresets,
  type SessionPolicyPresetTemplate,
} from "../companion/src/policies/index.js";
import { BUILT_IN_POLICY_PRESETS, CUSTOM_PRESET, DEFAULT_CUSTOM_TEMPLATE } from "../companion/src/policies/templates.js";

describe("companion policy presets", () => {
  it("lists built-in presets plus custom mode", () => {
    expect(listPolicyPresets()).toEqual([
      {
        id: "transfer",
        label: "Transfer",
        description: "Native ETH transfers with a per-transaction cap. Specify allowed recipients.",
        customMode: false,
      },
      {
        id: "custom",
        label: "Custom",
        description: "Define exact call targets, transfer recipients, and limits.",
        customMode: true,
      },
    ]);
  });

  it("builds preview payload for transfer preset", () => {
    const preview = buildPolicyPreview({
      presetId: "transfer",
      nowUnixSeconds: 1_700_000_000,
    });

    expect(preview).toEqual({
      presetId: "transfer",
      label: "Transfer",
      description: "Native ETH transfers with a per-transaction cap. Specify allowed recipients.",
      policyPayload: {
        expiresAt: 1_700_003_600,
        sessionConfig: {
          feeLimit: "2000000000000000",
          maxValuePerUse: "10000000000000000",
          callPolicies: [],
          transferPolicies: [],
        },
      },
    });
  });

  it("validates built-in presets before generating preview payloads", () => {
    const originalFeeLimit = BUILT_IN_POLICY_PRESETS.transfer.sessionConfig.feeLimit;
    BUILT_IN_POLICY_PRESETS.transfer.sessionConfig.feeLimit = "not-a-base10-integer";

    try {
      expect(() =>
        buildPolicyPreview({ presetId: "transfer" }),
      ).toThrow('Invalid policy preset template "transfer"');
    } finally {
      BUILT_IN_POLICY_PRESETS.transfer.sessionConfig.feeLimit = originalFeeLimit;
    }
  });

  it("fails closed when built-in preset metadata is corrupted", () => {
    const originalCustomMode = BUILT_IN_POLICY_PRESETS.transfer.customMode;
    BUILT_IN_POLICY_PRESETS.transfer.customMode = true;

    try {
      expect(() =>
        buildPolicyPreview({ presetId: "transfer" }),
      ).toThrow('Invalid policy preset template "transfer"');
    } finally {
      BUILT_IN_POLICY_PRESETS.transfer.customMode = originalCustomMode;
    }
  });

  it("fails closed when built-in preset description is corrupted during preview", () => {
    const originalDescription = BUILT_IN_POLICY_PRESETS.transfer.description;
    BUILT_IN_POLICY_PRESETS.transfer.description = "";

    try {
      expect(() =>
        buildPolicyPreview({ presetId: "transfer" }),
      ).toThrow('Invalid policy preset template "transfer"');
    } finally {
      BUILT_IN_POLICY_PRESETS.transfer.description = originalDescription;
    }
  });

  it("fails closed when built-in preset template contains unknown top-level keys", () => {
    const mutablePreset = BUILT_IN_POLICY_PRESETS.transfer as unknown as Record<string, unknown>;
    const hadUnexpected = Object.prototype.hasOwnProperty.call(mutablePreset, "unexpected");
    const originalUnexpected = mutablePreset.unexpected;
    mutablePreset.unexpected = true;

    try {
      expect(() => listPolicyPresets()).toThrow('Invalid policy preset template "transfer": template. Unexpected key: unexpected.');
      expect(() =>
        buildPolicyPreview({ presetId: "transfer" }),
      ).toThrow('Invalid policy preset template "transfer": template. Unexpected key: unexpected.');
    } finally {
      if (hadUnexpected) {
        mutablePreset.unexpected = originalUnexpected;
      } else {
        delete mutablePreset.unexpected;
      }
    }
  });

  it("fails closed when built-in preset customMode is corrupted during listing", () => {
    const originalCustomMode = BUILT_IN_POLICY_PRESETS.transfer.customMode;
    BUILT_IN_POLICY_PRESETS.transfer.customMode = true;

    try {
      expect(() => listPolicyPresets()).toThrow('Invalid policy preset template "transfer"');
    } finally {
      BUILT_IN_POLICY_PRESETS.transfer.customMode = originalCustomMode;
    }
  });

  it("fails closed when listing presets if built-in preset metadata is corrupted", () => {
    const originalLabel = BUILT_IN_POLICY_PRESETS.transfer.label;
    BUILT_IN_POLICY_PRESETS.transfer.label = "";

    try {
      expect(() => listPolicyPresets()).toThrow('Invalid policy preset template "transfer"');
    } finally {
      BUILT_IN_POLICY_PRESETS.transfer.label = originalLabel;
    }
  });

  it("fails closed when custom preset metadata is corrupted during listing", () => {
    const originalLabel = CUSTOM_PRESET.label;
    CUSTOM_PRESET.label = "";

    try {
      expect(() => listPolicyPresets()).toThrow("Invalid custom preset metadata: label must be a non-empty string.");
    } finally {
      CUSTOM_PRESET.label = originalLabel;
    }
  });

  it("fails closed when custom preset id metadata is corrupted during preview", () => {
    const mutableCustomPreset = CUSTOM_PRESET as unknown as { id: string };
    const originalId = mutableCustomPreset.id;
    mutableCustomPreset.id = "transfer";

    try {
      expect(() =>
        buildPolicyPreview({ presetId: "custom" }),
      ).toThrow('Invalid custom preset metadata: id must be "custom".');
    } finally {
      mutableCustomPreset.id = originalId;
    }
  });

  it("fails closed when custom preset customMode metadata is corrupted during preview", () => {
    const mutableCustomPreset = CUSTOM_PRESET as unknown as { customMode: boolean };
    const originalCustomMode = mutableCustomPreset.customMode;
    mutableCustomPreset.customMode = false;

    try {
      expect(() =>
        buildPolicyPreview({ presetId: "custom" }),
      ).toThrow("Invalid custom preset metadata: customMode must be true.");
    } finally {
      mutableCustomPreset.customMode = originalCustomMode;
    }
  });

  it("fails closed when custom preset description metadata is corrupted during listing", () => {
    const mutableCustomPreset = CUSTOM_PRESET as unknown as { description: string };
    const originalDescription = mutableCustomPreset.description;
    mutableCustomPreset.description = "";

    try {
      expect(() => listPolicyPresets()).toThrow(
        "Invalid custom preset metadata: description must be a non-empty string.",
      );
    } finally {
      mutableCustomPreset.description = originalDescription;
    }
  });

  it("fails closed when custom preset metadata contains unexpected keys", () => {
    const mutableCustomPreset = CUSTOM_PRESET as unknown as Record<string, unknown>;
    const hadUnexpected = Object.prototype.hasOwnProperty.call(mutableCustomPreset, "unexpected");
    const originalUnexpected = mutableCustomPreset.unexpected;
    mutableCustomPreset.unexpected = true;

    try {
      expect(() => listPolicyPresets()).toThrow("Invalid custom preset metadata: unexpected key \"unexpected\".");
      expect(() =>
        buildPolicyPreview({ presetId: "custom" }),
      ).toThrow("Invalid custom preset metadata: unexpected key \"unexpected\".");
    } finally {
      if (hadUnexpected) {
        mutableCustomPreset.unexpected = originalUnexpected;
      } else {
        delete mutableCustomPreset.unexpected;
      }
    }
  });

  it("fails closed when a built-in preset id mismatches its registry key", () => {
    const originalId = BUILT_IN_POLICY_PRESETS.transfer.id;
    BUILT_IN_POLICY_PRESETS.transfer.id = "custom";

    try {
      expect(() =>
        buildPolicyPreview({ presetId: "transfer" }),
      ).toThrow('Invalid policy preset registry: key "transfer" does not match preset id "custom".');
    } finally {
      BUILT_IN_POLICY_PRESETS.transfer.id = originalId;
    }
  });

  it("fails closed when a built-in preset registry entry is missing", () => {
    const originalPreset = BUILT_IN_POLICY_PRESETS.transfer;
    (BUILT_IN_POLICY_PRESETS as Record<string, SessionPolicyPresetTemplate | undefined>).transfer = undefined;

    try {
      expect(() =>
        buildPolicyPreview({ presetId: "transfer" }),
      ).toThrow('Invalid policy preset registry: missing preset template for key "transfer".');
      expect(() => listPolicyPresets()).toThrow(
        'Invalid policy preset registry: missing preset template for key "transfer".',
      );
    } finally {
      (BUILT_IN_POLICY_PRESETS as Record<string, SessionPolicyPresetTemplate | undefined>).transfer = originalPreset;
    }
  });

  it("returns isolated preview payloads for repeated preset requests", () => {
    const first = buildPolicyPreview({
      presetId: "transfer",
      nowUnixSeconds: 1_700_000_000,
    });

    first.policyPayload.sessionConfig.feeLimit = "1";

    const second = buildPolicyPreview({
      presetId: "transfer",
      nowUnixSeconds: 1_700_000_000,
    });

    expect(second.policyPayload.sessionConfig.feeLimit).toBe("2000000000000000");
  });

  it("supports validated custom mode previews", () => {
    const customTemplate: SessionPolicyPresetTemplate = {
      id: "custom",
      label: "Custom",
      description: "custom",
      customMode: true,
      expiresInSeconds: 900,
      sessionConfig: {
        feeLimit: "1000000000000000",
        maxValuePerUse: "42",
        callPolicies: [{ target: "0xabc0000000000000000000000000000000000000", selector: "0xa9059cbb" }],
        transferPolicies: [{ target: "0xdef0000000000000000000000000000000000000", maxValuePerUse: "42" }],
      },
    };

    const preview = buildPolicyPreview({
      presetId: "custom",
      customTemplate,
      nowUnixSeconds: 1_700_000_000,
    });

    expect(preview.policyPayload.expiresAt).toBe(1_700_000_900);
    expect(preview.policyPayload.sessionConfig.maxValuePerUse).toBe("42");
  });

  it("ignores custom template input when a built-in preset is selected", () => {
    const preview = buildPolicyPreview({
      presetId: "transfer",
      customTemplate: {
        id: "custom",
        label: "Custom",
        description: "custom",
        customMode: true,
        expiresInSeconds: 900,
        sessionConfig: {
          feeLimit: "1000000000000000",
          maxValuePerUse: "42",
          callPolicies: [{ target: "0xabc0000000000000000000000000000000000000", selector: "0xa9059cbb" }],
          transferPolicies: [{ target: "0xdef0000000000000000000000000000000000000", maxValuePerUse: "42" }],
        },
      },
      nowUnixSeconds: 1_700_000_000,
    });

    expect(preview.presetId).toBe("transfer");
    expect(preview.policyPayload.sessionConfig.maxValuePerUse).toBe("10000000000000000");
  });

  it("rejects invalid custom templates", () => {
    const invalidTemplate: SessionPolicyPresetTemplate = {
      id: "custom",
      label: "Custom",
      description: "custom",
      customMode: true,
      expiresInSeconds: 0,
      sessionConfig: {
        feeLimit: "100",
        maxValuePerUse: "1",
        callPolicies: [{ target: "not-an-address" }],
        transferPolicies: [],
      },
    };

    expect(() =>
      buildPolicyPreview({ presetId: "custom", customTemplate: invalidTemplate }),
    ).toThrow("Invalid custom policy");
  });

  it("rejects malformed custom templates with validation error messaging", () => {
    expect(() =>
      buildPolicyPreview({
        presetId: "custom",
        customTemplate: {
          id: "custom",
          label: "Custom",
          description: "custom",
          customMode: true,
          expiresInSeconds: 900,
          sessionConfig: {
            feeLimit: "100",
            maxValuePerUse: "1",
            callPolicies: undefined,
            transferPolicies: [],
          },
        } as unknown as SessionPolicyPresetTemplate,
      }),
    ).toThrow("Invalid custom policy: callPolicies must be an array.");
  });

  it("rejects unknown preset ids", () => {
    expect(() =>
      buildPolicyPreview({ presetId: "unsafe_unbounded" }),
    ).toThrow("Unknown policy preset");
  });

  it("rejects preview generation when nowUnixSeconds is invalid", () => {
    expect(() =>
      buildPolicyPreview({ presetId: "transfer", nowUnixSeconds: Number.NaN }),
    ).toThrow("Invalid policy preview time.");
  });

  it("uses the default custom template when custom template is missing", () => {
    const preview = buildPolicyPreview({
      presetId: "custom",
      nowUnixSeconds: 1_700_000_000,
    });

    expect(preview.policyPayload).toEqual({
      expiresAt: 1_700_003_600,
      sessionConfig: {
        feeLimit: "2000000000000000",
        maxValuePerUse: "10000000000000000",
        callPolicies: [],
        transferPolicies: [],
      },
    });
  });

  it("fails closed when default custom template metadata is corrupted", () => {
    const originalExpiry = DEFAULT_CUSTOM_TEMPLATE.expiresInSeconds;
    DEFAULT_CUSTOM_TEMPLATE.expiresInSeconds = 60;

    try {
      expect(() => getDefaultCustomPolicyTemplate()).toThrow("Invalid default custom policy template:");
    } finally {
      DEFAULT_CUSTOM_TEMPLATE.expiresInSeconds = originalExpiry;
    }
  });

  it("fails closed when listing presets if default custom template is corrupted", () => {
    const originalExpiry = DEFAULT_CUSTOM_TEMPLATE.expiresInSeconds;
    DEFAULT_CUSTOM_TEMPLATE.expiresInSeconds = 60;

    try {
      expect(() => listPolicyPresets()).toThrow("Invalid default custom policy template:");
    } finally {
      DEFAULT_CUSTOM_TEMPLATE.expiresInSeconds = originalExpiry;
    }
  });

  it("parses custom JSON policy input into custom template shape", () => {
    const parsed = parseCustomPolicyTemplate(
      JSON.stringify({
        expiresInSeconds: "900",
        sessionConfig: {
          feeLimit: " 1000 ",
          maxValuePerUse: " 42 ",
          callPolicies: [{ target: " 0xabc0000000000000000000000000000000000000 ", selector: " 0xa9059cbb " }],
          transferPolicies: [{ target: " 0xdef0000000000000000000000000000000000000 ", maxValuePerUse: " 7 " }],
        },
      }),
    );

    expect(parsed).toEqual({
      id: "custom",
      label: "Custom",
      description: "Define exact call targets, transfer recipients, and limits.",
      customMode: true,
      expiresInSeconds: 900,
      sessionConfig: {
        feeLimit: "1000",
        maxValuePerUse: "42",
        callPolicies: [{ target: "0xabc0000000000000000000000000000000000000", selector: "0xa9059cbb" }],
        transferPolicies: [{ target: "0xdef0000000000000000000000000000000000000", maxValuePerUse: "7" }],
      },
    });
  });

  it("rejects malformed custom JSON policy input", () => {
    expect(() => parseCustomPolicyTemplate("{not-json}")).toThrow("Invalid custom policy. Expected JSON input.");
  });

  it("rejects semantically invalid custom policy input during parsing", () => {
    expect(() =>
      parseCustomPolicyTemplate(
        JSON.stringify({
          expiresInSeconds: 60,
          sessionConfig: {
            feeLimit: "1000",
            maxValuePerUse: "1",
            callPolicies: [],
            transferPolicies: [],
          },
        }),
      ),
    ).toThrow("Invalid custom policy");
  });

  it("rejects unknown top-level custom policy keys", () => {
    expect(() =>
      parseCustomPolicyTemplate(
        JSON.stringify({
          expiresInSeconds: 900,
          sessionConfig: {
            feeLimit: "1000",
            maxValuePerUse: "1",
            callPolicies: [],
            transferPolicies: [],
          },
          extra: "field",
        }),
      ),
    ).toThrow("Invalid custom policy. Unexpected key: extra.");
  });

  it("rejects unknown custom sessionConfig keys", () => {
    expect(() =>
      parseCustomPolicyTemplate(
        JSON.stringify({
          expiresInSeconds: 900,
          sessionConfig: {
            feeLimit: "1000",
            maxValuePerUse: "1",
            callPolicies: [],
            transferPolicies: [],
            unexpected: "field",
          },
        }),
      ),
    ).toThrow("Invalid custom policy sessionConfig. Unexpected key: unexpected.");
  });

  it("rejects custom call policies with unknown keys", () => {
    expect(() =>
      parseCustomPolicyTemplate(
        JSON.stringify({
          expiresInSeconds: 900,
          sessionConfig: {
            feeLimit: "1000",
            maxValuePerUse: "1",
            callPolicies: [
              {
                target: "0xabc0000000000000000000000000000000000000",
                selectorr: "0xa9059cbb",
              },
            ],
            transferPolicies: [],
          },
        }),
      ),
    ).toThrow("Invalid custom policy callPolicies[0]. Unexpected key: selectorr.");
  });

  it("rejects custom transfer policies with unknown keys", () => {
    expect(() =>
      parseCustomPolicyTemplate(
        JSON.stringify({
          expiresInSeconds: 900,
          sessionConfig: {
            feeLimit: "1000",
            maxValuePerUse: "1",
            callPolicies: [],
            transferPolicies: [
              {
                target: "0xdef0000000000000000000000000000000000000",
                maxValuePerUse: "7",
                note: "extra",
              },
            ],
          },
        }),
      ),
    ).toThrow("Invalid custom policy transferPolicies[0]. Unexpected key: note.");
  });
});
