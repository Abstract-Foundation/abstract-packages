import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { randomUUID } from "node:crypto";
import {
  buildCompanionAuthUrl,
  DEFAULT_AUTH_BASE_URL,
  DEFAULT_CALLBACK_URL,
  DEFAULT_CHAIN_ID,
} from "./auth-entrypoint.js";

export interface StartCompanionServerOptions {
  host?: string;
  port?: number;
  authBaseUrl?: string;
  defaultCallbackUrl?: string;
  defaultChainId?: number;
}

export interface StartedCompanionServer {
  host: string;
  port: number;
  url: string;
  close: () => Promise<void>;
}

const PUBLIC_DIR = path.resolve(process.cwd(), "companion/public");
const INDEX_HTML = fs.readFileSync(path.join(PUBLIC_DIR, "index.html"), "utf8");
const APP_JS = fs.readFileSync(path.join(PUBLIC_DIR, "app.js"), "utf8");
const STYLES_CSS = fs.readFileSync(path.join(PUBLIC_DIR, "styles.css"), "utf8");

function parsePositiveInteger(value: string | null, fallback: number): number {
  if (value === null || value.trim() === "") {
    return fallback;
  }

  if (!/^\d+$/.test(value.trim())) {
    throw new Error("Invalid chainId. Expected a positive integer.");
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error("Invalid chainId. Expected a positive integer.");
  }

  return parsed;
}

function writeTextResponse(res: http.ServerResponse, statusCode: number, body: string, contentType: string): void {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", `${contentType}; charset=utf-8`);
  res.end(body);
}

export async function startCompanionServer(options: StartCompanionServerOptions = {}): Promise<StartedCompanionServer> {
  const host = options.host ?? "127.0.0.1";
  const port = options.port ?? 4173;
  const authBaseUrl = options.authBaseUrl ?? process.env.AGW_COMPANION_AUTH_BASE_URL ?? DEFAULT_AUTH_BASE_URL;
  const defaultCallbackUrl = options.defaultCallbackUrl ?? DEFAULT_CALLBACK_URL;
  const defaultChainId = options.defaultChainId ?? DEFAULT_CHAIN_ID;

  const server = http.createServer((req, res) => {
    const url = new URL(req.url ?? "/", `http://${req.headers.host ?? `${host}:${port}`}`);

    if (url.pathname === "/healthz") {
      writeTextResponse(res, 200, JSON.stringify({ ok: true }), "application/json");
      return;
    }

    if (url.pathname === "/auth/start") {
      const callbackUrl = url.searchParams.get("callbackUrl") ?? defaultCallbackUrl;
      const state = url.searchParams.get("state") ?? randomUUID();

      let chainId: number;
      try {
        chainId = parsePositiveInteger(url.searchParams.get("chainId"), defaultChainId);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        writeTextResponse(res, 400, message, "text/plain");
        return;
      }

      let redirectUrl: string;
      try {
        redirectUrl = buildCompanionAuthUrl({
          authBaseUrl,
          callbackUrl,
          chainId,
          state,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        writeTextResponse(res, 400, message, "text/plain");
        return;
      }

      res.statusCode = 302;
      res.setHeader("Location", redirectUrl);
      res.end();
      return;
    }

    if (url.pathname === "/" || url.pathname === "/index.html") {
      writeTextResponse(res, 200, INDEX_HTML, "text/html");
      return;
    }

    if (url.pathname === "/app.js") {
      writeTextResponse(res, 200, APP_JS, "application/javascript");
      return;
    }

    if (url.pathname === "/styles.css") {
      writeTextResponse(res, 200, STYLES_CSS, "text/css");
      return;
    }

    writeTextResponse(res, 404, "Not found", "text/plain");
  });

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, host, () => resolve());
  });

  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Failed to resolve companion server address.");
  }

  return {
    host,
    port: address.port,
    url: `http://${host}:${address.port}`,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close(error => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      }),
  };
}
