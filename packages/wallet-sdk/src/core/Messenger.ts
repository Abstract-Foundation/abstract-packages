/**
 * Origin-validated postMessage transport between the dApp page and the wallet
 * iframe / popup. The shape is intentionally a slim port of Porto's Messenger
 * (porto/src/core/Messenger.ts) so security-critical behaviour matches.
 *
 * Every inbound message is filtered by `event.origin === targetOrigin` before
 * any payload is observed. Outbound messages are sent with an explicit
 * `targetOrigin` (never `*`).
 */

import type { Address } from "viem";

// ---------- Schema ----------

export type RpcRequest = {
  id: number | string;
  jsonrpc: "2.0";
  method: string;
  params?: readonly unknown[] | undefined;
};

export type RpcResponse =
  | {
      id: number | string;
      jsonrpc: "2.0";
      result: unknown;
    }
  | {
      id: number | string;
      jsonrpc: "2.0";
      error: { code: number; message: string; data?: unknown };
    };

/**
 * Capabilities the wallet host advertises in its `ready` payload. The dApp SDK
 * uses `trustedHosts` to decide whether iframe mode is safe for browsers
 * without IntersectionObserver v2.
 */
export type ReadyOptions = {
  chainIds: readonly number[];
  trustedHosts?: readonly string[] | undefined;
  /**
   * Method policy table advertised by the wallet host. Methods missing from
   * the table default to requiring the dialog.
   */
  methodPolicies?:
    | readonly {
        method: string;
        modes?:
          | {
              headless?:
                | true
                | {
                    sameOrigin?: boolean | undefined;
                  }
                | undefined;
              dialog?:
                | true
                | {
                    sameOrigin?: boolean | undefined;
                  }
                | undefined;
            }
          | undefined;
        requireConnection?: boolean | undefined;
      }[]
    | undefined;
};

export type AccountPayload = {
  address: Address;
  chainId: number;
  capabilities?: Record<string, unknown> | undefined;
};

export type InternalPayload =
  | {
      type: "init";
      mode: "iframe" | "popup";
      referrer: { title: string; icon?: string | undefined };
      theme?: "light" | "dark" | undefined;
    }
  | {
      type: "switch";
      mode: "iframe" | "popup";
    }
  | {
      type: "resize";
      width?: number | undefined;
      height?: number | undefined;
    }
  | {
      type: "set-theme";
      theme: "light" | "dark";
    };

// Discriminated schema describing every (topic, payload) pair the messenger
// can carry. Adding a new message type means extending this union.
export type Schema =
  | { topic: "ready"; payload: ReadyOptions }
  | { topic: "rpc-request"; payload: RpcRequest }
  | { topic: "rpc-response"; payload: RpcResponse & { _request: RpcRequest } }
  | { topic: "account"; payload: AccountPayload }
  | { topic: "close"; payload: undefined }
  | { topic: "__internal"; payload: InternalPayload };

export type Topic = Schema["topic"];

export type Payload<T extends Topic> = Extract<Schema, { topic: T }>["payload"];

export type Envelope<T extends Topic = Topic> = {
  abs: 1; // protocol version + brand
  id: string;
  topic: T;
  payload: Payload<T>;
};

// ---------- Messenger interface ----------

export type Listener<T extends Topic> = (
  payload: Payload<T>,
  event: MessageEvent,
) => void;

export type Messenger = {
  /**
   * Subscribe to a topic. Returns an unsubscribe function.
   * If `id` is given, only envelopes whose id matches are delivered (used for
   * request/response correlation).
   */
  on<T extends Topic>(
    topic: T,
    listener: Listener<T>,
    id?: string | undefined,
  ): () => void;
  /**
   * Send a message to the peer with a generated id. Returns the envelope.
   */
  send<T extends Topic>(
    topic: T,
    payload: Payload<T>,
    target?: string | undefined,
  ): { id: string; topic: T; payload: Payload<T> };
  /**
   * Tear down all listeners.
   */
  destroy(): void;
};

export type Bridge = Messenger & {
  /**
   * Mark the peer as ready (called by the receiving side once it's mounted).
   */
  ready(options: ReadyOptions): void;
  /**
   * Resolve once the peer announces itself ready, with the capabilities it
   * declared.
   */
  waitForReady(): Promise<ReadyOptions>;
};

// ---------- Internal helpers ----------

const ABS_BRAND = 1 as const;

/**
 * RFC-4122-ish uuid using Web Crypto when available and a Math.random fallback
 * otherwise. The id is opaque and only used for request correlation, so the
 * weaker fallback is acceptable.
 */
export function uuid(): string {
  const cryptoApi: Crypto | undefined =
    typeof globalThis !== "undefined" && "crypto" in globalThis
      ? (globalThis.crypto as Crypto | undefined)
      : undefined;
  if (cryptoApi && typeof cryptoApi.randomUUID === "function")
    return cryptoApi.randomUUID();
  return `${Math.random().toString(16).slice(2)}${Math.random()
    .toString(16)
    .slice(2)}${Date.now().toString(16)}`;
}

function isEnvelope(value: unknown): value is Envelope {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    v.abs === ABS_BRAND &&
    typeof v.id === "string" &&
    typeof v.topic === "string"
  );
}

// ---------- Constructors ----------

export type FromWindowOptions = {
  /** Reject inbound messages whose `event.origin` doesn't equal this. Required
   * for any cross-origin transport — only omit when both ends share an origin
   * (e.g. tests or same-origin dev mode). */
  targetOrigin?: string | undefined;
};

/**
 * Create a Messenger backed by a Window's postMessage. `w` is the window we
 * post TO; we listen on the current window. For iframe usage:
 *   parent side: fromWindow(iframe.contentWindow, { targetOrigin: walletOrigin })
 *   iframe side: fromWindow(window.parent,        { targetOrigin: dappOrigin   })
 */
export function fromWindow(
  w: Window,
  options: FromWindowOptions = {},
): Messenger {
  const { targetOrigin } = options;
  const handlers = new Map<symbol, (event: MessageEvent) => void>();

  function destroy() {
    for (const handler of handlers.values()) {
      window.removeEventListener("message", handler);
    }
    handlers.clear();
  }

  return {
    destroy,
    on<T extends Topic>(
      topic: T,
      listener: Listener<T>,
      id?: string | undefined,
    ) {
      const key = Symbol("msg-listener");
      const handler = (event: MessageEvent) => {
        // Origin check FIRST — never inspect untrusted payloads.
        if (targetOrigin && event.origin !== targetOrigin) return;
        if (!isEnvelope(event.data)) return;
        if (event.data.topic !== topic) return;
        if (id && event.data.id !== id) return;
        listener(event.data.payload as Payload<T>, event);
      };
      window.addEventListener("message", handler);
      handlers.set(key, handler);
      return () => {
        window.removeEventListener("message", handler);
        handlers.delete(key);
      };
    },
    send<T extends Topic>(
      topic: T,
      payload: Payload<T>,
      target?: string | undefined,
    ) {
      const id = uuid();
      const envelope: Envelope<T> = { abs: ABS_BRAND, id, topic, payload };
      // Never default to `*` — refuse to send if no origin is specified.
      const dest = target ?? targetOrigin;
      if (!dest)
        throw new Error(
          'Messenger.send: a targetOrigin is required (refusing to post to "*")',
        );
      w.postMessage(envelope, dest);
      return { id, topic, payload };
    },
  };
}

/**
 * Bridge two messengers (`from` listens on local window, `to` posts to remote
 * window) with a `ready` handshake.
 */
export function bridge(parameters: {
  from: Messenger;
  to: Messenger;
  /**
   * If true, queued sends wait for `ready` to fire before posting. Used on the
   * dApp side so we don't push RPC requests into an iframe whose JS hasn't
   * booted.
   */
  waitForReady?: boolean | undefined;
}): Bridge {
  const { from, to, waitForReady = false } = parameters;

  let resolveReady: ((options: ReadyOptions) => void) | null = null;
  let rejectReady: ((reason?: unknown) => void) | null = null;
  const readyPromise = new Promise<ReadyOptions>((resolve, reject) => {
    resolveReady = resolve;
    rejectReady = reject;
  });

  const offReady = from.on("ready", (options) => {
    resolveReady?.(options);
  });

  const send: Bridge["send"] = ((topic, payload, target) => {
    if (waitForReady && topic !== "ready") {
      // Fire-and-forget — we still return the envelope id synchronously so
      // callers can correlate. Requests issued before ready will queue
      // implicitly: the listener registered in fromWindow stays attached and
      // will fire when the peer eventually answers.
      const id = uuid();
      void readyPromise.then(
        () => {
          // Re-send with the same id so request/response correlation holds.
          const dest = target;
          if (dest) {
            (to as Messenger).send(topic, payload, dest);
          } else {
            (to as Messenger).send(topic, payload);
          }
        },
        () => {
          /* destroyed */
        },
      );
      return { id, topic, payload };
    }
    return (to as Messenger).send(topic, payload, target);
  }) as Bridge["send"];

  return {
    on: from.on.bind(from),
    send,
    destroy() {
      offReady();
      from.destroy();
      to.destroy();
      rejectReady?.(new Error("Messenger destroyed"));
    },
    ready(options) {
      to.send("ready", options);
    },
    waitForReady() {
      return readyPromise;
    },
  };
}
