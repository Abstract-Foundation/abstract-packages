import { getTool } from "../src/tools/index.js";
import type { ToolContext } from "../src/tools/types.js";
import { Logger } from "../src/utils/logger.js";

function buildContext(sessionAddress?: string): ToolContext {
  return {
    sessionManager: {
      getSession: () =>
        sessionAddress
          ? {
              accountAddress: sessionAddress,
              chainId: 2741,
              createdAt: 1,
              updatedAt: 1,
              status: "active",
            }
          : null,
      getSessionStatus: () => (sessionAddress ? "active" : "missing"),
      getChainId: () => 2741,
      getNetworkConfig: () => ({ chainId: 2741, chain: {} as never, rpcUrl: "https://api.mainnet.abs.xyz" }),
    } as unknown as ToolContext["sessionManager"],
    logger: new Logger("test"),
  };
}

describe("portal tools", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("registers portal tool names", () => {
    expect(getTool("portal_list_apps")).toBeDefined();
    expect(getTool("portal_get_app")).toBeDefined();
    expect(getTool("portal_list_streams")).toBeDefined();
    expect(getTool("portal_get_user_profile")).toBeDefined();
  });

  it("lists apps", async () => {
    global.fetch = jest.fn(async () =>
      new Response(
        JSON.stringify({
          items: [{ id: "1", name: "App One" }],
          pagination: { page: 1, limit: 20, totalItems: 1, totalPages: 1 },
        }),
        { status: 200 },
      )) as unknown as typeof fetch;

    const tool = getTool("portal_list_apps");
    const result = await tool?.handler({ page: 1, limit: 20 }, buildContext());

    expect(result).toEqual({
      items: [{ id: "1", name: "App One" }],
      pagination: { page: 1, limit: 20, totalItems: 1, totalPages: 1 },
    });
  });

  it("uses session address by default for user profile", async () => {
    global.fetch = jest.fn(async () =>
      new Response(
        JSON.stringify({
          address: "0x1111111111111111111111111111111111111111",
          name: "Jarrod",
          profilePictureUrl: "https://img",
          tier: "gold",
        }),
        { status: 200 },
      )) as unknown as typeof fetch;

    const tool = getTool("portal_get_user_profile");
    const result = (await tool?.handler({}, buildContext("0x1111111111111111111111111111111111111111"))) as Record<string, unknown>;

    expect(result.source).toBe("session");
    expect((result.profile as { address: string }).address).toBe("0x1111111111111111111111111111111111111111");
  });

  it("rejects missing address when no session is linked", async () => {
    const tool = getTool("portal_get_user_profile");

    await expect(tool?.handler({}, buildContext())).rejects.toThrow("address is required");
  });
});
