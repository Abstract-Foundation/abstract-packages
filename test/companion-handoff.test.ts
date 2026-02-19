import { createSignedHandoffToken as createCompanionSignedToken } from "../companion/src/handoff.js";
import { createCompanionHandoffSecret, startCompanionHandoffServer, verifySignedHandoffToken } from "../src/auth/handoff.js";

describe("companion-to-mcp handoff", () => {
  it("verifies signed handoff tokens across companion and MCP", () => {
    const secret = createCompanionHandoffSecret();
    const payload = JSON.stringify({
      accountAddress: "0x1111111111111111111111111111111111111111",
      expiresAt: 1900000000,
      sessionConfig: {},
      sessionSignerPrivateKey: "0x59c6995e998f97a5a0044966f0945388cf0f5ddf3cd34e3c5d6f6e64f5f4a799",
    });

    const token = createCompanionSignedToken(payload, secret);
    expect(verifySignedHandoffToken(token, secret)).toBe(payload);
  });

  it("accepts signed handoff payloads on localhost callback", async () => {
    const secret = createCompanionHandoffSecret();
    const server = await startCompanionHandoffServer({
      host: "127.0.0.1",
      port: 0,
      secret,
      timeoutMs: 10_000,
    });

    try {
      const payload = JSON.stringify({
        accountAddress: "0x1111111111111111111111111111111111111111",
        expiresAt: 1900000000,
        sessionConfig: {},
        sessionSignerPrivateKey: "0x59c6995e998f97a5a0044966f0945388cf0f5ddf3cd34e3c5d6f6e64f5f4a799",
      });
      const token = createCompanionSignedToken(payload, secret);

      const response = await fetch(`${server.callbackUrl}?handoff=${encodeURIComponent(token)}`);
      expect(response.status).toBe(200);

      await expect(server.waitForPayload()).resolves.toBe(payload);
    } finally {
      await server.close();
    }
  });
});
