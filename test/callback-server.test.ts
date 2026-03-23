import { startCallbackServer } from "../packages/agw-core/src/auth/handoff.js";

describe("localhost callback server", () => {
  it("accepts session payload via GET query parameter", async () => {
    const server = await startCallbackServer({
      host: "127.0.0.1",
      port: 0,
      timeoutMs: 10_000,
    });

    try {
      const payload = Buffer.from(
        JSON.stringify({
          accountAddress: "0x1111111111111111111111111111111111111111",
          expiresAt: 1900000000,
          sessionConfig: {},
        }),
        "utf8",
      ).toString("base64url");

      const response = await fetch(`${server.callbackUrl}?session=${encodeURIComponent(payload)}`);
      expect(response.status).toBe(200);

      await expect(server.waitForPayload()).resolves.toBe(payload);
    } finally {
      await server.close();
    }
  });

  it("rejects callback requests without session query parameter", async () => {
    const server = await startCallbackServer({
      host: "127.0.0.1",
      port: 0,
      timeoutMs: 10_000,
    });

    try {
      const response = await fetch(server.callbackUrl);
      expect(response.status).toBe(400);
      await expect(response.text()).resolves.toContain("Missing `session` query parameter.");
    } finally {
      await server.close();
    }
  });

  it("rejects non-GET callback requests", async () => {
    const server = await startCallbackServer({
      host: "127.0.0.1",
      port: 0,
      timeoutMs: 10_000,
    });

    try {
      const response = await fetch(server.callbackUrl, {
        method: "POST",
      });
      expect(response.status).toBe(405);
      await expect(response.text()).resolves.toBe("Method not allowed.");
    } finally {
      await server.close();
    }
  });

  it("rejects excessively large session query payloads", async () => {
    const server = await startCallbackServer({
      host: "127.0.0.1",
      port: 0,
      timeoutMs: 10_000,
    });

    try {
      const oversized = "a".repeat(129 * 1024);
      const response = await fetch(`${server.callbackUrl}?session=${oversized}`);
      expect([413, 431]).toContain(response.status);
      if (response.status === 413) {
        await expect(response.text()).resolves.toContain("too large");
      }
    } finally {
      await server.close();
    }
  });

  it("enforces callback state when configured", async () => {
    const server = await startCallbackServer({
      host: "127.0.0.1",
      port: 0,
      timeoutMs: 10_000,
      expectedState: "abc123",
    });

    try {
      const payload = Buffer.from(
        JSON.stringify({
          accountAddress: "0x1111111111111111111111111111111111111111",
          chainId: 11124,
          expiresAt: 1900000000,
          sessionConfig: {
            signer: "0x2222222222222222222222222222222222222222",
          },
        }),
        "utf8",
      ).toString("base64url");

      const missingState = await fetch(`${server.callbackUrl}?session=${encodeURIComponent(payload)}`);
      expect(missingState.status).toBe(400);
      await expect(missingState.text()).resolves.toContain("Missing `state`");

      const invalidState = await fetch(`${server.callbackUrl}?state=wrong&session=${encodeURIComponent(payload)}`);
      expect(invalidState.status).toBe(400);
      await expect(invalidState.text()).resolves.toContain("Invalid callback state");

      const validState = await fetch(`${server.callbackUrl}?state=abc123&session=${encodeURIComponent(payload)}`);
      expect(validState.status).toBe(200);
      await expect(server.waitForPayload()).resolves.toBe(payload);
    } finally {
      await server.close();
    }
  });

  it("rejects replay callback after first payload is accepted", async () => {
    const server = await startCallbackServer({
      host: "127.0.0.1",
      port: 0,
      timeoutMs: 10_000,
    });

    try {
      const payload = Buffer.from(
        JSON.stringify({
          accountAddress: "0x1111111111111111111111111111111111111111",
          chainId: 11124,
          expiresAt: 1900000000,
          sessionConfig: {
            signer: "0x2222222222222222222222222222222222222222",
          },
        }),
        "utf8",
      ).toString("base64url");

      const first = await fetch(`${server.callbackUrl}?session=${encodeURIComponent(payload)}`);
      expect(first.status).toBe(200);
      await expect(server.waitForPayload()).resolves.toBe(payload);

      const second = await fetch(`${server.callbackUrl}?session=${encodeURIComponent(payload)}`);
      expect(second.status).toBe(409);
      await expect(second.text()).resolves.toContain("already received");
    } finally {
      await server.close();
    }
  });
});
