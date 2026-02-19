import type { SessionClient } from "@abstract-foundation/agw-client/sessions";
import type { AgwChainConfig } from "../agw/client.js";
import { resolveNetworkConfig } from "../config/network.js";
import { assertSafeSessionPolicy } from "../policy/lint.js";
import type { Logger } from "../utils/logger.js";
import { createSessionClientFromSessionData } from "./client.js";
import { SessionStorage } from "./storage.js";
import type { AgwSessionData, OnchainSessionStatus, OnchainSessionStatusCode, OnchainSessionStatusMetadata, SessionStatus } from "./types.js";

export interface SessionManagerOptions {
  storageDir?: string;
  chainId?: number;
}

const ONCHAIN_STATUS_CODE_TO_STATUS: Record<OnchainSessionStatusCode, OnchainSessionStatus> = {
  0: "NotInitialized",
  1: "Active",
  2: "Closed",
  3: "Expired",
};

export function mapOnchainSessionStatus(statusCode: number): OnchainSessionStatus {
  const mapped = ONCHAIN_STATUS_CODE_TO_STATUS[statusCode as OnchainSessionStatusCode];
  if (!mapped) {
    throw new Error(`Unsupported on-chain session status code: ${statusCode}`);
  }
  return mapped;
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

    assertSafeSessionPolicy({
      expiresAt: session.expiresAt,
      sessionConfig: session.sessionConfig,
    });

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

  async getOnchainSessionStatus(): Promise<OnchainSessionStatusMetadata> {
    const checkedAt = Math.floor(Date.now() / 1000);

    if (!this.session) {
      return {
        status: "NotInitialized",
        statusCode: 0,
        source: "local",
        checkedAt,
      };
    }

    const networkConfig = resolveNetworkConfig({ chainId: this.session.chainId });
    const sessionClient = createSessionClientFromSessionData({
      session: this.session,
      chainConfig: {
        chain: networkConfig.chain,
        rpcUrl: networkConfig.rpcUrl,
      },
    });
    const statusCode = Number(await sessionClient.getSessionStatus());

    return {
      status: mapOnchainSessionStatus(statusCode),
      statusCode: statusCode as OnchainSessionStatusCode,
      source: "onchain",
      checkedAt,
    };
  }

  setSession(session: AgwSessionData): void {
    assertSafeSessionPolicy({
      expiresAt: session.expiresAt,
      sessionConfig: session.sessionConfig,
    });

    this.session = session;
    this.storage.save(session);
  }

  clearSession(): void {
    this.session = null;
    this.storage.delete();
  }

  markSessionRevoked(updatedAtUnixSeconds = Math.floor(Date.now() / 1000)): void {
    if (!this.session) {
      throw new Error("session is missing");
    }

    this.session = {
      ...this.session,
      status: "revoked",
      updatedAt: updatedAtUnixSeconds,
    };
    this.storage.save(this.session);
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
