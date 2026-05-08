import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isFirefox, isMobile, isSafari } from "../../src/core/UserAgent.js";

const realUa = navigator.userAgent;

function setUa(value: string) {
  Object.defineProperty(navigator, "userAgent", {
    configurable: true,
    get: () => value,
  });
}

describe("UserAgent", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    setUa(realUa);
  });

  it("detects Safari on macOS", () => {
    setUa(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
    );
    expect(isSafari()).toBe(true);
    expect(isFirefox()).toBe(false);
  });

  it("does not flag Chrome as Safari", () => {
    setUa(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
    );
    expect(isSafari()).toBe(false);
  });

  it("detects Firefox", () => {
    setUa(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:131.0) Gecko/20100101 Firefox/131.0",
    );
    expect(isFirefox()).toBe(true);
    expect(isSafari()).toBe(false);
  });

  it("detects mobile Safari", () => {
    setUa(
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    );
    expect(isMobile()).toBe(true);
  });
});
