import { describe, expect, it, vi } from "vitest";
import * as Dialog from "../../src/core/Dialog.js";

describe("popup factory", () => {
  it("does not throw when listeners or sends are issued before open()", () => {
    const handle = Dialog.popup()({ host: "https://wallet.test" });

    const listener = vi.fn();
    const off = handle.messenger.on("rpc-response", listener);
    expect(typeof off).toBe("function");

    const envelope = handle.messenger.send("rpc-request", {
      id: 1,
      jsonrpc: "2.0",
      method: "eth_chainId",
    });
    expect(envelope.id).toBeTruthy();
    expect(envelope.topic).toBe("rpc-request");

    off();
    handle.destroy();
  });

  it("rejects pre-open waitForReady() callers when the handle is destroyed", async () => {
    const handle = Dialog.popup()({ host: "https://wallet.test" });
    const ready = handle.messenger.waitForReady();
    handle.destroy();
    await expect(ready).rejects.toThrow(/destroyed/);
  });
});
