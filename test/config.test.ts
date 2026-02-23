import { abstract, abstractTestnet } from "viem/chains";
import { resolveNetworkConfig } from "../src/config/network.js";

describe("network config resolution", () => {
  it("defaults to Abstract mainnet with default RPC", () => {
    const config = resolveNetworkConfig({ env: {} });

    expect(config.chainId).toBe(abstract.id);
    expect(config.chain.id).toBe(abstract.id);
    expect(config.rpcUrl).toBe("https://api.mainnet.abs.xyz");
  });

  it("supports mainnet selection via env", () => {
    const config = resolveNetworkConfig({
      env: {
        AGW_MCP_CHAIN_ID: String(abstract.id),
      },
    });

    expect(config.chainId).toBe(abstract.id);
    expect(config.chain.id).toBe(abstract.id);
    expect(config.rpcUrl).toBe("https://api.mainnet.abs.xyz");
  });

  it("prefers explicit chain id over env", () => {
    const config = resolveNetworkConfig({
      chainId: abstract.id,
      env: {
        AGW_MCP_CHAIN_ID: String(abstractTestnet.id),
      },
    });

    expect(config.chainId).toBe(abstract.id);
  });

  it("supports rpc override via env", () => {
    const config = resolveNetworkConfig({
      env: {
        AGW_MCP_RPC_URL: "https://rpc.custom.abs.xyz",
      },
    });

    expect(config.rpcUrl).toBe("https://rpc.custom.abs.xyz");
  });

  it("prefers explicit rpc url over env", () => {
    const config = resolveNetworkConfig({
      rpcUrl: "https://rpc.cli.abs.xyz",
      env: {
        AGW_MCP_RPC_URL: "https://rpc.env.abs.xyz",
      },
    });

    expect(config.rpcUrl).toBe("https://rpc.cli.abs.xyz");
  });

  it("throws for unsupported chain id", () => {
    expect(() => resolveNetworkConfig({ chainId: 1, env: {} })).toThrow("Unsupported chain id");
  });

  it("throws for invalid chain id format", () => {
    expect(() =>
      resolveNetworkConfig({
        env: {
          AGW_MCP_CHAIN_ID: "not-a-number",
        },
      }),
    ).toThrow("Invalid chain id");
  });
});
