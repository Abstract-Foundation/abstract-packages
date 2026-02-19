import { abstractTestnet } from "viem/chains";
import { resolveNetworkConfig } from "../src/config/network.js";
import type { AgwSessionData } from "../src/session/types.js";
import { getTool } from "../src/tools/index.js";
import { writeContractTool } from "../src/tools/write-contract.js";
import type { ToolContext } from "../src/tools/types.js";
import { Logger } from "../src/utils/logger.js";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const ERC20_ABI = [
  {
    type: "function",
    name: "transfer",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

function buildSessionData(overrides: Partial<AgwSessionData> = {}): AgwSessionData {
  const now = Math.floor(Date.now() / 1000);

  return {
    accountAddress: "0x1111111111111111111111111111111111111111",
    chainId: abstractTestnet.id,
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

interface SessionClientSpies {
  writeContract: jest.Mock<Promise<`0x${string}`>, [Record<string, unknown>]>;
}

function buildContext(session: AgwSessionData, sessionClientSpies: SessionClientSpies): ToolContext {
  return {
    sessionManager: {
      getSession: () => session,
      getSessionStatus: () => "active",
      createSessionClient: jest.fn(() => sessionClientSpies) as unknown as ToolContext["sessionManager"]["createSessionClient"],
    } as unknown as ToolContext["sessionManager"],
    logger: new Logger("test"),
  };
}

describe("write_contract tool", () => {
  it("is registered in tool index", () => {
    expect(getTool("write_contract")).toBeDefined();
  });

  it("executes contract write via session client with policy enforcement preflight", async () => {
    const writeContract = jest.fn<Promise<`0x${string}`>, [Record<string, unknown>]>(async () =>
      "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    );
    const session = buildSessionData();
    const context = buildContext(session, { writeContract });

    const result = (await writeContractTool.handler(
      {
        address: "0x3333333333333333333333333333333333333333",
        abi: ERC20_ABI,
        functionName: "transfer",
        args: ["0x4444444444444444444444444444444444444444", 1n],
        value: "7",
      },
      context,
    )) as Record<string, unknown>;

    expect(writeContract).toHaveBeenCalledTimes(1);
    expect(writeContract).toHaveBeenCalledWith({
      account: session.accountAddress,
      chain: undefined,
      address: "0x3333333333333333333333333333333333333333",
      abi: ERC20_ABI,
      functionName: "transfer",
      args: ["0x4444444444444444444444444444444444444444", 1n],
      value: 7n,
    });

    const createSessionClient = context.sessionManager.createSessionClient as unknown as jest.Mock;
    expect(createSessionClient).toHaveBeenCalledWith({
      chain: expect.objectContaining({ id: abstractTestnet.id }),
      rpcUrl: abstractTestnet.rpcUrls.default.http[0],
    });

    const networkConfig = resolveNetworkConfig({ chainId: session.chainId });
    const explorerBase = networkConfig.chain.blockExplorers?.default?.url ?? null;

    expect(result).toEqual({
      txHash: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      accountAddress: session.accountAddress,
      chainId: session.chainId,
      explorer: {
        chain: explorerBase,
        transaction: `${explorerBase}/tx/0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa`,
      },
      contract: {
        address: "0x3333333333333333333333333333333333333333",
        functionName: "transfer",
        args: ["0x4444444444444444444444444444444444444444", 1n],
        value: "7",
      },
    });
  });

  it("rejects contract writes blocked by call policy and does not execute", async () => {
    const writeContract = jest.fn<Promise<`0x${string}`>, [Record<string, unknown>]>(async () => "0xbeef");
    const session = buildSessionData();
    const context = buildContext(session, { writeContract });

    await expect(
      writeContractTool.handler(
        {
          address: "0x3333333333333333333333333333333333333333",
          abi: ERC20_ABI,
          functionName: "approve",
          args: ["0x4444444444444444444444444444444444444444", 1n],
        },
        context,
      ),
    ).rejects.toThrow("contract write rejected: call policy does not allow this target/selector");

    expect(writeContract).not.toHaveBeenCalled();
  });

  it("rejects non-array args and does not execute", async () => {
    const writeContract = jest.fn<Promise<`0x${string}`>, [Record<string, unknown>]>(async () => "0xbeef");
    const session = buildSessionData();
    const context = buildContext(session, { writeContract });

    await expect(
      writeContractTool.handler(
        {
          address: "0x3333333333333333333333333333333333333333",
          abi: ERC20_ABI,
          functionName: "transfer",
          args: "invalid",
        },
        context,
      ),
    ).rejects.toThrow("args must be an array when provided");

    expect(writeContract).not.toHaveBeenCalled();
  });
});
