import { describe, expect, it, vi } from "vitest";
import { fromWindow } from "../../src/core/Messenger.js";

describe("fromWindow", () => {
  it("rejects messages from a different origin", () => {
    const messenger = fromWindow(window, {
      targetOrigin: "https://wallet.test",
    });
    const listener = vi.fn();
    const off = messenger.on("rpc-response", listener);

    window.dispatchEvent(
      new MessageEvent("message", {
        origin: "https://evil.test",
        data: {
          abs: 1,
          id: "a",
          topic: "rpc-response",
          payload: { id: 1, jsonrpc: "2.0", result: "pwned" },
        },
      }),
    );

    expect(listener).not.toHaveBeenCalled();
    off();
    messenger.destroy();
  });

  it("accepts messages from the configured target origin", () => {
    const messenger = fromWindow(window, {
      targetOrigin: "https://wallet.test",
    });
    const listener = vi.fn();
    const off = messenger.on("rpc-response", listener);

    window.dispatchEvent(
      new MessageEvent("message", {
        origin: "https://wallet.test",
        data: {
          abs: 1,
          id: "a",
          topic: "rpc-response",
          payload: {
            id: 1,
            jsonrpc: "2.0",
            result: "ok",
            _request: { id: 1, jsonrpc: "2.0", method: "eth_chainId" },
          },
        },
      }),
    );

    expect(listener).toHaveBeenCalledTimes(1);
    off();
    messenger.destroy();
  });

  it("refuses to send without a target origin", () => {
    const fakeWin = { postMessage: vi.fn() } as unknown as Window;
    const messenger = fromWindow(fakeWin);
    expect(() =>
      messenger.send("rpc-request", {
        id: 1,
        jsonrpc: "2.0",
        method: "eth_chainId",
      }),
    ).toThrow(/targetOrigin is required/);
  });

  it("ignores envelopes that lack the abs brand", () => {
    const messenger = fromWindow(window, {
      targetOrigin: "https://wallet.test",
    });
    const listener = vi.fn();
    const off = messenger.on("rpc-response", listener);

    window.dispatchEvent(
      new MessageEvent("message", {
        origin: "https://wallet.test",
        data: { topic: "rpc-response", payload: { result: "spoofed" } },
      }),
    );

    expect(listener).not.toHaveBeenCalled();
    off();
    messenger.destroy();
  });
});
