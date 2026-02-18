import type { SessionClient } from "@abstract-foundation/agw-client/sessions";
import type { AgwChainConfig } from "../agw/client.js";
import type { Logger } from "../utils/logger.js";
import { createSessionClientFromSessionData } from "./client.js";
import { SessionStorage } from "./storage.js";
import type { AgwSessionData, SessionStatus } from "./types.js";

export interface SessionManagerOptions {
  storageDir?: string;
  chainId?: number;
}

export class SessionManager {
  private readonly storage: SessionStorage;
  private readonly logger: Logger;
  private readonly chainId: number;
  private session: AgwSessionData | null = null;

  constructor(logger: Logger, options: SessionManagerOptions = {}) {
    this.logger = logger.child("session");
    this.storage = new SessionStorage(options.storageDir);
    this.chainId = options.chainId ?? 11124;
  }

  initialize(): void {
    const session = this.storage.load();
    if (!session) {
      this.logger.warn("No AGW session found. Run the bootstrap flow before write operations.");
      this.session = null;
      return;
    }

    this.session = session;
    this.logger.info(`Loaded session for ${session.accountAddress}`);
  }

  getSession(): AgwSessionData | null {
    return this.session;
  }

  getSessionStatus(): SessionStatus {
    if (!this.session) {
      return "missing";
    }
    if (this.session.status === "revoked") {
      return "revoked";
    }
    if (Date.now() / 1000 >= this.session.expiresAt) {
      return "expired";
    }
    return this.session.status;
  }

  setSession(session: AgwSessionData): void {
    this.session = session;
    this.storage.save(session);
  }

  clearSession(): void {
    this.session = null;
    this.storage.delete();
  }

  getChainId(): number {
    return this.chainId;
  }

  createSessionClient(chainConfig: AgwChainConfig): SessionClient {
    if (!this.session) {
      throw new Error("session is missing");
    }

    return createSessionClientFromSessionData({
      session: this.session,
      chainConfig,
    });
  }
}
