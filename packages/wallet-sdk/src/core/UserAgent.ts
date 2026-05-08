/**
 * Browser detection used to gate iframe-vs-popup decisions.
 *
 * - Safari blocks WebAuthn credential creation inside iframes, so any request
 *   that may invoke `navigator.credentials.create` (e.g. wallet_connect when
 *   the user has no passkey yet) must route through the popup on Safari.
 * - Firefox lacks IntersectionObserver v2 (`isVisible`), so it always falls
 *   back to the trusted-hosts allowlist for clickjacking protection.
 * - Chromium/Edge/WebView support IO v2 — happy path.
 *
 * These checks intentionally use simple userAgent regexes. We don't need
 * version precision; we need robust signal-of-vendor for security decisions
 * that only have two outcomes (iframe vs popup).
 */

function ua(): string {
  if (typeof navigator === "undefined") return "";
  return navigator.userAgent ?? "";
}

export function isSafari(): boolean {
  const a = ua();
  // "Safari" is in Chrome's UA too, so exclude Chrome/Chromium/Edg/Android.
  return (
    /^((?!chrome|android|crios|fxios|edg).)*safari/i.test(a) &&
    !/Chromium/.test(a)
  );
}

export function isFirefox(): boolean {
  return /firefox|fxios/i.test(ua());
}

export function isMobile(): boolean {
  // Used by popup factory to choose `page` vs `popup` window mode.
  return /android|iphone|ipad|ipod|mobile/i.test(ua());
}

export function isIos(): boolean {
  return /iphone|ipad|ipod/i.test(ua());
}
