import { abstract } from "viem/chains";
import type { AgwSessionData } from "../src/session/types.js";
import { getTool } from "../src/tools/index.js";
import { previewTransactionTool } from "../src/tools/preview-transaction.js";
import type { ToolContext } from "../src/tools/types.js";
import { Logger } from "../src/utils/logger.js";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

function buildSessionData(overrides: Partial<AgwSessionData> = {}): AgwSessionData {
  const now = Math.floor(Date.now() / 1000);

  return {
    accountAddress: "0x1111111111111111111111111111111111111111",
    chainId: abstract.id,
    expiresAt: now + 3600,
    createdAt: now,
    updatedAt: now,
    status: "active",
    sessionConfig: {
      signer: "0x2222222222222222222222222222222222222222",
      expiresAt: String(now + 3600),
      feeLimit: {
        limitType: "lifetime",
        limit: "1000000000000000000",
        period: "0",
      },
      maxValuePerUse: "1000000000000000000",
      callPolicies: [
        {
          target: "0x3333333333333333333333333333333333333333",
          selector: "0xa9059cbb",
        },
      ],
      transferPolicies: [
        {
          tokenAddress: ZERO_ADDRESS,
          maxAmountBaseUnit: "1000",
        },
      ],
    },
    sessionSignerRef: {
      kind: "keyfile",
      value: "/tmp/session.key",
    },
    ...overrides,
  };
}

function buildContext(session: AgwSessionData): ToolContext {
  return {
    sessionManager: {
      getSession: () => session,
      getSessionStatus: () => "active",
      createSessionClient: jest.fn(() => {
        throw new Error("preview should not create session clients");
      }) as unknown as ToolContext["sessionManager"]["createSessionClient"],
    } as unknown as ToolContext["sessionManager"],
    logger: new Logger("test"),
  };
}

describe("preview_transaction tool", () => {
  it("is registered in tool index", () => {
    expect(getTool("preview_transaction")).toBeDefined();
  });

  it("returns human-readable impact and risk labels for an allowed transaction", async () => {
    const session = buildSessionData();
    const context = buildContext(session);

    const result = (await previewTransactionTool.handler(
      {
        to: "0x3333333333333333333333333333333333333333",
        data: "0xa9059cbb0000000000000000000000000000000000000000000000000000000000000001",
        value: "7",
      },
      context,
    )) as Record<string, unknown>;

    expect(result).toEqual({
      preview: true,
      accountAddress: session.accountAddress,
      chainId: session.chainId,
      transaction: {
        to: "0x3333333333333333333333333333333333333333",
        data: "0xa9059cbb0000000000000000000000000000000000000000000000000000000000000001",
        value: "7",
      },
      impact: {
        summary: "Calls selector 0xa9059cbb on 0x3333333333333333333333333333333333333333 and transfers 7 wei.",
        labels: [
          "Calls selector 0xa9059cbb",
          "Targets 0x3333333333333333333333333333333333333333",
          "Transfers 7 wei",
        ],
      },
      risk: {
        level: "medium",
        labels: ["Contract call may change state", "Native value transfer increases financial exposure"],
      },
      policy: {
        callAllowed: true,
        valueAllowed: true,
      },
    });
  });

  it("returns high risk labels when transaction exceeds session policy", async () => {
    const session = buildSessionData();
    const context = buildContext(session);

    const result = (await previewTransactionTool.handler(
      {
        to: "0x4444444444444444444444444444444444444444",
        data: "0xa9059cbb0000000000000000000000000000000000000000000000000000000000000001",
        value: "1001",
      },
      context,
    )) as Record<string, unknown>;

    expect(result).toEqual({
      preview: true,
      accountAddress: session.accountAddress,
      chainId: session.chainId,
      transaction: {
        to: "0x4444444444444444444444444444444444444444",
        data: "0xa9059cbb0000000000000000000000000000000000000000000000000000000000000001",
        value: "1001",
      },
      impact: {
        summary: "Calls selector 0xa9059cbb on 0x4444444444444444444444444444444444444444 and transfers 1001 wei.",
        labels: [
          "Calls selector 0xa9059cbb",
          "Targets 0x4444444444444444444444444444444444444444",
          "Transfers 1001 wei",
        ],
      },
      risk: {
        level: "high",
        labels: [
          "Session policy blocks this target or selector",
          "Session policy blocks this native value amount",
          "Contract call may change state",
          "Native value transfer increases financial exposure",
        ],
      },
      policy: {
        callAllowed: false,
        valueAllowed: false,
      },
    });
  });
});
