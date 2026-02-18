import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { SessionStorage } from "../src/session/storage.js";
import type { AgwSessionData } from "../src/session/types.js";

describe("SessionStorage", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "agw-mcp-test-"));
  const storage = new SessionStorage(tmpDir);

  afterAll(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("saves and loads a valid session", () => {
    const now = Math.floor(Date.now() / 1000);
    const session: AgwSessionData = {
      accountAddress: "0x123",
      chainId: 11124,
      expiresAt: now + 3600,
      createdAt: now,
      updatedAt: now,
      status: "active",
      sessionConfig: { test: true },
      sessionSignerRef: { kind: "raw", value: "secret" },
    };

    storage.save(session);
    const loaded = storage.load();

    expect(loaded?.accountAddress).toBe("0x123");
    expect(loaded?.status).toBe("active");
  });
});
