/**
 * `createWallet` — the dApp's entry point. Returns an EIP-1193 provider that
 * routes every JSON-RPC request to the wallet host via the messenger, opening
 * the appropriate dialog when the request requires user confirmation.
 *
 * Mode selection (mirrors Porto):
 *   1. Start with `iframe` unless the caller forced popup mode.
 *   2. After the iframe's `ready` arrives, run `secure()`. If protocol/frame
 *      checks fail, switch to popup before sending pending requests.
 *   3. Method-policy aware — read-only methods marked `headless` skip the
 *      dialog UI entirely.
 *   4. WebAuthn-required methods on Safari are forced to popup mode (Safari
 *      blocks WebAuthn credential creation in iframes).
 */

import * as Dialog from "./Dialog.js";
import type * as Messenger from "./Messenger.js";
import * as UserAgent from "./UserAgent.js";

// ---------- Public types ----------

export type WalletMode = "auto" | "iframe" | "popup";

export type WalletConfig = {
  /** URL of the wallet host (e.g. `https://wallet.abs.xyz`). */
  host: string;
  /** Default chain id. The wallet host may override based on its own chains. */
  chainId?: number | undefined;
  /** Dialog mode preference. `auto` picks iframe with popup fallback. */
  dialog?: WalletMode | undefined;
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

// Methods that always require WebAuthn credential creation when run for the
// first time on Safari. We force-popup these because Safari blocks
// `navigator.credentials.create` in iframes.
const SAFARI_WEBAUTHN_METHODS = new Set([
  "wallet_connect",
  "eth_requestAccounts",
]);

// ---------- Implementation ----------

export function createWallet(config: WalletConfig): Wallet {
  const { host, chainId, dialog: mode = "auto", theme } = config;

  let active: Dialog.DialogHandle | null = null;
  let activeMode: Dialog.DialogMode | null = null;
  let destroyed = false;

  const iframeFactory = Dialog.iframe();
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

  function ensureActive(targetMode: Dialog.DialogMode): Dialog.DialogHandle {
    if (active && activeMode === targetMode) return active;
    // Tear down previous mode (if any) before swapping.
    active?.destroy();
    const factory = targetMode === "iframe" ? iframeFactory : popupFactory;
    active = factory({ host, theme });
    activeMode = targetMode;
    bindMessengerListeners(active);
    return active;
  }

  function bindMessengerListeners(handle: Dialog.DialogHandle) {
    handle.messenger.on("rpc-response", (response) => {
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
    });
    handle.messenger.on("__internal", (payload) => {
      if (payload.type === "switch") void switchMode(payload.mode);
    });
    handle.messenger.on("close", () => {
      // Reject every outstanding request with a user-rejected style error.
      for (const [id, p] of pending) {
        pending.delete(id);
        p.reject(
          Object.assign(new Error("User closed the wallet"), {
            code: 4001,
          }),
        );
      }
    });
  }

  async function switchMode(target: Dialog.DialogMode) {
    if (activeMode === target) return;
    const previous = active;
    const next = ensureActive(target);
    next.open();
    // Re-deliver pending requests against the new transport.
    for (const p of pending.values()) {
      next.messenger.send("rpc-request", p.request);
    }
    previous?.destroy();
  }

  async function pickInitialMode(
    requestMethod: string,
  ): Promise<Dialog.DialogMode> {
    if (mode === "iframe") return "iframe";
    if (mode === "popup") return "popup";
    // auto: prefer iframe, but force popup for Safari + WebAuthn methods.
    if (UserAgent.isSafari() && SAFARI_WEBAUTHN_METHODS.has(requestMethod))
      return "popup";
    return "iframe";
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

    const initialMode = await pickInitialMode(args.method);
    const handle = ensureActive(initialMode);
    handle.open();

    // After the wallet announces ready, validate that iframe mode is actually
    // safe. If not, transparently downgrade to popup before sending.
    if (initialMode === "iframe") {
      const sec = await handle.secure();
      if (!sec.protocol || !sec.frame) {
        await switchMode("popup");
      }
    }

    return new Promise((resolve, reject) => {
      pending.set(id, { request: rpc, resolve, reject });
      (active ?? handle).messenger.send("rpc-request", rpc);
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
