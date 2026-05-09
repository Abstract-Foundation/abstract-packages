import { describe, expect, it, vi } from "vitest";
import * as Dialog from "../../src/core/Dialog.js";

function noopHandlers(): Dialog.DialogHandlers {
  return {
    onResponse: vi.fn(),
    onInternal: vi.fn(),
    onClose: vi.fn(),
  };
}

describe("popup factory", () => {
  it("does not throw when constructed; window.open only fires on open()", () => {
    // The factory call must not invoke window.open or attempt to mount any
    // bridge — those are deferred to open() so the user-gesture click is the
    // first time we touch the popup window.
    const openSpy = vi.spyOn(window, "open");
    const handle = Dialog.popup()({
      host: "https://wallet.test",
      handlers: noopHandlers(),
    });

    expect(handle.mode).toBe("popup");
    expect(openSpy).not.toHaveBeenCalled();

    handle.destroy();
    openSpy.mockRestore();
  });

  it("syncRequest before open() is a no-op", () => {
    // Mirrors Porto's `messenger?.send(...)` — pre-open syncRequest silently
    // drops rather than throwing, so a request still in the consumer's
    // pending map gets re-delivered on the next mode switch instead of
    // surfacing a noisy error.
    const handle = Dialog.popup()({
      host: "https://wallet.test",
      handlers: noopHandlers(),
    });
    expect(() =>
      handle.syncRequest({ id: 1, jsonrpc: "2.0", method: "eth_chainId" }),
    ).not.toThrow();
    handle.destroy();
  });

  it("waitForReady before open() rejects", async () => {
    const handle = Dialog.popup()({
      host: "https://wallet.test",
      handlers: noopHandlers(),
    });
    await expect(handle.waitForReady()).rejects.toThrow(/Popup not opened/);
    handle.destroy();
  });
});
