import { abstract } from "viem/chains";
import { getTool } from "../src/tools/index.js";
import { deployContractTool } from "../src/tools/deploy-contract.js";
import type { AgwSessionData } from "../src/session/types.js";
import type { ToolContext } from "../src/tools/types.js";
import { Logger } from "../src/utils/logger.js";

const TEST_ABI = [
  {
    type: "constructor",
    stateMutability: "nonpayable",
    inputs: [],
  },
] as const;

function buildSessionData(overrides: Partial<AgwSessionData> = {}): AgwSessionData {
  const now = Math.floor(Date.now() / 1000);
  return {
    accountAddress: "0x1111111111111111111111111111111111111111",
    chainId: 11124,
    expiresAt: now + 3600,
    createdAt: now,
    updatedAt: now,
    status: "active",
    sessionConfig: {
      signer: "0x2222222222222222222222222222222222222222",
      expiresAt: String(now + 3600),
      feeLimit: { limitType: "lifetime", limit: "1000000", period: "0" },
      maxValuePerUse: "1000000",
      callPolicies: [],
      transferPolicies: [],
    },
    sessionSignerRef: { kind: "keyfile", value: "/tmp/session.key" },
    ...overrides,
  };
}

function buildContext(
  deployContract: jest.Mock<Promise<`0x${string}`>, [Record<string, unknown>]>,
  sessionOverrides: Partial<AgwSessionData> = {},
): ToolContext {
  return {
    sessionManager: {
      getSession: () => buildSessionData(sessionOverrides),
      getSessionStatus: () => "active",
      createSessionClient: jest.fn(() => ({ deployContract })) as unknown as ToolContext["sessionManager"]["createSessionClient"],
    } as unknown as ToolContext["sessionManager"],
    logger: new Logger("test"),
  };
}

describe("deploy_contract tool", () => {
  it("is registered in tool index", () => {
    expect(getTool("deploy_contract")).toBeDefined();
  });

  it("returns preview in non-execute mode", async () => {
    const deployContract = jest.fn<Promise<`0x${string}`>, [Record<string, unknown>]>(async () => "0xabc");
    const result = (await deployContractTool.handler(
      {
        abi: TEST_ABI,
        bytecode: "0x60006000",
      },
      buildContext(deployContract),
    )) as Record<string, unknown>;

    expect(result.preview).toBe(true);
    expect(deployContract).not.toHaveBeenCalled();
  });

  it("executes deployContract when execute=true", async () => {
    const deployContract = jest.fn<Promise<`0x${string}`>, [Record<string, unknown>]>(async () => "0xabc");
    const result = (await deployContractTool.handler(
      {
        abi: TEST_ABI,
        bytecode: "0x60006000",
        execute: true,
      },
      buildContext(deployContract),
    )) as Record<string, unknown>;

    expect(deployContract).toHaveBeenCalledTimes(1);
    expect(result.txHash).toBe("0xabc");
  });

  it("rejects malformed bytecode", async () => {
    const deployContract = jest.fn<Promise<`0x${string}`>, [Record<string, unknown>]>(async () => "0xabc");

    await expect(
      deployContractTool.handler(
        {
          abi: TEST_ABI,
          bytecode: "invalid",
          execute: true,
        },
        buildContext(deployContract),
      ),
    ).rejects.toThrow("bytecode must be a 0x-prefixed hex string with even length");
  });

  it("rejects execute mode on mainnet until deploy preflight is available", async () => {
    const deployContract = jest.fn<Promise<`0x${string}`>, [Record<string, unknown>]>(async () => "0xabc");

    await expect(
      deployContractTool.handler(
        {
          abi: TEST_ABI,
          bytecode: "0x60006000",
          execute: true,
        },
        buildContext(deployContract, { chainId: abstract.id }),
      ),
    ).rejects.toThrow("deploy rejected: mainnet deploy preflight is not supported");

    expect(deployContract).not.toHaveBeenCalled();
  });
});
