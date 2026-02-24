import { DEFAULT_CHAIN_ID, resolveNetworkConfig, type ResolvedNetworkConfig } from "../config/network.js";
import type { Logger } from "../utils/logger.js";
import { SessionStorage } from "./storage.js";
import type { AgwSessionData, SessionStatus } from "./types.js";

export interface SessionManagerOptions {
  storageDir?: string;
  chainId?: number;
  rpcUrl?: string;
}

export class SessionManager {
  private readonly storage: SessionStorage;
  private readonly logger: Logger;
  private readonly chainId: number;
  private readonly rpcUrl?: string;
  private session: AgwSessionData | null = null;

  constructor(logger: Logger, options: SessionManagerOptions = {}) {
    this.logger = logger.child("session");
    this.storage = new SessionStorage(options.storageDir);
    this.chainId = options.chainId ?? DEFAULT_CHAIN_ID;
    this.rpcUrl = options.rpcUrl;
  }

  initialize(): void {
    const session = this.storage.load();
    if (!session) {
      this.logger.warn("No linked wallet session found. Run `agw-mcp init` to link a wallet.");
      this.session = null;
      return;
    }

    this.session = session;
    this.logger.info(`Loaded linked wallet session for ${session.accountAddress}`);
  }

  getSession(): AgwSessionData | null {
    return this.session;
  }

  getSessionStatus(): SessionStatus {
    if (!this.session) {
      return "missing";
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

  getNetworkConfig(chainId?: number): ResolvedNetworkConfig {
    return resolveNetworkConfig({
      chainId: chainId ?? this.chainId,
      rpcUrl: this.rpcUrl,
    });
  }

  getStorageDir(): string {
    return this.storage.storageDir;
  }
}
