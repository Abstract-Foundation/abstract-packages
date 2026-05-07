/**
 * Dialog factories — iframe + popup. Direct port of the security-relevant
 * pieces of Porto's `core/Dialog.ts`, adapted for Abstract's wallet host.
 *
 * The iframe is mounted inside a top-layer `<dialog>` so:
 *   - z-index attacks fail (top layer escapes z-index stacking entirely)
 *   - ESC always closes (browser handles the keybinding for free)
 *   - Backdrop is rendered for free via ::backdrop
 *
 * Iframe attributes are pinned to the same set Porto ships:
 *   sandbox="allow-forms allow-scripts allow-same-origin allow-popups
 *            allow-popups-to-escape-sandbox"
 *   allow="payment; publickey-credentials-get <origin>;
 *          publickey-credentials-create <origin>; clipboard-write"
 *
 * The clickjacking defence (IntersectionObserver v2 isVisible check) lives
 * INSIDE the iframe (in apps/web/wallet-host) — not here. From the parent
 * side, `secure()` only reports whether the iframe is *eligible* to run, by
 * combining HTTPS, IO v2 support, and the wallet host's trusted-host
 * allowlist (received over the messenger's `ready` payload).
 */

import * as IO from "./IntersectionObserver.js";
import * as Messenger from "./Messenger.js";
import * as UserAgent from "./UserAgent.js";

// ---------- Shared types ----------

export type DialogMode = "iframe" | "popup";

export type SecurityState = {
  /** Parent origin is HTTPS. */
  protocol: boolean;
  /** Iframe is eligible (IO v2 supported OR parent is in trustedHosts). */
  frame: boolean;
  /** Parent host appears in the wallet host's trustedHosts allowlist. */
  host: boolean;
};

export type DialogHandle = {
  readonly mode: DialogMode;
  readonly messenger: Messenger.Bridge;
  open(): void;
  close(): void;
  destroy(): void;
  /** Run the security checklist. Resolves once the messenger is ready. */
  secure(): Promise<SecurityState>;
};

export type DialogFactory = (parameters: {
  /** URL of the wallet host (e.g. `https://wallet.abs.xyz`). */
  host: string;
  /** Theme hint forwarded in the init payload. */
  theme?: "light" | "dark" | undefined;
}) => DialogHandle;

// ---------- Internals ----------

const DEFAULT_POPUP_SIZE = { width: 420, height: 720 };

function getReferrer(): { title: string; icon?: string } {
  if (typeof document === "undefined") return { title: "" };
  const link = document.querySelector(
    'link[rel="icon"]',
  ) as HTMLLinkElement | null;
  return {
    icon: link?.href,
    title: document.title,
  };
}

function originOf(url: string): string {
  return new URL(url).origin;
}

// ---------- Iframe factory ----------

export type IframeOptions = {
  /** Skip the HTTPS protocol gate. Off by default — only used in tests. */
  skipProtocolCheck?: boolean | undefined;
};

/**
 * Mount a top-layer `<dialog>` containing an iframe pointed at `host`. The
 * dialog is hidden until `open()` is called.
 */
export function iframe(options: IframeOptions = {}): DialogFactory {
  const { skipProtocolCheck = false } = options;

  return ({ host, theme }) => {
    if (typeof window === "undefined") return noopHandle();

    const hostOrigin = originOf(host);

    // Top-layer <dialog> root.
    const root = document.createElement("dialog");
    root.dataset.absWallet = "";
    root.setAttribute("role", "dialog");
    root.setAttribute("aria-label", "Abstract Wallet");
    root.setAttribute("hidden", "until-found");
    Object.assign(root.style, {
      background: "transparent",
      border: "0",
      outline: "0",
      padding: "0",
      position: "fixed",
      maxWidth: "100vw",
      maxHeight: "100vh",
    } as CSSStyleDeclaration);

    // Transparent backdrop so the page is dimmed by our own UI inside.
    const style = document.createElement("style");
    style.textContent = `dialog[data-abs-wallet]::backdrop { background: rgba(0,0,0,0.4); }`;

    // Iframe with hardened attributes.
    const frame = document.createElement("iframe");
    frame.setAttribute("data-testid", "abstract-wallet");
    frame.setAttribute("title", "Abstract Wallet");
    frame.setAttribute("tabindex", "0");
    frame.setAttribute(
      "sandbox",
      [
        "allow-forms",
        "allow-scripts",
        "allow-same-origin",
        "allow-popups",
        "allow-popups-to-escape-sandbox",
      ].join(" "),
    );
    const allow = [
      "payment",
      `publickey-credentials-get ${hostOrigin}`,
      `publickey-credentials-create ${hostOrigin}`,
    ];
    if (!UserAgent.isFirefox()) allow.push("clipboard-write");
    frame.setAttribute("allow", allow.join("; "));
    frame.setAttribute("src", host);
    Object.assign(frame.style, {
      backgroundColor: "transparent",
      border: "0",
      colorScheme: "light dark",
      width: "100%",
      height: "100%",
    } as CSSStyleDeclaration);

    document.body.appendChild(root);
    root.appendChild(style);
    root.appendChild(frame);

    // Defend against extensions (notably 1Password) that inject `inert` onto
    // <dialog>, which would render our confirmation surface unclickable.
    const inertObserver = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type !== "attributes" || m.attributeName !== "inert") continue;
        root.removeAttribute("inert");
      }
    });
    inertObserver.observe(root, { attributes: true });

    const messenger = Messenger.bridge({
      from: Messenger.fromWindow(window, { targetOrigin: hostOrigin }),
      // Iframe content window is non-null after the element is in the DOM and
      // the browser has parsed it — `appendChild` above guarantees that.
      to: Messenger.fromWindow(frame.contentWindow as Window, {
        targetOrigin: hostOrigin,
      }),
      waitForReady: true,
    });

    let isOpen = false;

    const handle: DialogHandle = {
      mode: "iframe",
      messenger,
      open() {
        if (isOpen) return;
        isOpen = true;
        root.removeAttribute("hidden");
        if (typeof root.showModal === "function") root.showModal();
        else root.setAttribute("open", "");
        messenger.send("__internal", {
          type: "init",
          mode: "iframe",
          referrer: getReferrer(),
          theme,
        });
      },
      close() {
        if (!isOpen) return;
        isOpen = false;
        if (typeof root.close === "function") root.close();
        root.setAttribute("hidden", "true");
      },
      destroy() {
        try {
          this.close();
        } catch {
          /* ignore */
        }
        inertObserver.disconnect();
        messenger.destroy();
        root.remove();
      },
      async secure() {
        const ready = await messenger.waitForReady();
        const protocol =
          skipProtocolCheck ||
          (typeof window !== "undefined" &&
            window.location.protocol === "https:");
        const trustedHost = Boolean(
          ready.trustedHosts?.includes(window.location.hostname),
        );
        const frameOk = IO.supported() || trustedHost;
        return { protocol, frame: frameOk, host: trustedHost };
      },
    };

    return handle;
  };
}

// ---------- Popup factory ----------

export type PopupOptions = {
  /** `auto` chooses page on mobile, popup on desktop. */
  type?: "auto" | "popup" | "page" | undefined;
  size?: { width: number; height: number } | undefined;
};

export function popup(options: PopupOptions = {}): DialogFactory {
  const { type = "auto", size = DEFAULT_POPUP_SIZE } = options;

  return ({ host, theme }) => {
    if (typeof window === "undefined") return noopHandle();

    const hostOrigin = originOf(host);
    const resolvedType =
      type === "page" || (type === "auto" && UserAgent.isMobile())
        ? "page"
        : "popup";

    let win: Window | null = null;
    let bridge: Messenger.Bridge | null = null;
    let pollClosed: ReturnType<typeof setInterval> | null = null;

    function teardownPoll() {
      if (pollClosed) {
        clearInterval(pollClosed);
        pollClosed = null;
      }
    }

    const handle: DialogHandle = {
      mode: "popup",
      // Lazily-bound — the bridge isn't constructable until `open()` runs.
      // Consumers should always call `open()` before reading `messenger`.
      get messenger(): Messenger.Bridge {
        if (!bridge)
          throw new Error(
            "Popup messenger not initialised — call open() before sending",
          );
        return bridge;
      },
      open() {
        if (win && !win.closed) {
          win.focus();
          return;
        }

        const features =
          resolvedType === "popup"
            ? `width=${size.width},height=${size.height},left=${
                Math.max(0, (window.innerWidth - size.width) / 2) +
                window.screenX
              },top=${window.screenY + 80}`
            : "";

        // IMPORTANT: window.open must run synchronously inside a user-gesture
        // handler or it will be popup-blocked. Callers funnel through here
        // from a click handler.
        win = window.open(host, "abstract-wallet", features);
        if (!win) throw new Error("Popup blocked by browser");

        bridge = Messenger.bridge({
          from: Messenger.fromWindow(window, { targetOrigin: hostOrigin }),
          to: Messenger.fromWindow(win, { targetOrigin: hostOrigin }),
          waitForReady: true,
        });

        bridge.send("__internal", {
          type: "init",
          mode: "popup",
          referrer: getReferrer(),
          theme,
        });

        // If the user closes the popup without acting, treat that as a
        // rejection — the consumer's outstanding requests should reject.
        pollClosed = setInterval(() => {
          if (win?.closed) {
            teardownPoll();
            bridge?.send("close", undefined);
          }
        }, 250);
      },
      close() {
        teardownPoll();
        try {
          win?.close();
        } catch {
          /* COOP severs the WindowProxy — popup closes itself anyway */
        }
        win = null;
      },
      destroy() {
        this.close();
        bridge?.destroy();
        bridge = null;
      },
      async secure() {
        // Popups don't suffer from clickjacking — the wallet runs in its own
        // top-level window, fully visible to the user. So all gates pass.
        return { protocol: true, frame: true, host: true };
      },
    };

    return handle;
  };
}

// ---------- Noop (SSR / non-browser) ----------

function noopHandle(): DialogHandle {
  const noopMessenger: Messenger.Bridge = {
    on: () => () => {
      /* no-op: SSR / non-browser environments have no message bus */
    },
    send: <T extends Messenger.Topic>(
      topic: T,
      payload: Messenger.Payload<T>,
    ) => ({ id: "", topic, payload }),
    destroy: () => {
      /* no-op: nothing to tear down */
    },
    ready: () => {
      /* no-op: ready handshake never fires in SSR */
    },
    waitForReady: () =>
      new Promise<Messenger.ReadyOptions>(() => {
        /* never resolves in SSR — caller is expected to abort on its own */
      }),
  };

  return {
    mode: "iframe",
    messenger: noopMessenger,
    open() {
      /* no-op: cannot mount a dialog without a window */
    },
    close() {
      /* no-op: nothing was opened */
    },
    destroy() {
      /* no-op: nothing was created */
    },
    async secure() {
      return { protocol: false, frame: false, host: false };
    },
  };
}
