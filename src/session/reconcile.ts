import type { Logger } from "../utils/logger.js";
import type { SessionManager } from "./manager.js";
import type { OnchainSessionStatusCode } from "./types.js";

export interface SessionReconcileResult {
  checkedAt: number;
  onchainStatus: "NotInitialized" | "Active" | "Closed" | "Expired";
  onchainStatusCode: OnchainSessionStatusCode;
  source: "onchain" | "local";
  reconciled: boolean;
}

export async function reconcileSessionLifecycle(
  sessionManager: SessionManager,
  logger: Logger,
): Promise<SessionReconcileResult | null> {
  const session = sessionManager.getSession();
  if (!session) {
    return null;
  }

  const status = await sessionManager.getOnchainSessionStatus();
  const shouldInvalidate = status.status === "Closed" || status.status === "Expired";
  if (shouldInvalidate) {
    logger.warn(`Session reconciliation invalidated local session due to on-chain status=${status.status}`);
    sessionManager.clearSession();
  }

  return {
    checkedAt: status.checkedAt,
    onchainStatus: status.status,
    onchainStatusCode: status.statusCode,
    source: status.source,
    reconciled: shouldInvalidate,
  };
}

export class SessionReconcileWorker {
  private readonly sessionManager: SessionManager;
  private readonly logger: Logger;
  private readonly intervalMs: number;
  private timer: NodeJS.Timeout | null = null;

  constructor(sessionManager: SessionManager, logger: Logger, intervalMs = 60_000) {
    this.sessionManager = sessionManager;
    this.logger = logger;
    this.intervalMs = intervalMs;
  }

  start(): void {
    if (this.timer) {
      return;
    }

    this.timer = setInterval(() => {
      void reconcileSessionLifecycle(this.sessionManager, this.logger).catch(error => {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.warn(`Session reconciliation failed: ${message}`);
      });
    }, this.intervalMs);
  }

  stop(): void {
    if (!this.timer) {
      return;
    }
    clearInterval(this.timer);
    this.timer = null;
  }
}
