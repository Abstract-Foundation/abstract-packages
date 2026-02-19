import { abstract, abstractTestnet } from "viem/chains";
import { MainnetPolicyRegistryStatus, assertMainnetPolicyRegistryPreflight } from "../src/session/mainnet-preflight.js";

describe("mainnet policy registry preflight", () => {
  const originalEnv = process.env.AGW_MCP_ENFORCE_MAINNET_PREFLIGHT_TEST;

  beforeAll(() => {
    process.env.AGW_MCP_ENFORCE_MAINNET_PREFLIGHT_TEST = "1";
  });

  afterAll(() => {
    if (originalEnv === undefined) {
      delete process.env.AGW_MCP_ENFORCE_MAINNET_PREFLIGHT_TEST;
      return;
    }
    process.env.AGW_MCP_ENFORCE_MAINNET_PREFLIGHT_TEST = originalEnv;
  });

  it("skips check on non-mainnet chains", async () => {
    const readContract = jest.fn(async () => MainnetPolicyRegistryStatus.Allowed);

    await expect(
      assertMainnetPolicyRegistryPreflight(
        {
          chainId: abstractTestnet.id,
          to: "0x3333333333333333333333333333333333333333",
          data: "0xa9059cbb",
          value: 0n,
        },
        {
          createClient: () => ({ readContract }),
        },
      ),
    ).resolves.toBeUndefined();

    expect(readContract).not.toHaveBeenCalled();
  });

  it("passes when call/transfer statuses are allowed", async () => {
    const readContract = jest
      .fn()
      .mockResolvedValueOnce(MainnetPolicyRegistryStatus.Allowed)
      .mockResolvedValueOnce(MainnetPolicyRegistryStatus.Allowed);

    await expect(
      assertMainnetPolicyRegistryPreflight(
        {
          chainId: abstract.id,
          to: "0x3333333333333333333333333333333333333333",
          data: "0xa9059cbb",
          value: 1n,
          rpcUrl: abstract.rpcUrls.default.http[0],
        },
        {
          createClient: () => ({ readContract }),
        },
      ),
    ).resolves.toBeUndefined();
  });

  it("fails when call policy status is unset", async () => {
    const readContract = jest.fn().mockResolvedValueOnce(MainnetPolicyRegistryStatus.Unset);

    await expect(
      assertMainnetPolicyRegistryPreflight(
        {
          chainId: abstract.id,
          to: "0x3333333333333333333333333333333333333333",
          data: "0xa9059cbb",
          value: 0n,
          rpcUrl: abstract.rpcUrls.default.http[0],
        },
        {
          createClient: () => ({ readContract }),
        },
      ),
    ).rejects.toMatchObject({
      code: "AGW_POLICY_REGISTRY_CALL_BLOCKED",
    });
  });

  it("fails when transfer policy status is denied", async () => {
    const readContract = jest
      .fn()
      .mockResolvedValueOnce(MainnetPolicyRegistryStatus.Allowed)
      .mockResolvedValueOnce(MainnetPolicyRegistryStatus.Denied);

    await expect(
      assertMainnetPolicyRegistryPreflight(
        {
          chainId: abstract.id,
          to: "0x3333333333333333333333333333333333333333",
          data: "0xa9059cbb",
          value: 2n,
          rpcUrl: abstract.rpcUrls.default.http[0],
        },
        {
          createClient: () => ({ readContract }),
        },
      ),
    ).rejects.toMatchObject({
      code: "AGW_POLICY_REGISTRY_TRANSFER_BLOCKED",
    });
  });
});
