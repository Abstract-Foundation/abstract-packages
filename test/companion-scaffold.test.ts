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
    expect(shellText).toContain("Policy Preset");
    expect(shellText).toContain("Policy Preview");

    const previewResponse = await fetch(`${server.url}/policy/preview?preset=read_only`);
    expect(previewResponse.status).toBe(200);
    const previewPayload = (await previewResponse.json()) as { presetId: string };
    expect(previewPayload.presetId).toBe("read_only");

    const redirectResponse = await fetch(
      `${server.url}/auth/start?callbackUrl=${encodeURIComponent("http://127.0.0.1:8787/callback")}&chainId=11124&state=session-smoke`,
      { redirect: "manual" },
    );

    expect(redirectResponse.status).toBe(302);
    expect(redirectResponse.headers.get("location")).toBe(
      "https://wallet.example/login?redirect_uri=http%3A%2F%2F127.0.0.1%3A8787%2Fcallback&chain_id=11124&state=session-smoke&source=agw-mcp-companion",
    );
  });

  it("rejects invalid custom policies before auth redirect", async () => {
    server = await startCompanionServer({
      host: "127.0.0.1",
      port: 0,
      authBaseUrl: "https://wallet.example/login",
    });

    const invalidCustomPolicy = JSON.stringify({
      expiresInSeconds: 60,
      sessionConfig: {
        feeLimit: "1000",
        maxValuePerUse: "1",
        callPolicies: [],
        transferPolicies: [],
      },
    });

    const response = await fetch(
      `${server.url}/auth/start?callbackUrl=${encodeURIComponent("http://127.0.0.1:8787/callback")}&chainId=11124&preset=custom&customPolicy=${encodeURIComponent(invalidCustomPolicy)}`,
      { redirect: "manual" },
    );

    expect(response.status).toBe(400);
    await expect(response.text()).resolves.toContain("Invalid custom policy");
  });

  it("exposes safe policy presets with a default custom template", async () => {
    server = await startCompanionServer({
      host: "127.0.0.1",
      port: 0,
    });

    const response = await fetch(`${server.url}/policy/presets`);
    expect(response.status).toBe(200);

    const payload = (await response.json()) as {
      presets: Array<{ id: string }>;
      defaultCustomTemplate: { expiresInSeconds: number };
    };

    expect(payload.presets.map(preset => preset.id)).toEqual([
      "read_only",
      "transfer",
      "swap",
      "contract_write",
      "read_and_sign",
      "limited_spend",
      "custom",
    ]);
    expect(payload.defaultCustomTemplate.expiresInSeconds).toBe(900);
  });

  it("builds a default custom preview when customPolicy is omitted", async () => {
    server = await startCompanionServer({
      host: "127.0.0.1",
      port: 0,
    });

    const response = await fetch(`${server.url}/policy/preview?preset=custom`);
    expect(response.status).toBe(200);

    const payload = (await response.json()) as {
      presetId: string;
      policyPayload: { sessionConfig: { maxValuePerUse: string } };
    };

    expect(payload.presetId).toBe("custom");
    expect(payload.policyPayload.sessionConfig.maxValuePerUse).toBe("1000000000000000");
  });

  it("builds a custom preview from provided customPolicy input", async () => {
    server = await startCompanionServer({
      host: "127.0.0.1",
      port: 0,
    });

    const customPolicy = JSON.stringify({
      expiresInSeconds: 900,
      sessionConfig: {
        feeLimit: "1000",
        maxValuePerUse: "7",
        callPolicies: [],
        transferPolicies: [],
      },
    });

    const response = await fetch(
      `${server.url}/policy/preview?preset=custom&customPolicy=${encodeURIComponent(customPolicy)}`,
    );
    expect(response.status).toBe(200);

    const payload = (await response.json()) as {
      presetId: string;
      policyPayload: { sessionConfig: { maxValuePerUse: string } };
    };

    expect(payload.presetId).toBe("custom");
    expect(payload.policyPayload.sessionConfig.maxValuePerUse).toBe("7");
  });

  it("allows /auth/start custom mode with default custom policy template", async () => {
    server = await startCompanionServer({
      host: "127.0.0.1",
      port: 0,
      authBaseUrl: "https://wallet.example/login",
    });

    const response = await fetch(
      `${server.url}/auth/start?callbackUrl=${encodeURIComponent("http://127.0.0.1:8787/callback")}&chainId=11124&preset=custom`,
      { redirect: "manual" },
    );

    expect(response.status).toBe(302);
    expect(response.headers.get("x-agw-policy-preset")).toBe("custom");
  });

  it("ignores customPolicy input unless custom preset is selected", async () => {
    server = await startCompanionServer({
      host: "127.0.0.1",
      port: 0,
      authBaseUrl: "https://wallet.example/login",
    });

    const malformedCustomPolicy = "{not-json}";

    const previewResponse = await fetch(
      `${server.url}/policy/preview?preset=read_only&customPolicy=${encodeURIComponent(malformedCustomPolicy)}`,
    );
    expect(previewResponse.status).toBe(200);

    const previewPayload = (await previewResponse.json()) as { presetId: string };
    expect(previewPayload.presetId).toBe("read_only");

    const redirectResponse = await fetch(
      `${server.url}/auth/start?callbackUrl=${encodeURIComponent("http://127.0.0.1:8787/callback")}&chainId=11124&preset=read_only&customPolicy=${encodeURIComponent(malformedCustomPolicy)}`,
      { redirect: "manual" },
    );

    expect(redirectResponse.status).toBe(302);
    expect(redirectResponse.headers.get("x-agw-policy-preset")).toBe("read_only");
  });

  it("requires explicit confirmation for high-risk policies", async () => {
    server = await startCompanionServer({
      host: "127.0.0.1",
      port: 0,
      authBaseUrl: "https://wallet.example/login",
    });

    const riskyCustomPolicy = JSON.stringify({
      expiresInSeconds: 20000,
      sessionConfig: {
        feeLimit: "1000000000000000",
        maxValuePerUse: "2000000000000000000",
        callPolicies: [],
        transferPolicies: [],
      },
    });

    const blocked = await fetch(
      `${server.url}/auth/start?callbackUrl=${encodeURIComponent("http://127.0.0.1:8787/callback")}&chainId=11124&preset=custom&customPolicy=${encodeURIComponent(riskyCustomPolicy)}`,
      { redirect: "manual" },
    );
    expect(blocked.status).toBe(400);
    await expect(blocked.text()).resolves.toContain("High-risk policy detected");

    const allowed = await fetch(
      `${server.url}/auth/start?callbackUrl=${encodeURIComponent("http://127.0.0.1:8787/callback")}&chainId=11124&preset=custom&customPolicy=${encodeURIComponent(riskyCustomPolicy)}&confirmHighRisk=true`,
      { redirect: "manual" },
    );
    expect(allowed.status).toBe(302);
  });

  it("signs callback payload and forwards it to MCP handoff URL via handoffSessionId", async () => {
    server = await startCompanionServer({
      host: "127.0.0.1",
      port: 0,
      authBaseUrl: "https://wallet.example/login",
    });

    const handoffSecret = "test-secret";
    const handoffUrl = "http://127.0.0.1:8787/callback";
    const registerResponse = await fetch(`${server.url}/handoff/session`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        handoffUrl,
        handoffSecret,
      }),
    });
    expect(registerResponse.status).toBe(201);
    const registerPayload = (await registerResponse.json()) as { handoffSessionId: string };

    const callbackPayload = JSON.stringify({
      accountAddress: "0x1111111111111111111111111111111111111111",
      expiresAt: 1700000000,
      sessionConfig: {},
      sessionSignerPrivateKey: "0x59c6995e998f97a5a0044966f0945388cf0f5ddf3cd34e3c5d6f6e64f5f4a799",
    });

    const response = await fetch(
      `${server.url}/handoff/receive?handoffSessionId=${encodeURIComponent(registerPayload.handoffSessionId)}&session=${encodeURIComponent(callbackPayload)}`,
      { redirect: "manual" },
    );
    expect(response.status).toBe(302);

    const location = response.headers.get("location");
    expect(location).toContain(`${handoffUrl}?handoff=`);
  });

  it("rejects auth handoff when handoffSessionId is invalid", async () => {
    server = await startCompanionServer({
      host: "127.0.0.1",
      port: 0,
      authBaseUrl: "https://wallet.example/login",
    });

    const response = await fetch(
      `${server.url}/auth/start?handoffSessionId=missing&chainId=11124&preset=read_only`,
      { redirect: "manual" },
    );
    expect(response.status).toBe(400);
    await expect(response.text()).resolves.toContain("Invalid or expired handoffSessionId");
  });
});
