import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import http from "node:http";

interface SignedHandoffEnvelope {
  payload: string;
  signature: string;
}

export interface StartCompanionHandoffServerOptions {
  host?: string;
  port?: number;
  path?: string;
  secret: string;
  timeoutMs?: number;
}

export interface CompanionHandoffServer {
  callbackUrl: string;
  waitForPayload: () => Promise<string>;
  close: () => Promise<void>;
}

function signatureForPayload(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

function decodeEnvelope(token: string): SignedHandoffEnvelope {
  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(token, "base64url").toString("utf8")) as unknown;
  } catch {
    throw new Error("Invalid handoff token encoding.");
  }

  if (!parsed || typeof parsed !== "object") {
    throw new Error("Invalid handoff token payload.");
  }

  const envelope = parsed as Record<string, unknown>;
  if (typeof envelope.payload !== "string" || typeof envelope.signature !== "string") {
    throw new Error("Invalid handoff token shape.");
  }

  return {
    payload: envelope.payload,
    signature: envelope.signature,
  };
}

export function verifySignedHandoffToken(token: string, secret: string): string {
  const envelope = decodeEnvelope(token);
  const expected = Buffer.from(signatureForPayload(envelope.payload, secret), "utf8");
  const actual = Buffer.from(envelope.signature, "utf8");
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    throw new Error("Invalid handoff token signature.");
  }
  return envelope.payload;
}

export function createCompanionHandoffSecret(): string {
  return randomBytes(24).toString("base64url");
}

function textResponse(res: http.ServerResponse, statusCode: number, body: string): void {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.end(body);
}

export async function startCompanionHandoffServer(
  options: StartCompanionHandoffServerOptions,
): Promise<CompanionHandoffServer> {
  const host = options.host ?? "127.0.0.1";
  const port = options.port ?? 0;
  const callbackPathRaw = options.path ?? `/callback/${randomBytes(8).toString("hex")}`;
  const callbackPath = callbackPathRaw.startsWith("/") ? callbackPathRaw : `/${callbackPathRaw}`;
  const timeoutMs = options.timeoutMs ?? 5 * 60 * 1000;
  let resolvePayload: ((value: string) => void) | undefined;
  let rejectPayload: ((error: Error) => void) | undefined;
  let settled = false;

  const payloadPromise = new Promise<string>((resolve, reject) => {
    resolvePayload = resolve;
    rejectPayload = reject;
  });

  const server = http.createServer((req, res) => {
    const url = new URL(req.url ?? "/", `http://${req.headers.host ?? `${host}:${port}`}`);
    if (url.pathname !== callbackPath) {
      textResponse(res, 404, "Not found");
      return;
    }

    if (req.method === "OPTIONS") {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type");
      res.statusCode = 204;
      res.end();
      return;
    }

    if (req.method === "POST") {
      void handlePostCallback(req, res);
      return;
    }

    const token = url.searchParams.get("handoff");
    if (!token) {
      textResponse(res, 400, "Missing `handoff` query parameter.");
      return;
    }

    try {
      const payload = verifySignedHandoffToken(token, options.secret);
      textResponse(res, 200, "Companion handoff received. You can return to the CLI.");
      if (!settled) {
        settled = true;
        resolvePayload?.(payload);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      textResponse(res, 400, message);
      if (!settled) {
        settled = true;
        rejectPayload?.(new Error(message));
      }
    }
  });

  async function handlePostCallback(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    const MAX_BODY_BYTES = 64 * 1024;
    try {
      const body = await new Promise<string>((resolve, reject) => {
        let size = 0;
        const chunks: Buffer[] = [];
        req.on("data", (chunk: Buffer) => {
          size += chunk.length;
          if (size > MAX_BODY_BYTES) {
            reject(new Error("Request body too large."));
            req.destroy();
            return;
          }
          chunks.push(chunk);
        });
        req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
        req.on("error", reject);
      });

      if (!body.trim()) {
        textResponse(res, 400, "Empty request body.");
        return;
      }

      res.setHeader("Access-Control-Allow-Origin", "*");
      textResponse(res, 200, "Session bundle received. You can return to the CLI.");
      if (!settled) {
        settled = true;
        resolvePayload?.(body);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      textResponse(res, 400, message);
    }
  }

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, host, () => resolve());
  });

  const timeout = setTimeout(() => {
    if (!settled) {
      settled = true;
      rejectPayload?.(new Error(`Companion handoff timed out after ${Math.floor(timeoutMs / 1000)}s.`));
    }
  }, timeoutMs);

  const callbackUrl = `http://${host}:${(server.address() as { port: number }).port}${callbackPath}`;

  return {
    callbackUrl,
    waitForPayload: () => payloadPromise,
    close: async () => {
      clearTimeout(timeout);
      await new Promise<void>((resolve, reject) => {
        server.close(error => {
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
