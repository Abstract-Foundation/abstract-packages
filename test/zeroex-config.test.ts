import { resolveZeroExConfig } from "../src/config/zeroex.js";

describe("0x config resolution", () => {
  it("returns undefined api key by default", () => {
    const config = resolveZeroExConfig({ env: {} });
    expect(config.apiKey).toBeUndefined();
  });

  it("resolves api key from AGW_MCP_ZEROEX_API_KEY", () => {
    const config = resolveZeroExConfig({
      env: {
        AGW_MCP_ZEROEX_API_KEY: "mcp-key",
      },
    });

    expect(config.apiKey).toBe("mcp-key");
  });

  it("falls back to ZEROEX_API_KEY when AGW_MCP_ZEROEX_API_KEY is unset", () => {
    const config = resolveZeroExConfig({
      env: {
        ZEROEX_API_KEY: "legacy-key",
      },
    });

    expect(config.apiKey).toBe("legacy-key");
  });

  it("prefers explicit input apiKey over environment values", () => {
    const config = resolveZeroExConfig({
      apiKey: "cli-key",
      env: {
        AGW_MCP_ZEROEX_API_KEY: "env-key",
      },
    });

    expect(config.apiKey).toBe("cli-key");
  });

  it("trims whitespace and ignores empty values", () => {
    const config = resolveZeroExConfig({
      env: {
        AGW_MCP_ZEROEX_API_KEY: "   ",
        ZEROEX_API_KEY: "  from-env  ",
      },
    });

    expect(config.apiKey).toBe("from-env");
  });
});
