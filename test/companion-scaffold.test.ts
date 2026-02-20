import { startCompanionServer, type StartedCompanionServer } from "../companion/src/server.js";

describe("companion app scaffold", () => {
  let server: StartedCompanionServer | undefined;

  afterEach(async () => {
    if (server) {
      await server.close();
      server = undefined;
    }
  });

  it("serves healthz and policy endpoints", async () => {
    server = await startCompanionServer({
      host: "127.0.0.1",
      port: 0,
    });

    const healthResponse = await fetch(`${server.url}/healthz`);
    expect(healthResponse.status).toBe(200);

    const previewResponse = await fetch(`${server.url}/policy/preview?preset=transfer`);
    expect(previewResponse.status).toBe(200);
    const previewPayload = (await previewResponse.json()) as { presetId: string };
    expect(previewPayload.presetId).toBe("transfer");
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
      "transfer",
      "custom",
    ]);
    expect(payload.defaultCustomTemplate.expiresInSeconds).toBe(3600);
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
    expect(payload.policyPayload.sessionConfig.maxValuePerUse).toBe("10000000000000000");
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

  it("ignores customPolicy input unless custom preset is selected", async () => {
    server = await startCompanionServer({
      host: "127.0.0.1",
      port: 0,
    });

    const malformedCustomPolicy = "{not-json}";

    const previewResponse = await fetch(
      `${server.url}/policy/preview?preset=transfer&customPolicy=${encodeURIComponent(malformedCustomPolicy)}`,
    );
    expect(previewResponse.status).toBe(200);

    const previewPayload = (await previewResponse.json()) as { presetId: string };
    expect(previewPayload.presetId).toBe("transfer");
  });

  it("registers handoff session via POST /handoff/session", async () => {
    server = await startCompanionServer({
      host: "127.0.0.1",
      port: 0,
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
    expect(typeof registerPayload.handoffSessionId).toBe("string");
  });

  it("returns 404 for removed routes", async () => {
    server = await startCompanionServer({
      host: "127.0.0.1",
      port: 0,
    });

    const authStartResponse = await fetch(`${server.url}/auth/start`, { redirect: "manual" });
    expect(authStartResponse.status).toBe(404);

    const handoffReceiveResponse = await fetch(`${server.url}/handoff/receive`);
    expect(handoffReceiveResponse.status).toBe(404);

    const indexResponse = await fetch(`${server.url}/`);
    expect(indexResponse.status).toBe(404);
  });
});
