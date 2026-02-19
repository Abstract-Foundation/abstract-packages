import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { LimitType } from "@abstract-foundation/agw-client/sessions";
import { assertSafeSessionPolicy, lintSessionPolicy } from "../src/policy/lint.js";
import { SessionManager } from "../src/session/manager.js";
import { Logger } from "../src/utils/logger.js";

const NOW_UNIX_SECONDS = 1_800_000_000;

function buildSafeInput() {
  return {
    expiresAt: NOW_UNIX_SECONDS + 3600,
    sessionConfig: {
      feeLimit: "1000000000000000",
      maxValuePerUse: "1000000000000000",
      callPolicies: [
        {
          target: "0xabc0000000000000000000000000000000000000",
          selector: "0x12345678",
        },
      ],
      transferPolicies: [
        {
          tokenAddress: "0x0000000000000000000000000000000000000000",
          maxAmountBaseUnit: "1000000000000000",
        },
      ],
    },
  };
}

describe("session policy lint", () => {
  it("accepts a bounded, selector-scoped policy", () => {
    const issues = lintSessionPolicy(buildSafeInput(), { nowUnixSeconds: NOW_UNIX_SECONDS });
    expect(issues).toEqual([]);
  });

  it("rejects expired sessions", () => {
    const issues = lintSessionPolicy(
      {
        ...buildSafeInput(),
        expiresAt: NOW_UNIX_SECONDS,
      },
      { nowUnixSeconds: NOW_UNIX_SECONDS },
    );

    expect(issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "expiresAt.expired",
          path: "expiresAt",
        }),
      ]),
    );
  });

  it("rejects sessions that are longer than 24h", () => {
    const issues = lintSessionPolicy(
      {
        ...buildSafeInput(),
        expiresAt: NOW_UNIX_SECONDS + 86_401,
      },
      { nowUnixSeconds: NOW_UNIX_SECONDS },
    );

    expect(issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "expiresAt.too_long",
          path: "expiresAt",
        }),
      ]),
    );
  });

  it("rejects unlimited fee limits", () => {
    const issues = lintSessionPolicy(
      {
        ...buildSafeInput(),
        sessionConfig: {
          signer: "0x1111111111111111111111111111111111111111",
          expiresAt: BigInt(NOW_UNIX_SECONDS + 3600),
          feeLimit: {
            limitType: LimitType.Unlimited,
            limit: 0n,
            period: 0n,
          },
          callPolicies: [],
          transferPolicies: [],
        },
      },
      { nowUnixSeconds: NOW_UNIX_SECONDS },
    );

    expect(issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "sessionConfig.feeLimit.unbounded",
          path: "sessionConfig.feeLimit",
        }),
      ]),
    );
  });

  it("rejects call policies without selectors", () => {
    const issues = lintSessionPolicy(
      {
        ...buildSafeInput(),
        sessionConfig: {
          ...buildSafeInput().sessionConfig,
          callPolicies: [{ target: "0xabc0000000000000000000000000000000000000" }],
        },
      },
      { nowUnixSeconds: NOW_UNIX_SECONDS },
    );

    expect(issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "sessionConfig.callPolicies[0].selector_required",
          path: "sessionConfig.callPolicies[0].selector",
        }),
      ]),
    );
  });

  it("rejects unsafe approval and transfer selector usage without destination constraints", () => {
    const issues = lintSessionPolicy(
      {
        ...buildSafeInput(),
        sessionConfig: {
          signer: "0x1111111111111111111111111111111111111111",
          expiresAt: BigInt(NOW_UNIX_SECONDS + 3600),
          feeLimit: {
            limitType: LimitType.Lifetime,
            limit: 1_000_000_000_000_000n,
            period: 0n,
          },
          callPolicies: [
            {
              target: "0xabc0000000000000000000000000000000000000",
              selector: "0x095ea7b3",
              maxValuePerUse: 0n,
              valueLimit: {
                limitType: LimitType.Lifetime,
                limit: 0n,
                period: 0n,
              },
              constraints: [],
            },
          ],
          transferPolicies: [],
        },
      },
      { nowUnixSeconds: NOW_UNIX_SECONDS },
    );

    expect(issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "sessionConfig.callPolicies[0].unsafe_destination",
          path: "sessionConfig.callPolicies[0].constraints",
        }),
      ]),
    );
  });

  it("throws an actionable error with all lint findings", () => {
    expect(() =>
      assertSafeSessionPolicy(
        {
          expiresAt: NOW_UNIX_SECONDS,
          sessionConfig: {
            callPolicies: [{ target: "0xabc0000000000000000000000000000000000000" }],
            transferPolicies: [],
          },
        },
        { nowUnixSeconds: NOW_UNIX_SECONDS },
      ),
    ).toThrow(/session policy lint failed/i);

    expect(() =>
      assertSafeSessionPolicy(
        {
          expiresAt: NOW_UNIX_SECONDS,
          sessionConfig: {
            callPolicies: [{ target: "0xabc0000000000000000000000000000000000000" }],
            transferPolicies: [],
          },
        },
        { nowUnixSeconds: NOW_UNIX_SECONDS },
      ),
    ).toThrow(/expiresAt/);
  });

  it("rejects unsafe session policies before persistence/use", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "agw-mcp-policy-lint-"));

    try {
      const manager = new SessionManager(new Logger("test"), {
        storageDir: tmpDir,
      });

      expect(() =>
        manager.setSession({
          accountAddress: "0x1111111111111111111111111111111111111111",
          chainId: 11124,
          expiresAt: NOW_UNIX_SECONDS,
          createdAt: NOW_UNIX_SECONDS,
          updatedAt: NOW_UNIX_SECONDS,
          status: "active",
          sessionConfig: {
            feeLimit: {
              limitType: LimitType.Unlimited,
              limit: 0n,
              period: 0n,
            },
            callPolicies: [],
            transferPolicies: [],
          },
          sessionSignerRef: {
            kind: "keyfile",
            value: "/tmp/session.key",
          },
        }),
      ).toThrow(/session policy lint failed/i);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});
