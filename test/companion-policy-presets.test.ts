import {
  buildPolicyPreview,
  getDefaultCustomPolicyTemplate,
  parseCustomPolicyTemplate,
  listPolicyPresets,
  type SessionPolicyPresetTemplate,
} from "../companion/src/policies/index.js";
import { BUILT_IN_POLICY_PRESETS, CUSTOM_PRESET, DEFAULT_CUSTOM_TEMPLATE } from "../companion/src/policies/templates.js";

describe("companion policy presets", () => {
  it("lists safe presets plus custom mode", () => {
    expect(listPolicyPresets()).toEqual([
      {
        id: "read_only",
        label: "Read Only",
        description: "Short-lived session for read/sign flows with zero transfer allowance.",
        customMode: false,
      },
      {
        id: "transfer",
        label: "Transfer",
        description: "Session preset for bounded native transfers.",
        customMode: false,
      },
      {
        id: "swap",
        label: "Swap",
        description: "Session preset for swap workflows with explicit call + value limits.",
        customMode: false,
      },
      {
        id: "contract_write",
        label: "Contract Write",
        description: "Session preset for contract writes with strict expiry and explicit policy customization.",
        customMode: false,
      },
      {
        id: "read_and_sign",
        label: "Read + Sign",
        description: "Short-lived session that allows signing but no value transfer.",
        customMode: false,
      },
      {
        id: "limited_spend",
        label: "Limited Spend",
        description: "Short-lived session with a strict native token spend cap.",
        customMode: false,
      },
      {
        id: "custom",
        label: "Custom",
        description: "Define a custom policy template with explicit limits.",
        customMode: true,
      },
    ]);
  });

  it("builds preview payload for read_and_sign preset", () => {
    const preview = buildPolicyPreview({
      presetId: "read_and_sign",
      nowUnixSeconds: 1_700_000_000,
    });

    expect(preview).toEqual({
      presetId: "read_and_sign",
      label: "Read + Sign",
      description: "Short-lived session that allows signing but no value transfer.",
      policyPayload: {
        expiresAt: 1_700_001_800,
        sessionConfig: {
          feeLimit: "1000000000000000",
          maxValuePerUse: "0",
          callPolicies: [],
          transferPolicies: [],
        },
      },
    });
  });

  it("builds preview payload for limited_spend preset", () => {
    const preview = buildPolicyPreview({
      presetId: "limited_spend",
      nowUnixSeconds: 1_700_000_000,
    });

    expect(preview.policyPayload).toEqual({
      expiresAt: 1_700_003_600,
      sessionConfig: {
        feeLimit: "2000000000000000",
        maxValuePerUse: "10000000000000000",
        callPolicies: [],
        transferPolicies: [
          {
            tokenAddress: "0x0000000000000000000000000000000000000000",
            maxAmountBaseUnit: "10000000000000000",
          },
        ],
      },
    });
  });

  it("validates built-in presets before generating preview payloads", () => {
    const originalFeeLimit = BUILT_IN_POLICY_PRESETS.limited_spend.sessionConfig.feeLimit;

    BUILT_IN_POLICY_PRESETS.limited_spend.sessionConfig.feeLimit = "not-a-base10-integer";

    try {
      expect(() =>
        buildPolicyPreview({
          presetId: "limited_spend",
        }),
      ).toThrow('Invalid policy preset template "limited_spend"');
    } finally {
      BUILT_IN_POLICY_PRESETS.limited_spend.sessionConfig.feeLimit = originalFeeLimit;
    }
  });

  it("fails closed when built-in preset metadata is corrupted", () => {
    const originalCustomMode = BUILT_IN_POLICY_PRESETS.read_and_sign.customMode;

    BUILT_IN_POLICY_PRESETS.read_and_sign.customMode = true;

    try {
      expect(() =>
        buildPolicyPreview({
          presetId: "read_and_sign",
        }),
      ).toThrow('Invalid policy preset template "read_and_sign"');
    } finally {
      BUILT_IN_POLICY_PRESETS.read_and_sign.customMode = originalCustomMode;
    }
  });

  it("fails closed when built-in preset description is corrupted during preview", () => {
    const originalDescription = BUILT_IN_POLICY_PRESETS.read_and_sign.description;

    BUILT_IN_POLICY_PRESETS.read_and_sign.description = "";

    try {
      expect(() =>
        buildPolicyPreview({
          presetId: "read_and_sign",
        }),
      ).toThrow('Invalid policy preset template "read_and_sign"');
    } finally {
      BUILT_IN_POLICY_PRESETS.read_and_sign.description = originalDescription;
    }
  });

  it("fails closed when built-in preset template contains unknown top-level keys", () => {
    const mutablePreset = BUILT_IN_POLICY_PRESETS.read_and_sign as unknown as Record<string, unknown>;
    const hadUnexpected = Object.prototype.hasOwnProperty.call(mutablePreset, "unexpected");
    const originalUnexpected = mutablePreset.unexpected;
    mutablePreset.unexpected = true;

    try {
      expect(() => listPolicyPresets()).toThrow('Invalid policy preset template "read_and_sign": template. Unexpected key: unexpected.');
      expect(() =>
        buildPolicyPreview({
          presetId: "read_and_sign",
        }),
      ).toThrow('Invalid policy preset template "read_and_sign": template. Unexpected key: unexpected.');
    } finally {
      if (hadUnexpected) {
        mutablePreset.unexpected = originalUnexpected;
      } else {
        delete mutablePreset.unexpected;
      }
    }
  });

  it("fails closed when built-in preset customMode is corrupted during listing", () => {
    const originalCustomMode = BUILT_IN_POLICY_PRESETS.read_and_sign.customMode;

    BUILT_IN_POLICY_PRESETS.read_and_sign.customMode = true;

    try {
      expect(() => listPolicyPresets()).toThrow('Invalid policy preset template "read_and_sign"');
    } finally {
      BUILT_IN_POLICY_PRESETS.read_and_sign.customMode = originalCustomMode;
    }
  });

  it("fails closed when listing presets if built-in preset metadata is corrupted", () => {
    const originalLabel = BUILT_IN_POLICY_PRESETS.limited_spend.label;

    BUILT_IN_POLICY_PRESETS.limited_spend.label = "";

    try {
      expect(() => listPolicyPresets()).toThrow('Invalid policy preset template "limited_spend"');
    } finally {
      BUILT_IN_POLICY_PRESETS.limited_spend.label = originalLabel;
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
    mutableCustomPreset.id = "read_and_sign";

    try {
      expect(() =>
        buildPolicyPreview({
          presetId: "custom",
        }),
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
        buildPolicyPreview({
          presetId: "custom",
        }),
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
        buildPolicyPreview({
          presetId: "custom",
        }),
      ).toThrow("Invalid custom preset metadata: unexpected key \"unexpected\".");
    } finally {
      if (hadUnexpected) {
        mutableCustomPreset.unexpected = originalUnexpected;
      } else {
        delete mutableCustomPreset.unexpected;
      }
    }
  });

  it("fails closed when a built-in preset id mismatches its registry key during preview", () => {
    const originalId = BUILT_IN_POLICY_PRESETS.read_and_sign.id;

    BUILT_IN_POLICY_PRESETS.read_and_sign.id = "limited_spend";

    try {
      expect(() =>
        buildPolicyPreview({
          presetId: "read_and_sign",
        }),
      ).toThrow('Invalid policy preset registry: key "read_and_sign" does not match preset id "limited_spend".');
    } finally {
      BUILT_IN_POLICY_PRESETS.read_and_sign.id = originalId;
    }
  });

  it("fails closed when a built-in preset id mismatches its registry key during listing", () => {
    const originalId = BUILT_IN_POLICY_PRESETS.read_and_sign.id;

    BUILT_IN_POLICY_PRESETS.read_and_sign.id = "limited_spend";

    try {
      expect(() => listPolicyPresets()).toThrow(
        'Invalid policy preset registry: key "read_and_sign" does not match preset id "limited_spend".',
      );
    } finally {
      BUILT_IN_POLICY_PRESETS.read_and_sign.id = originalId;
    }
  });

  it("fails closed when a built-in preset registry entry is missing during preview", () => {
    const originalPreset = BUILT_IN_POLICY_PRESETS.read_and_sign;
    (BUILT_IN_POLICY_PRESETS as Record<string, SessionPolicyPresetTemplate | undefined>).read_and_sign = undefined;

    try {
      expect(() =>
        buildPolicyPreview({
          presetId: "read_and_sign",
        }),
      ).toThrow('Invalid policy preset registry: missing preset template for key "read_and_sign".');
    } finally {
      (BUILT_IN_POLICY_PRESETS as Record<string, SessionPolicyPresetTemplate | undefined>).read_and_sign = originalPreset;
    }
  });

  it("fails closed when a built-in preset registry entry is missing during listing", () => {
    const originalPreset = BUILT_IN_POLICY_PRESETS.read_and_sign;
    (BUILT_IN_POLICY_PRESETS as Record<string, SessionPolicyPresetTemplate | undefined>).read_and_sign = undefined;

    try {
      expect(() => listPolicyPresets()).toThrow(
        'Invalid policy preset registry: missing preset template for key "read_and_sign".',
      );
    } finally {
      (BUILT_IN_POLICY_PRESETS as Record<string, SessionPolicyPresetTemplate | undefined>).read_and_sign = originalPreset;
    }
  });

  it("returns isolated preview payloads for repeated preset requests", () => {
    const first = buildPolicyPreview({
      presetId: "limited_spend",
      nowUnixSeconds: 1_700_000_000,
    });

    first.policyPayload.sessionConfig.transferPolicies[0].maxAmountBaseUnit = "1";

    const second = buildPolicyPreview({
      presetId: "limited_spend",
      nowUnixSeconds: 1_700_000_000,
    });

    expect(second.policyPayload.sessionConfig.transferPolicies[0].maxAmountBaseUnit).toBe("10000000000000000");
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
        transferPolicies: [{ tokenAddress: "0x0000000000000000000000000000000000000000", maxAmountBaseUnit: "42" }],
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

  it("ignores custom template input when a built-in safe preset is selected", () => {
    const preview = buildPolicyPreview({
      presetId: "read_and_sign",
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
          transferPolicies: [{ tokenAddress: "0x0000000000000000000000000000000000000000", maxAmountBaseUnit: "42" }],
        },
      },
      nowUnixSeconds: 1_700_000_000,
    });

    expect(preview).toEqual({
      presetId: "read_and_sign",
      label: "Read + Sign",
      description: "Short-lived session that allows signing but no value transfer.",
      policyPayload: {
        expiresAt: 1_700_001_800,
        sessionConfig: {
          feeLimit: "1000000000000000",
          maxValuePerUse: "0",
          callPolicies: [],
          transferPolicies: [],
        },
      },
    });
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
      buildPolicyPreview({
        presetId: "custom",
        customTemplate: invalidTemplate,
      }),
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

  it("rejects non-object custom templates with deterministic validation errors", () => {
    expect(() =>
      buildPolicyPreview({
        presetId: "custom",
        customTemplate: [] as unknown as SessionPolicyPresetTemplate,
      }),
    ).toThrow("Invalid custom policy: Invalid custom policy template input. Expected an object.");

    expect(() =>
      buildPolicyPreview({
        presetId: "custom",
        customTemplate: 42 as unknown as SessionPolicyPresetTemplate,
      }),
    ).toThrow("Invalid custom policy: Invalid custom policy template input. Expected an object.");
  });

  it("rejects malformed custom policy entries with deterministic validation errors", () => {
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
            callPolicies: [null],
            transferPolicies: [],
          },
        } as unknown as SessionPolicyPresetTemplate,
      }),
    ).toThrow("Invalid custom policy: callPolicies[0] must be an object.");
  });

  it("rejects custom templates with non-object sessionConfig using deterministic validation errors", () => {
    expect(() =>
      buildPolicyPreview({
        presetId: "custom",
        customTemplate: {
          id: "custom",
          label: "Custom",
          description: "custom",
          customMode: true,
          expiresInSeconds: 900,
          sessionConfig: null,
        } as unknown as SessionPolicyPresetTemplate,
      }),
    ).toThrow("Invalid custom policy: sessionConfig must be an object.");
  });

  it("rejects custom templates with array sessionConfig using deterministic validation errors", () => {
    expect(() =>
      buildPolicyPreview({
        presetId: "custom",
        customTemplate: {
          id: "custom",
          label: "Custom",
          description: "custom",
          customMode: true,
          expiresInSeconds: 900,
          sessionConfig: [],
        } as unknown as SessionPolicyPresetTemplate,
      }),
    ).toThrow("Invalid custom policy: sessionConfig must be an object.");
  });

  it("rejects custom templates with unknown top-level keys", () => {
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
            callPolicies: [],
            transferPolicies: [],
          },
          unexpected: true,
        } as unknown as SessionPolicyPresetTemplate,
      }),
    ).toThrow("Invalid custom policy: Invalid custom policy template input. Unexpected key: unexpected.");
  });

  it("rejects custom templates with mismatched metadata fields", () => {
    expect(() =>
      buildPolicyPreview({
        presetId: "custom",
        customTemplate: {
          id: "read_and_sign",
          label: "Custom",
          description: "Define a custom policy template with explicit limits.",
          customMode: true,
          expiresInSeconds: 900,
          sessionConfig: {
            feeLimit: "100",
            maxValuePerUse: "1",
            callPolicies: [],
            transferPolicies: [],
          },
        },
      }),
    ).toThrow('Invalid custom policy: Invalid custom policy template input. id must be "custom".');

    expect(() =>
      buildPolicyPreview({
        presetId: "custom",
        customTemplate: {
          id: "custom",
          label: "Custom",
          description: "Define a custom policy template with explicit limits.",
          customMode: false,
          expiresInSeconds: 900,
          sessionConfig: {
            feeLimit: "100",
            maxValuePerUse: "1",
            callPolicies: [],
            transferPolicies: [],
          },
        },
      }),
    ).toThrow("Invalid custom policy: Invalid custom policy template input. customMode must be true.");
  });

  it("rejects custom templates with empty label or description metadata", () => {
    expect(() =>
      buildPolicyPreview({
        presetId: "custom",
        customTemplate: {
          id: "custom",
          label: "",
          description: "Define a custom policy template with explicit limits.",
          customMode: true,
          expiresInSeconds: 900,
          sessionConfig: {
            feeLimit: "100",
            maxValuePerUse: "1",
            callPolicies: [],
            transferPolicies: [],
          },
        },
      }),
    ).toThrow("Invalid custom policy: Invalid custom policy template input. label must be a non-empty string.");

    expect(() =>
      buildPolicyPreview({
        presetId: "custom",
        customTemplate: {
          id: "custom",
          label: "Custom",
          description: "",
          customMode: true,
          expiresInSeconds: 900,
          sessionConfig: {
            feeLimit: "100",
            maxValuePerUse: "1",
            callPolicies: [],
            transferPolicies: [],
          },
        },
      }),
    ).toThrow("Invalid custom policy: Invalid custom policy template input. description must be a non-empty string.");
  });

  it("rejects unknown preset ids", () => {
    expect(() =>
      buildPolicyPreview({
        presetId: "unsafe_unbounded",
      }),
    ).toThrow("Unknown policy preset");
  });

  it("rejects preview generation when nowUnixSeconds is invalid", () => {
    expect(() =>
      buildPolicyPreview({
        presetId: "read_and_sign",
        nowUnixSeconds: Number.NaN,
      }),
    ).toThrow("Invalid policy preview time.");
  });

  it("uses the default custom template when custom template is missing", () => {
    const preview = buildPolicyPreview({
      presetId: "custom",
      nowUnixSeconds: 1_700_000_000,
    });

    expect(preview.policyPayload).toEqual({
      expiresAt: 1_700_000_900,
      sessionConfig: {
        feeLimit: "1000000000000000",
        maxValuePerUse: "1000000000000000",
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
          transferPolicies: [{ tokenAddress: " 0x0000000000000000000000000000000000000000 ", maxAmountBaseUnit: " 7 " }],
        },
      }),
    );

    expect(parsed).toEqual({
      id: "custom",
      label: "Custom",
      description: "Define a custom policy template with explicit limits.",
      customMode: true,
      expiresInSeconds: 900,
      sessionConfig: {
        feeLimit: "1000",
        maxValuePerUse: "42",
        callPolicies: [{ target: "0xabc0000000000000000000000000000000000000", selector: "0xa9059cbb" }],
        transferPolicies: [{ tokenAddress: "0x0000000000000000000000000000000000000000", maxAmountBaseUnit: "7" }],
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

  it("rejects custom call policies with unknown keys to prevent silent broad permissions", () => {
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
                tokenAddress: "0x0000000000000000000000000000000000000000",
                maxAmountBaseUnit: "7",
                note: "extra",
              },
            ],
          },
        }),
      ),
    ).toThrow("Invalid custom policy transferPolicies[0]. Unexpected key: note.");
  });
});
