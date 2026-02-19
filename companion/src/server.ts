import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { createSignedHandoffToken, resolveCallbackPayload } from "./handoff.js";
import {
  buildCompanionAuthUrl,
  DEFAULT_AUTH_BASE_URL,
  DEFAULT_CALLBACK_URL,
  DEFAULT_CHAIN_ID,
} from "./auth-entrypoint.js";
import {
  buildPolicyPreview,
  getDefaultCustomPolicyTemplate,
  listPolicyPresets,
  parseCustomPolicyTemplate,
  type BuildPolicyPreviewOptions,
} from "./policies/index.js";
import { SecurityAuditLog, assessPolicyRisk } from "./security/index.js";

export interface StartCompanionServerOptions {
  host?: string;
  port?: number;
  authBaseUrl?: string;
  defaultCallbackUrl?: string;
  defaultChainId?: number;
  storageDir?: string;
}

export interface StartedCompanionServer {
  host: string;
  port: number;
  url: string;
  close: () => Promise<void>;
}

const HANDOFF_SESSION_TTL_MS = 10 * 60 * 1000;

function resolvePublicDir(): string {
  const argvDir = process.argv[1] ? path.dirname(path.resolve(process.argv[1])) : undefined;
  const candidates = [
    typeof __dirname === "string" ? path.resolve(__dirname, "../public") : undefined,
    argvDir ? path.resolve(argvDir, "public") : undefined,
    argvDir ? path.resolve(argvDir, "../companion/public") : undefined,
    path.resolve(process.cwd(), "companion/public"),
  ].filter((candidate): candidate is string => Boolean(candidate));

  for (const candidate of candidates) {
    if (fs.existsSync(path.join(candidate, "index.html"))) {
      return candidate;
    }
  }

  throw new Error("Unable to resolve companion public directory.");
}

const PUBLIC_DIR = resolvePublicDir();
const INDEX_HTML = fs.readFileSync(path.join(PUBLIC_DIR, "index.html"), "utf8");
const APP_JS = fs.readFileSync(path.join(PUBLIC_DIR, "app.js"), "utf8");
const STYLES_CSS = fs.readFileSync(path.join(PUBLIC_DIR, "styles.css"), "utf8");

interface HandoffSessionRecord {
  handoffUrl: string;
  handoffSecret: string;
  expiresAtMs: number;
}

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

function writeJsonResponse(res: http.ServerResponse, statusCode: number, payload: unknown): void {
  writeTextResponse(res, statusCode, JSON.stringify(payload), "application/json");
}

function readRequestBody(req: http.IncomingMessage, maxBytes = 64 * 1024): Promise<string> {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks: Buffer[] = [];

    req.on("data", chunk => {
      const asBuffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      size += asBuffer.length;
      if (size > maxBytes) {
        reject(new Error("Request body too large."));
        req.destroy();
        return;
      }
      chunks.push(asBuffer);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

async function parseJsonRequestBody(req: http.IncomingMessage): Promise<Record<string, unknown>> {
  const raw = await readRequestBody(req);
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Invalid JSON body.");
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Invalid JSON body.");
  }

  return parsed as Record<string, unknown>;
}

function resolveHandoffSession(
  sessions: Map<string, HandoffSessionRecord>,
  handoffSessionId: string,
): HandoffSessionRecord | null {
  const now = Date.now();
  for (const [id, session] of sessions.entries()) {
    if (session.expiresAtMs <= now) {
      sessions.delete(id);
    }
  }

  const session = sessions.get(handoffSessionId);
  if (!session) {
    return null;
  }

  if (session.expiresAtMs <= now) {
    sessions.delete(handoffSessionId);
    return null;
  }

  return session;
}

function parsePolicyPreviewOptions(url: URL): BuildPolicyPreviewOptions {
  const presetId = url.searchParams.get("preset") ?? "read_only";
  let customTemplate: BuildPolicyPreviewOptions["customTemplate"];
  if (presetId === "custom") {
    const customPolicyRaw = url.searchParams.get("customPolicy");
    customTemplate = customPolicyRaw ? parseCustomPolicyTemplate(customPolicyRaw) : undefined;
  }

  return {
    presetId,
    customTemplate,
  };
}

export async function startCompanionServer(options: StartCompanionServerOptions = {}): Promise<StartedCompanionServer> {
  const host = options.host ?? "127.0.0.1";
  const port = options.port ?? 4173;
  const authBaseUrl = options.authBaseUrl ?? process.env.AGW_COMPANION_AUTH_BASE_URL ?? DEFAULT_AUTH_BASE_URL;
  const defaultCallbackUrl = options.defaultCallbackUrl ?? DEFAULT_CALLBACK_URL;
  const defaultChainId = options.defaultChainId ?? DEFAULT_CHAIN_ID;
  const securityAuditLog = new SecurityAuditLog({
    storageDir: options.storageDir,
  });
  const handoffSessions = new Map<string, HandoffSessionRecord>();

  const server = http.createServer((req, res) => {
    const url = new URL(req.url ?? "/", `http://${req.headers.host ?? `${host}:${port}`}`);

    if (url.pathname === "/healthz") {
      writeJsonResponse(res, 200, { ok: true });
      return;
    }

    if (url.pathname === "/policy/presets") {
      writeJsonResponse(res, 200, {
        presets: listPolicyPresets(),
        defaultCustomTemplate: getDefaultCustomPolicyTemplate(),
      });
      return;
    }

    if (url.pathname === "/policy/preview") {
      try {
        const preview = buildPolicyPreview(parsePolicyPreviewOptions(url));
        const security = assessPolicyRisk(preview);
        writeJsonResponse(res, 200, {
          ...preview,
          security,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        writeTextResponse(res, 400, message, "text/plain");
      }
      return;
    }

    if (url.pathname === "/security/audit") {
      writeJsonResponse(res, 200, {
        entries: securityAuditLog.list(),
      });
      return;
    }

    if (url.pathname === "/handoff/session") {
      if (req.method !== "POST") {
        res.setHeader("Allow", "POST");
        writeTextResponse(res, 405, "Method not allowed.", "text/plain");
        return;
      }

      void (async () => {
        try {
          const body = await parseJsonRequestBody(req);
          const handoffUrlRaw = body.handoffUrl;
          const handoffSecretRaw = body.handoffSecret;

          if (typeof handoffUrlRaw !== "string" || !URL.canParse(handoffUrlRaw)) {
            writeTextResponse(res, 400, "Invalid handoffUrl.", "text/plain");
            return;
          }
          if (typeof handoffSecretRaw !== "string" || !handoffSecretRaw.trim()) {
            writeTextResponse(res, 400, "Missing handoffSecret.", "text/plain");
            return;
          }

          const handoffSessionId = randomUUID();
          handoffSessions.set(handoffSessionId, {
            handoffUrl: handoffUrlRaw,
            handoffSecret: handoffSecretRaw.trim(),
            expiresAtMs: Date.now() + HANDOFF_SESSION_TTL_MS,
          });
          writeJsonResponse(res, 201, {
            handoffSessionId,
            expiresInSeconds: Math.floor(HANDOFF_SESSION_TTL_MS / 1000),
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          writeTextResponse(res, 400, message, "text/plain");
        }
      })();
      return;
    }

    if (url.pathname === "/handoff/receive") {
      const handoffSessionId = url.searchParams.get("handoffSessionId");
      if (!handoffSessionId || !handoffSessionId.trim()) {
        writeTextResponse(res, 400, "Missing handoffSessionId.", "text/plain");
        return;
      }
      const handoffSession = resolveHandoffSession(handoffSessions, handoffSessionId);
      if (!handoffSession) {
        writeTextResponse(res, 400, "Invalid or expired handoffSessionId.", "text/plain");
        return;
      }

      let payload: string;
      try {
        payload = resolveCallbackPayload(url);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        writeTextResponse(res, 400, message, "text/plain");
        return;
      }

      const signedToken = createSignedHandoffToken(payload, handoffSession.handoffSecret);
      const redirect = new URL(handoffSession.handoffUrl);
      redirect.searchParams.set("handoff", signedToken);
      handoffSessions.delete(handoffSessionId);
      res.statusCode = 302;
      res.setHeader("Location", redirect.toString());
      res.end();
      return;
    }

    if (url.pathname === "/auth/start") {
      const callbackUrlInput = url.searchParams.get("callbackUrl") ?? defaultCallbackUrl;
      const state = url.searchParams.get("state") ?? randomUUID();
      const handoffSessionId = url.searchParams.get("handoffSessionId");

      let chainId: number;
      let policyPreview: ReturnType<typeof buildPolicyPreview>;
      let callbackUrl: string;
      try {
        chainId = parsePositiveInteger(url.searchParams.get("chainId"), defaultChainId);
        policyPreview = buildPolicyPreview(parsePolicyPreviewOptions(url));
        if (handoffSessionId) {
          if (!resolveHandoffSession(handoffSessions, handoffSessionId)) {
            throw new Error("Invalid or expired handoffSessionId.");
          }
          const handoffCallbackUrl = new URL("/handoff/receive", url);
          handoffCallbackUrl.searchParams.set("handoffSessionId", handoffSessionId);
          callbackUrl = handoffCallbackUrl.toString();
        } else {
          callbackUrl = callbackUrlInput;
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        writeTextResponse(res, 400, message, "text/plain");
        return;
      }

      const security = assessPolicyRisk(policyPreview);
      const confirmHighRisk = url.searchParams.get("confirmHighRisk") === "true";
      if (security.requiresConfirmation && !confirmHighRisk) {
        writeTextResponse(
          res,
          400,
          "High-risk policy detected. Pass confirmHighRisk=true to continue.",
          "text/plain",
        );
        return;
      }

      securityAuditLog.append({
        timestamp: new Date().toISOString(),
        presetId: policyPreview.presetId,
        chainId,
        riskLevel: security.level,
        reasons: security.reasons,
        confirmed: confirmHighRisk,
      });

      let redirectUrl: string;
      try {
        redirectUrl = buildCompanionAuthUrl({
          authBaseUrl,
          callbackUrl,
          chainId,
          state,
        });
        res.setHeader("X-AGW-Policy-Preset", policyPreview.presetId);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        writeTextResponse(res, 400, message, "text/plain");
        return;
      }

      res.statusCode = 302;
      res.setHeader("Location", redirectUrl);
      res.setHeader("X-AGW-Risk-Level", security.level);
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
