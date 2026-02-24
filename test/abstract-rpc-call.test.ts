import { getTool } from "../src/tools/index.js";
import type { ToolContext } from "../src/tools/types.js";
import { Logger } from "../src/utils/logger.js";

function buildContext(): ToolContext {
  return {
    sessionManager: {
      getSession: () => null,
      getSessionStatus: () => "missing",
      getChainId: () => 2741,
      getNetworkConfig: () => ({ chainId: 2741, chain: {} as never, rpcUrl: "https://api.mainnet.abs.xyz" }),
    } as unknown as ToolContext["sessionManager"],
    logger: new Logger("test"),
  };
}

describe("abstract_rpc_call tool", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("is registered", () => {
    expect(getTool("abstract_rpc_call")).toBeDefined();
  });

  it("calls an allowlisted method", async () => {
    global.fetch = jest.fn(async () =>
      new Response(JSON.stringify({ jsonrpc: "2.0", id: 1, result: "0xabbf" }), { status: 200 })) as unknown as typeof fetch;

    const tool = getTool("abstract_rpc_call");
    const result = (await tool?.handler({ method: "eth_chainId", params: [] }, buildContext())) as Record<string, unknown>;

    expect(result.method).toBe("eth_chainId");
    expect(result.result).toBe("0xabbf");
  });

  it("blocks disallowed methods", async () => {
    const tool = getTool("abstract_rpc_call");

    await expect(tool?.handler({ method: "eth_sendRawTransaction", params: [] }, buildContext())).rejects.toThrow(
      "disabled in read-only mode",
    );
  });
});
