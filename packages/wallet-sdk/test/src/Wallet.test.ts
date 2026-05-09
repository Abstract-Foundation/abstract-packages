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

  it("opens wallet_connect in the iframe in auto mode (host handles inline auth)", () => {
    const openSpy = vi.spyOn(window, "open").mockReturnValue(mockPopupWindow());
    const wallet = createWallet({
      host: "https://wallet.test",
      chainId: 1,
    });

    void wallet.provider
      .request({
        method: "wallet_connect",
        params: [{ chainId: 1 }],
      })
      .catch(() => {
        // Pending; we destroy below.
      });

    // No popup is opened pre-emptively; the iframe surface renders the
    // inline LoginView and only escalates to popup when the user picks an
    // OAuth provider that demands a top-level context.
    expect(openSpy).not.toHaveBeenCalled();

    wallet.destroy();
  });

  it("respects an explicit popup mode override for eth_requestAccounts", () => {
    const openSpy = vi.spyOn(window, "open").mockReturnValue(mockPopupWindow());
    const wallet = createWallet({
      host: "https://wallet.test",
      chainId: 1,
      dialog: "popup",
    });

    void wallet.provider
      .request({ method: "eth_requestAccounts" })
      .catch(() => {
        // Pending; we destroy below.
      });

    expect(openSpy).toHaveBeenCalledTimes(1);
    expect(openSpy.mock.calls[0]?.[0]).toBe(
      "https://wallet.test/popup?origin=http%3A%2F%2Flocalhost%3A3000",
    );

    wallet.destroy();
  });
});
