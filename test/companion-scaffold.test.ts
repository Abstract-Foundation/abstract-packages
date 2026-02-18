import { buildCompanionAuthUrl } from "../companion/src/auth-entrypoint.js";
import { startCompanionServer, type StartedCompanionServer } from "../companion/src/server.js";

describe("companion app scaffold", () => {
  let server: StartedCompanionServer | undefined;

  afterEach(async () => {
    if (server) {
      await server.close();
      server = undefined;
    }
  });

  it("builds a wallet auth entrypoint URL with callback bootstrap params", () => {
    const authUrl = buildCompanionAuthUrl({
      authBaseUrl: "https://portal.abs.xyz/login",
      callbackUrl: "http://127.0.0.1:8787/callback",
      chainId: 11124,
      state: "smoke-state",
    });

    expect(authUrl).toBe(
      "https://portal.abs.xyz/login?redirect_uri=http%3A%2F%2F127.0.0.1%3A8787%2Fcallback&chain_id=11124&state=smoke-state&source=agw-mcp-companion",
    );
  });

  it("serves local shell and redirects /auth/start to wallet auth", async () => {
    server = await startCompanionServer({
      host: "127.0.0.1",
      port: 0,
      authBaseUrl: "https://wallet.example/login",
    });

    const shellResponse = await fetch(`${server.url}/`);
    expect(shellResponse.status).toBe(200);
    const shellText = await shellResponse.text();
    expect(shellText).toContain("AGW Companion");
    expect(shellText).toContain("Start wallet login");

    const redirectResponse = await fetch(
      `${server.url}/auth/start?callbackUrl=${encodeURIComponent("http://127.0.0.1:8787/callback")}&chainId=11124&state=session-smoke`,
      { redirect: "manual" },
    );

    expect(redirectResponse.status).toBe(302);
    expect(redirectResponse.headers.get("location")).toBe(
      "https://wallet.example/login?redirect_uri=http%3A%2F%2F127.0.0.1%3A8787%2Fcallback&chain_id=11124&state=session-smoke&source=agw-mcp-companion",
    );
  });
});
