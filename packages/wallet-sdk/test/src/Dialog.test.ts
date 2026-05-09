import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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

  it("notifies the local close handler when the user closes the popup", () => {
    vi.useFakeTimers();
    const popupWindow = {
      closed: false,
      close: vi.fn(),
      focus: vi.fn(),
      postMessage: vi.fn(),
    } as unknown as Window;
    const openSpy = vi.spyOn(window, "open").mockReturnValue(popupWindow);
    const handlers = noopHandlers();
    const handle = Dialog.popup()({
      host: "https://wallet.test",
      handlers,
    });

    try {
      handle.open();
      expect(openSpy.mock.calls[0]?.[0]).toBe(
        "https://wallet.test/popup?origin=http%3A%2F%2Flocalhost%3A3000",
      );
      (popupWindow as Window & { closed: boolean }).closed = true;
      vi.advanceTimersByTime(250);

      expect(handlers.onClose).toHaveBeenCalledTimes(1);
    } finally {
      handle.destroy();
      openSpy.mockRestore();
      vi.useRealTimers();
    }
  });

  it("destroys the current bridge before reopening a new popup", () => {
    const removeSpy = vi.spyOn(window, "removeEventListener");
    const popupWindow = {
      closed: false,
      close: vi.fn(),
      focus: vi.fn(),
      postMessage: vi.fn(),
    } as unknown as Window;
    const openSpy = vi.spyOn(window, "open").mockReturnValue(popupWindow);
    const handle = Dialog.popup()({
      host: "https://wallet.test",
      handlers: noopHandlers(),
    });

    try {
      handle.open();
      handle.close();
      const cleanupCountBeforeReopen = removeSpy.mock.calls.filter(
        ([type]) => type === "message",
      ).length;

      handle.open();

      expect(cleanupCountBeforeReopen).toBeGreaterThan(0);
    } finally {
      handle.destroy();
      openSpy.mockRestore();
      removeSpy.mockRestore();
    }
  });

  it("cleans up a closed popup bridge before the poller observes it", () => {
    const removeSpy = vi.spyOn(window, "removeEventListener");
    const firstPopup = {
      closed: false,
      close: vi.fn(),
      focus: vi.fn(),
      postMessage: vi.fn(),
    } as unknown as Window;
    const secondPopup = {
      closed: false,
      close: vi.fn(),
      focus: vi.fn(),
      postMessage: vi.fn(),
    } as unknown as Window;
    const openSpy = vi
      .spyOn(window, "open")
      .mockReturnValueOnce(firstPopup)
      .mockReturnValueOnce(secondPopup);
    const handle = Dialog.popup()({
      host: "https://wallet.test",
      handlers: noopHandlers(),
    });

    try {
      handle.open();
      (firstPopup as Window & { closed: boolean }).closed = true;
      handle.open();

      const listenerCleanupCount = removeSpy.mock.calls.filter(
        ([type]) => type === "message",
      ).length;
      expect(listenerCleanupCount).toBeGreaterThan(0);
    } finally {
      handle.destroy();
      openSpy.mockRestore();
      removeSpy.mockRestore();
    }
  });
});

describe("iframe factory", () => {
  const realMatchMedia = window.matchMedia;

  beforeEach(() => {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn().mockReturnValue({
        addEventListener: vi.fn(),
        matches: false,
        removeEventListener: vi.fn(),
      }),
    });
  });

  afterEach(() => {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: realMatchMedia,
    });
    document.querySelectorAll("dialog[data-abs-wallet]").forEach((node) => {
      node.remove();
    });
  });

  it("allows the wallet host iframe to request storage access", () => {
    const handle = Dialog.iframe()({
      host: "https://wallet.test",
      handlers: noopHandlers(),
    });

    const frame = document.querySelector(
      'iframe[data-testid="abstract-wallet"]',
    );

    expect(frame?.getAttribute("sandbox")?.split(" ")).toContain(
      "allow-storage-access-by-user-activation",
    );
    expect(frame?.getAttribute("allow")).toContain(
      "storage-access https://wallet.test",
    );

    handle.destroy();
  });
});
