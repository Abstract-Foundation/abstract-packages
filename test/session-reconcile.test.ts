import { reconcileSessionLifecycle } from "../src/session/reconcile.js";
import { Logger } from "../src/utils/logger.js";

describe("session lifecycle reconciliation", () => {
  it("returns null when no local session exists", async () => {
    const manager = {
      getSession: () => null,
      getOnchainSessionStatus: jest.fn(),
      clearSession: jest.fn(),
    };

    const result = await reconcileSessionLifecycle(manager as never, new Logger("test"));
    expect(result).toBeNull();
    expect(manager.getOnchainSessionStatus).not.toHaveBeenCalled();
  });

  it("invalidates local session when on-chain status is Closed", async () => {
    const manager = {
      getSession: () => ({ accountAddress: "0x1" }),
      getOnchainSessionStatus: jest.fn(async () => ({
        status: "Closed",
        statusCode: 2,
        source: "onchain",
        checkedAt: 123,
      })),
      clearSession: jest.fn(),
    };

    const result = await reconcileSessionLifecycle(manager as never, new Logger("test"));
    expect(manager.clearSession).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      checkedAt: 123,
      onchainStatus: "Closed",
      onchainStatusCode: 2,
      source: "onchain",
      reconciled: true,
    });
  });

  it("keeps local session when on-chain status is Active", async () => {
    const manager = {
      getSession: () => ({ accountAddress: "0x1" }),
      getOnchainSessionStatus: jest.fn(async () => ({
        status: "Active",
        statusCode: 1,
        source: "onchain",
        checkedAt: 123,
      })),
      clearSession: jest.fn(),
    };

    const result = await reconcileSessionLifecycle(manager as never, new Logger("test"));
    expect(manager.clearSession).not.toHaveBeenCalled();
    expect(result).toEqual({
      checkedAt: 123,
      onchainStatus: "Active",
      onchainStatusCode: 1,
      source: "onchain",
      reconciled: false,
    });
  });
});
