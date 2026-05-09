import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createWallet } from "../../src/core/Wallet.js";

function mockPopupWindow(): Window {
  return {
    closed: false,
    close: vi.fn(),
    focus: vi.fn(),
    postMessage: vi.fn(),
  } as unknown as Window;
}

describe("createWallet", () => {
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
    vi.restoreAllMocks();
    document.querySelectorAll("dialog[data-abs-wallet]").forEach((node) => {
      node.remove();
    });
  });

  it("opens wallet_connect in a top-level popup in auto mode", async () => {
    const openSpy = vi.spyOn(window, "open").mockReturnValue(mockPopupWindow());
    const wallet = createWallet({
      host: "https://wallet.test",
      chainId: 1,
    });

    const request = wallet.provider
      .request({
        method: "wallet_connect",
        params: [{ chainId: 1 }],
      })
      .catch((error: unknown) => error);

    expect(openSpy).toHaveBeenCalledTimes(1);
    expect(openSpy.mock.calls[0]?.[0]).toBe(
      "https://wallet.test/popup?origin=http%3A%2F%2Flocalhost%3A3000",
    );

    wallet.destroy();
    await expect(request).resolves.toBeInstanceOf(Error);
  });

  it("opens eth_requestAccounts in a top-level popup even when iframe mode was requested", async () => {
    const openSpy = vi.spyOn(window, "open").mockReturnValue(mockPopupWindow());
    const wallet = createWallet({
      host: "https://wallet.test",
      chainId: 1,
      dialog: "iframe",
    });

    const request = wallet.provider
      .request({ method: "eth_requestAccounts" })
      .catch((error: unknown) => error);

    expect(openSpy).toHaveBeenCalledTimes(1);
    expect(openSpy.mock.calls[0]?.[0]).toBe(
      "https://wallet.test/popup?origin=http%3A%2F%2Flocalhost%3A3000",
    );

    wallet.destroy();
    await expect(request).resolves.toBeInstanceOf(Error);
  });
});
