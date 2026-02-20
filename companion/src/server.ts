import http from "node:http";
import { randomUUID } from "node:crypto";
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
  storageDir?: string;
}

export interface StartedCompanionServer {
  host: string;
  port: number;
  url: string;
  close: () => Promise<void>;
}

const HANDOFF_SESSION_TTL_MS = 10 * 60 * 1000;

interface HandoffSessionRecord {
  handoffUrl: string;
  handoffSecret: string;
  expiresAtMs: number;
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


function parsePolicyPreviewOptions(url: URL): BuildPolicyPreviewOptions {
  const presetId = url.searchParams.get("preset") ?? "transfer";
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
  const port = options.port ?? 4174;
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
