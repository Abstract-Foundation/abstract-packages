import { randomBytes } from "node:crypto";
import http from "node:http";

function textResponse(
  res: http.ServerResponse,
  statusCode: number,
  body: string,
): void {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.end(body);
}

export interface StartCallbackServerOptions {
  host?: string;
  port?: number;
  path?: string;
  expectedState?: string;
  timeoutMs?: number;
}

export interface CallbackServer {
  callbackUrl: string;
  waitForPayload: () => Promise<string>;
  close: () => Promise<void>;
}

const DEFAULT_CALLBACK_TIMEOUT_MS = 15 * 60 * 1000;

export async function startCallbackServer(
  options: StartCallbackServerOptions = {},
): Promise<CallbackServer> {
  const host = options.host ?? "127.0.0.1";
  const port = options.port ?? 0;
  const callbackPathRaw =
    options.path ?? `/callback/${randomBytes(8).toString("hex")}`;
  const callbackPath = callbackPathRaw.startsWith("/")
    ? callbackPathRaw
    : `/${callbackPathRaw}`;
  const expectedState = options.expectedState?.trim()
    ? options.expectedState.trim()
    : undefined;
  const timeoutMs = options.timeoutMs ?? DEFAULT_CALLBACK_TIMEOUT_MS;

  let resolvePayload: ((value: string) => void) | undefined;
  let rejectPayload: ((error: Error) => void) | undefined;
  let settled = false;

  const MAX_SESSION_QUERY_LENGTH = 128 * 1024;
  const payloadPromise = new Promise<string>((resolve, reject) => {
    resolvePayload = resolve;
    rejectPayload = reject;
  });

  const server = http.createServer((req, res) => {
    const url = new URL(
      req.url ?? "/",
      `http://${req.headers.host ?? `${host}:${port}`}`,
    );

    if (url.pathname !== callbackPath) {
      textResponse(res, 404, "Not found");
      return;
    }

    if (req.method !== "GET") {
      res.setHeader("Allow", "GET");
      textResponse(res, 405, "Method not allowed.");
      return;
    }
    if (settled) {
      textResponse(res, 409, "Callback already received.");
      return;
    }

    const payload = url.searchParams.get("session");
    if (!payload?.trim()) {
      textResponse(res, 400, "Missing `session` query parameter.");
      return;
    }
    if (payload.length > MAX_SESSION_QUERY_LENGTH) {
      textResponse(res, 413, "Session payload is too large.");
      return;
    }
    if (expectedState) {
      const state = url.searchParams.get("state");
      if (!state) {
        textResponse(res, 400, "Missing `state` query parameter.");
        return;
      }
      if (state !== expectedState) {
        textResponse(res, 400, "Invalid callback state.");
        return;
      }
    }

    textResponse(res, 200, "Session received. You can close this tab.");
    if (!settled) {
      settled = true;
      resolvePayload?.(payload);
    }
  });

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, host, () => resolve());
  });

  const timeout = setTimeout(() => {
    if (!settled) {
      settled = true;
      rejectPayload?.(
        new Error(
          `Session handoff timed out after ${Math.floor(timeoutMs / 1000)}s.`,
        ),
      );
    }
  }, timeoutMs);

  const callbackUrl = `http://${host}:${(server.address() as { port: number }).port}${callbackPath}`;

  return {
    callbackUrl,
    waitForPayload: () => payloadPromise,
    close: async () => {
      clearTimeout(timeout);
      await new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      });
    },
  };
}
