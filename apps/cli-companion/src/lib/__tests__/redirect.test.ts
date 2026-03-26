import { describe, expect, it } from "vitest";
import { buildRedirectUrl, isLoopbackCallbackUrl } from "../redirect";

describe("redirect helpers", () => {
  it("builds loopback redirect with session payload", () => {
    const url = buildRedirectUrl(
      "http://127.0.0.1:8787/cb/test?state=test-state",
      "signed.callback.token",
    );

    const parsed = new URL(url);
    const session = parsed.searchParams.get("session");
    expect(session).toBe("signed.callback.token");
    expect(parsed.searchParams.get("state")).toBe("test-state");
  });

  it("rejects non-loopback callback urls", () => {
    expect(() =>
      buildRedirectUrl(
        "https://evil.example/callback",
        "signed.callback.token",
      ),
    ).toThrow("Only loopback");

    expect(isLoopbackCallbackUrl("http://localhost:8787/cb")).toBe(true);
    expect(isLoopbackCallbackUrl("https://localhost:8787/cb")).toBe(false);
    expect(isLoopbackCallbackUrl("http://user:pass@127.0.0.1:8787/cb")).toBe(
      false,
    );
  });
});
