/**
 * `createWallet` — the dApp's entry point. Returns an EIP-1193 provider that
 * routes every JSON-RPC request to the wallet host via the messenger, opening
 * the appropriate dialog when the request requires user confirmation.
 *
 * Mode selection:
 *   1. Default to `iframe` for every request unless the caller explicitly
 *      forced popup mode. The wallet host renders inline auth surfaces
 *      (email OTP, passkey, SMS) inside the iframe and only requests popup
 *      escalation when the user picks an external OAuth provider via
 *      `__internal { type: 'switch', mode: 'popup' }`.
 *   2. After the iframe's `ready` arrives, run `secure()`. If the parent is
 *      on HTTP, or if IntersectionObserver v2 is unavailable AND the parent
 *      origin isn't on the wallet host's trusted-host allowlist, transparently
 *      switch to popup before sending pending requests.
 *   3. The wallet host can request a runtime switch at any time by emitting
 *      `__internal { type: 'switch', mode: 'popup' }` over the messenger —
 *      used for cases the dApp side can't predict (external OAuth providers
 *      that reject embedded user agents, Safari-only WebAuthn enrollment).
 */

import * as Dialog from "./Dialog.js";
import type * as Messenger from "./Messenger.js";

// ---------- Public types ----------

export type WalletMode = "auto" | "iframe" | "popup";

export type WalletConfig = {
  /** URL of the wallet host (e.g. `https://wallet.abs.xyz`). */
  host: string;
  /** Default chain id. The wallet host may override based on its own chains. */
  chainId?: number | undefined;
  /** Dialog mode preference. Auth methods still use popup for OAuth support. */
  dialog?: WalletMode | undefined;
  /** Skip the HTTPS protocol gate. Only intended for local dev/testing. */
  skipProtocolCheck?: boolean | undefined;
  /** Theme hint forwarded to the wallet host on init. */
  theme?: "light" | "dark" | undefined;
};

export type Eip1193RequestArgs = {
  method: string;
  params?: readonly unknown[] | object | undefined;
};

export type Eip1193Provider = {
  request<T = unknown>(args: Eip1193RequestArgs): Promise<T>;
};

export type Wallet = {
  /** EIP-1193 provider compatible with viem / wagmi / ethers. */
  readonly provider: Eip1193Provider;
  /** Imperatively open the dialog (e.g. for "Connect Wallet"). */
  connect(): Promise<void>;
  /** Close + tear down everything. After this the wallet is unusable. */
  disconnect(): Promise<void>;
  /** Free underlying resources. */
  destroy(): void;
};

// ---------- Implementation ----------

export function createWallet(config: WalletConfig): Wallet {
  const {
    host,
    chainId,
    dialog: mode = "auto",
    skipProtocolCheck = false,
    theme,
  } = config;

  let active: Dialog.DialogHandle | null = null;
  let activeMode: Dialog.DialogMode | null = null;
  let destroyed = false;
  let latestReady: Messenger.ReadyOptions | null = null;

  const iframeFactory = Dialog.iframe({ skipProtocolCheck });
  const popupFactory = Dialog.popup();

  // Outstanding requests waiting for a response from the wallet. Keyed by the
  // JSON-RPC request id we generated. The messenger correlates by `_request`.
  type Pending = {
    request: Messenger.RpcRequest;
    resolve: (value: unknown) => void;
    reject: (reason: unknown) => void;
  };
  const pending = new Map<number | string, Pending>();
  let nextRequestId = 1;

  // Inbound callbacks the dialog factories wire into their messenger
  // internally. We rebuild this struct per-handle so the closures always
  // close over the correct `active` reference (after a mode swap, stale
  // events from the previous transport are ignored because that handle's
  // messenger is destroyed by `previous?.destroy()` in `switchMode`).
  const handlers: Dialog.DialogHandlers = {
    onResponse(response) {
      const p = pending.get(response.id);
      if (!p) return;
      pending.delete(response.id);
      if ("error" in response)
        p.reject(
          Object.assign(new Error(response.error.message), {
            code: response.error.code,
            data: response.error.data,
          }),
        );
      else p.resolve(response.result);
      if (pending.size === 0) active?.close();
    },
    onInternal(payload) {
      if (payload.type === "switch") void switchMode(payload.mode);
      if (payload.type === "authenticated") {
        latestReady = {
          ...(latestReady ?? { chainIds: [] }),
          authenticated: true,
        };
        if (activeMode === "popup") void switchMode("iframe");
      }
    },
    onClose() {
      active?.close();
      // Reject every outstanding request with a user-rejected style error.
      for (const [id, p] of pending) {
        pending.delete(id);
        p.reject(
          Object.assign(new Error("User closed the wallet"), {
            code: 4001,
          }),
        );
      }
    },
  };

  function ensureActive(targetMode: Dialog.DialogMode): Dialog.DialogHandle {
    if (active && activeMode === targetMode) return active;
    // Tear down previous mode (if any) before swapping.
    active?.destroy();
    const factory = targetMode === "iframe" ? iframeFactory : popupFactory;
    active = factory({ host, theme, handlers });
    activeMode = targetMode;
    void active.waitForReady().then(
      (ready) => {
        latestReady = ready;
      },
      () => {
        /* destroyed */
      },
    );
    return active;
  }

  async function switchMode(target: Dialog.DialogMode) {
    if (activeMode === target) return;
    const previous = active;
    const next = ensureActive(target);
    next.open();
    // Re-deliver pending requests against the new transport.
    for (const p of pending.values()) {
      next.syncRequest(p.request);
    }
    previous?.destroy();
  }

  function pickInitialMode(): Dialog.DialogMode {
    if (mode === "popup") return "popup";
    return "iframe";
  }

  function requiresConfirmation(
    request: Messenger.RpcRequest,
    options: {
      methodPolicies?: Messenger.ReadyOptions["methodPolicies"] | undefined;
      targetOrigin?: string | undefined;
    } = {},
  ) {
    const { methodPolicies, targetOrigin } = options;
    const policy = methodPolicies?.find((x) => x.method === request.method);
    if (!policy) return true;
    if (policy.modes?.headless) {
      if (
        typeof policy.modes.headless === "object" &&
        policy.modes.headless.sameOrigin &&
        targetOrigin !== window.location.origin
      ) {
        return true;
      }
      return false;
    }
    return true;
  }

  function isAlwaysHeadless(
    request: Messenger.RpcRequest,
    methodPolicies: Messenger.ReadyOptions["methodPolicies"],
  ) {
    return (
      methodPolicies?.find((policy) => policy.method === request.method)?.modes
        ?.headless === true
    );
  }

  async function dispatch(args: Eip1193RequestArgs): Promise<unknown> {
    if (destroyed) throw new Error("Wallet has been destroyed");

    const id = nextRequestId++;
    const params = Array.isArray(args.params)
      ? (args.params as readonly unknown[])
      : args.params == null
        ? undefined
        : ([args.params] as readonly unknown[]);
    const rpc: Messenger.RpcRequest = {
      id,
      jsonrpc: "2.0",
      method: args.method,
      params,
    };

    const initialMode = pickInitialMode();
    const handle = ensureActive(initialMode);

    // After the wallet announces ready, validate that iframe mode is actually
    // safe. If not, transparently downgrade to popup before sending.
    let targetHandle = handle;
    if (initialMode === "iframe") {
      const ready = await handle.waitForReady();
      const sec = await handle.secure();
      const alwaysHeadless = isAlwaysHeadless(rpc, ready.methodPolicies);
      if (!alwaysHeadless && (!sec.protocol || !sec.frame)) {
        await switchMode("popup");
        targetHandle = active ?? handle;
      } else if (
        requiresConfirmation(rpc, {
          methodPolicies: ready.methodPolicies,
          targetOrigin: new URL(host).origin,
        })
      ) {
        targetHandle.open();
      }
    } else {
      targetHandle.open();
    }

    return new Promise((resolve, reject) => {
      pending.set(id, { request: rpc, resolve, reject });
      targetHandle.syncRequest(rpc);
    });
  }

  const provider: Eip1193Provider = {
    request<T = unknown>(args: Eip1193RequestArgs): Promise<T> {
      return dispatch(args) as Promise<T>;
    },
  };

  // Set up a hidden iframe early so we can complete the `ready` handshake
  // before the user clicks anything. This makes `secure()` cheap on the first
  // RPC call. Skipped if mode is forced to popup.
  if (mode !== "popup" && typeof window !== "undefined") {
    const handle = ensureActive("iframe");
    void handle.secure().catch(() => {
      // ignored — surfaced again on first RPC call
    });
  }

  return {
    provider,
    async connect() {
      // wallet_connect is the canonical "open the wallet" RPC. The wallet
      // host responds with the user's address + capabilities.
      await provider.request({
        method: "wallet_connect",
        params: [{ chainId: chainId ?? 0 }],
      });
    },
    async disconnect() {
      try {
        await provider.request({ method: "wallet_disconnect" });
      } catch {
        /* ignore */
      }
      this.destroy();
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      for (const [id, p] of pending) {
        pending.delete(id);
        p.reject(new Error("Wallet destroyed"));
      }
      active?.destroy();
      active = null;
      activeMode = null;
    },
  };
}
