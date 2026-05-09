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

/**
 * Inbound callbacks the consumer (e.g. `Wallet.ts`) passes when constructing a
 * dialog. The factory wires these into the messenger internally — consumers
 * never touch the underlying transport directly. Mirrors Porto's design,
 * which uses a shared store + handler functions instead of exposing the
 * messenger surface (see `porto/src/core/Dialog.ts`).
 */
export type DialogHandlers = {
  /** Fired when the wallet host returns an RPC response. */
  onResponse(
    response: Messenger.RpcResponse & { _request: Messenger.RpcRequest },
  ): void;
  /** Fired for internal control payloads (e.g. mode switch requests). */
  onInternal(payload: Messenger.InternalPayload): void;
  /** Fired when the wallet host (or popup-close watcher) signals close. */
  onClose(): void;
};

export type DialogHandle = {
  readonly mode: DialogMode;
  open(): void;
  close(): void;
  destroy(): void;
  /** Run the security checklist. Resolves once the messenger is ready. */
  secure(): Promise<SecurityState>;
  /** Forward an RPC request to the wallet host. */
  syncRequest(request: Messenger.RpcRequest): void;
  /** Resolve once the wallet host announces ready (with its capabilities). */
  waitForReady(): Promise<Messenger.ReadyOptions>;
};

export type DialogFactory = (parameters: {
  /** URL of the wallet host (e.g. `https://wallet.abs.xyz`). */
  host: string;
  /** Theme hint forwarded in the init payload. */
  theme?: "light" | "dark" | undefined;
  /** Inbound callbacks. Wired into the messenger by the factory. */
  handlers: DialogHandlers;
}) => DialogHandle;

// ---------- Internals ----------

const DEFAULT_POPUP_SIZE = { width: 420, height: 720 };
const DRAWER_BREAKPOINT = 460;

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

/**
 * The wallet-host serves the iframe entry at `/dialog` and the popup
 * fallback at `/popup`. Consumers pass the host (e.g.
 * `https://wallet.abs.xyz`); the SDK appends the route automatically so
 * users can't accidentally point the iframe at the host's info page.
 */
const DIALOG_PATH = "/dialog";
const POPUP_PATH = "/popup";

function buildHostUrl(host: string, path: string): string {
  const url = new URL(host);
  // Preserve any existing path segments the consumer added (e.g. for
  // multi-tenant deploys), but ensure we always land on `/dialog` or
  // `/popup`. If the host already includes the path, treat it as a
  // pre-built URL and pass through.
  const stripped = url.pathname.replace(/\/$/, "");
  if (stripped === path || stripped.endsWith(path)) {
    // already pointed at the right route
    return url.toString();
  }
  url.pathname = `${stripped}${path}`;
  return url.toString();
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

  return ({ host, theme, handlers }) => {
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
      pointerEvents: "none",
    } as CSSStyleDeclaration);

    // Keep the parent document visually neutral. The wallet host iframe owns
    // its own overlay/chrome so the complete confirmation surface is rendered
    // from the trusted wallet origin, matching Porto's model.
    const style = document.createElement("style");
    style.textContent = `dialog[data-abs-wallet]::backdrop { background: transparent !important; }`;

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
    frame.setAttribute("src", buildHostUrl(host, DIALOG_PATH));
    // Mirrors Porto's iframe positioning: the parent SDK backdrop stays
    // transparent and the wallet host iframe owns the in-frame overlay/chrome.
    Object.assign(frame.style, {
      backgroundColor: "transparent",
      border: "0",
      position: "fixed",
      left: "0",
      top: "0",
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

    // Inbound wiring is internal — the consumer never touches the messenger.
    messenger.on("rpc-response", handlers.onResponse);
    messenger.on("__internal", handlers.onInternal);
    messenger.on("close", handlers.onClose);

    const drawerModeQuery = window.matchMedia(
      `(max-width: ${DRAWER_BREAKPOINT}px)`,
    );
    const sendResize = () => {
      messenger.send("__internal", {
        type: "resize",
        // Match Porto's contract: 460 = drawer mode, 461 = floating mode.
        width: drawerModeQuery.matches
          ? DRAWER_BREAKPOINT
          : DRAWER_BREAKPOINT + 1,
      });
    };
    const onDrawerModeChange = () => {
      sendResize();
    };
    drawerModeQuery.addEventListener("change", onDrawerModeChange);

    const sendInit = () => {
      messenger.send("__internal", {
        type: "init",
        mode: "iframe",
        referrer: getReferrer(),
        theme,
      });
    };
    void messenger.waitForReady().then(
      () => {
        sendInit();
        sendResize();
      },
      () => {
        /* destroyed */
      },
    );

    let isOpen = false;
    let isActive = false;
    let bodyStyle: Partial<CSSStyleDeclaration> | null = null;
    let opener: HTMLElement | null = null;

    const onRootClick = () => {
      handle.close();
    };
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") handle.close();
    };
    const activatePage = () => {
      if (!isActive) return;
      isActive = false;

      root.removeEventListener("click", onRootClick);
      document.removeEventListener("keydown", onEscape);
      root.style.pointerEvents = "none";
      opener?.focus();
      opener = null;

      Object.assign(document.body.style, bodyStyle ?? {});
      document.body.style.overflow = bodyStyle?.overflow ?? "";
      bodyStyle = null;
    };
    const activateDialog = () => {
      if (isActive) return;
      isActive = true;

      root.addEventListener("click", onRootClick);
      document.addEventListener("keydown", onEscape);
      frame.focus();
      root.style.pointerEvents = "auto";

      bodyStyle = Object.assign({}, document.body.style);
      document.body.style.overflow = "hidden";
    };
    const showDialog = () => {
      if (isOpen) return;
      isOpen = true;

      if (document.activeElement instanceof HTMLElement) {
        opener = document.activeElement;
      }
      root.removeAttribute("hidden");
      root.removeAttribute("aria-closed");
      if (typeof root.showModal === "function") root.showModal();
      else root.setAttribute("open", "");
    };
    const hideDialog = () => {
      if (!isOpen) return;
      isOpen = false;

      if (typeof root.close === "function") root.close();
      else root.removeAttribute("open");
      root.setAttribute("hidden", "true");
      root.setAttribute("aria-closed", "true");

      for (const sibling of root.parentNode
        ? Array.from(root.parentNode.children)
        : []) {
        if (sibling === root) continue;
        if (!sibling.hasAttribute("inert")) continue;
        sibling.removeAttribute("inert");
      }
    };

    const handle: DialogHandle = {
      mode: "iframe",
      open() {
        showDialog();
        activateDialog();
        sendInit();
      },
      close() {
        hideDialog();
        activatePage();
        sendInit();
      },
      destroy() {
        try {
          this.close();
        } catch {
          /* ignore */
        }
        inertObserver.disconnect();
        drawerModeQuery.removeEventListener("change", onDrawerModeChange);
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
      syncRequest(request) {
        messenger.send("rpc-request", request);
      },
      waitForReady() {
        return messenger.waitForReady();
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

  return ({ host, theme, handlers }) => {
    if (typeof window === "undefined") return noopHandle();

    const hostOrigin = originOf(host);
    const resolvedType =
      type === "page" || (type === "auto" && UserAgent.isMobile())
        ? "page"
        : "popup";

    let win: Window | null = null;
    // The messenger is constructed inside `open()` because `Messenger.fromWindow`
    // requires the popup's Window reference, which only exists after
    // `window.open()`. Mirrors Porto's design — consumers never touch this
    // directly; they go through `syncRequest` / `waitForReady` instead.
    let messenger: Messenger.Bridge | null = null;
    let pollClosed: ReturnType<typeof setInterval> | null = null;

    function teardownPoll() {
      if (pollClosed) {
        clearInterval(pollClosed);
        pollClosed = null;
      }
    }

    const handle: DialogHandle = {
      mode: "popup",
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
        win = window.open(
          buildHostUrl(host, POPUP_PATH),
          "abstract-wallet",
          features,
        );
        if (!win) throw new Error("Popup blocked by browser");

        messenger = Messenger.bridge({
          from: Messenger.fromWindow(window, { targetOrigin: hostOrigin }),
          to: Messenger.fromWindow(win, { targetOrigin: hostOrigin }),
          waitForReady: true,
        });

        // Wire inbound listeners now that the bridge exists. They live for
        // the lifetime of this handle (until `destroy()`).
        messenger.on("rpc-response", handlers.onResponse);
        messenger.on("__internal", handlers.onInternal);
        messenger.on("close", handlers.onClose);

        messenger.send("__internal", {
          type: "init",
          mode: "popup",
          referrer: getReferrer(),
          theme,
        });

        // If the user closes the popup without acting, surface a `close`
        // event so outstanding requests get rejected as user-rejections.
        pollClosed = setInterval(() => {
          if (win?.closed) {
            teardownPoll();
            messenger?.send("close", undefined);
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
        messenger?.destroy();
        messenger = null;
      },
      async secure() {
        // Popups don't suffer from clickjacking — the wallet runs in its own
        // top-level window, fully visible to the user. So all gates pass.
        return { protocol: true, frame: true, host: true };
      },
      syncRequest(request) {
        // Optional-chained — mirrors Porto's `messenger?.send(...)`. If a
        // caller forgets to `open()` first, the send is silently dropped
        // rather than throwing; the request stays in the consumer's pending
        // map and will be retried on the next mode switch.
        messenger?.send("rpc-request", request);
      },
      async waitForReady() {
        if (!messenger) {
          throw new Error("Popup not opened — call open() first");
        }
        return messenger.waitForReady();
      },
    };

    return handle;
  };
}

// ---------- Noop (SSR / non-browser) ----------

function noopHandle(): DialogHandle {
  return {
    mode: "iframe",
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
    syncRequest() {
      /* no-op: no transport in SSR */
    },
    waitForReady() {
      // Never resolves in SSR — caller is expected to abort on its own.
      return new Promise<Messenger.ReadyOptions>(() => {});
    },
  };
}
