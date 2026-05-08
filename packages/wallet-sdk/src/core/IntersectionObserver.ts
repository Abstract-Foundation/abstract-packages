/**
 * Feature-detect IntersectionObserver v2 (Chromium-only at time of writing).
 * V2 adds the `isVisible` property which is set to `false` if the observed
 * element is occluded by other DOM (a transparent overlay, a covering modal,
 * etc.). That's the only standards-compliant primitive that detects visual
 * occlusion — and it's what makes the iframe-side clickjacking defence work.
 *
 * Verbatim from porto/src/core/internal/intersectionObserver.ts.
 */

export function supported(): boolean {
  if (typeof window === "undefined") return false;
  return (
    "IntersectionObserver" in window &&
    "IntersectionObserverEntry" in window &&
    "intersectionRatio" in IntersectionObserverEntry.prototype &&
    "isVisible" in IntersectionObserverEntry.prototype
  );
}
