import { assertToolAllowedByPolicyMeta, isSessionPolicyMeta } from "../src/policy/meta.js";
import type { AgwSessionData, SessionPolicyMeta } from "../src/session/types.js";

function buildSessionData(policyMeta?: SessionPolicyMeta): AgwSessionData {
  const now = Math.floor(Date.now() / 1000);
  return {
    accountAddress: "0x1111111111111111111111111111111111111111",
    chainId: 11124,
    expiresAt: now + 3600,
    createdAt: now,
    updatedAt: now,
    status: "active",
    sessionConfig: { signer: "0x2222222222222222222222222222222222222222" },
    sessionSignerRef: { kind: "raw", value: "0x59c6995e998f97a5a0044966f0945388cf0f5ddf3cd34e3c5d6f6e64f5f4a799" },
    policyMeta,
  };
}

describe("policy metadata", () => {
  it("validates a well-formed metadata payload", () => {
    const now = Math.floor(Date.now() / 1000);
    const payload: SessionPolicyMeta = {
      version: 1,
      mode: "guided",
      presetId: "payments",
      presetLabel: "Payments",
      enabledTools: ["get_session_status", "revoke_session"],
      selectedAppIds: [],
      selectedContractAddresses: [],
      unverifiedAppIds: [],
      warnings: [],
      generatedAt: now,
    };

    expect(isSessionPolicyMeta(payload)).toBe(true);
  });

  it("allows tool execution when no metadata exists (legacy sessions)", () => {
    expect(() => assertToolAllowedByPolicyMeta(buildSessionData(undefined), "deploy_contract")).not.toThrow();
  });

  it("blocks disallowed tools while allowing revoke/status", () => {
    const now = Math.floor(Date.now() / 1000);
    const session = buildSessionData({
      version: 1,
      mode: "guided",
      presetId: "payments",
      presetLabel: "Payments",
      enabledTools: ["get_session_status", "revoke_session"],
      selectedAppIds: [],
      selectedContractAddresses: [],
      unverifiedAppIds: [],
      warnings: [],
      generatedAt: now,
    });

    expect(() => assertToolAllowedByPolicyMeta(session, "deploy_contract")).toThrow(
      'tool "deploy_contract" is not enabled',
    );
    expect(() => assertToolAllowedByPolicyMeta(session, "revoke_session")).not.toThrow();
  });
});
