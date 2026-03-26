import type { Address } from "viem";
import { type AbstractClient, createAgwAbstractClient } from "../agw/client.js";
import { resolveAppUrl } from "../auth/bootstrap-internals.js";
import {
  DEFAULT_CHAIN_ID,
  type ResolvedNetworkConfig,
  resolveNetworkConfig,
} from "../config/network.js";
import { PrivyWalletClient } from "../privy/client.js";
import type { Logger } from "../utils/logger.js";
import { SessionStorage } from "./storage.js";
import {
  type AgwSessionData,
  isWriteReadySession,
  resolveSessionReadiness,
  type SessionReadiness,
  type SessionStatus,
} from "./types.js";

export type SessionManagerReadiness = SessionReadiness | "missing" | "revoked";

export interface SessionManagerOptions {
  homeDir?: string;
  chainId?: number;
  rpcUrl?: string;
  appUrl?: string;
}

export class SessionManager {
  private readonly storage: SessionStorage;
  private readonly logger: Logger;
  private readonly chainId: number;
  private readonly rpcUrl?: string;
  private readonly appUrl: string;
  private session: AgwSessionData | null = null;
  private privyClient: PrivyWalletClient | null = null;
  private abstractClient: AbstractClient | null = null;

  constructor(logger: Logger, options: SessionManagerOptions = {}) {
    this.logger = logger.child("session");
    this.storage = new SessionStorage(options.homeDir);
    this.chainId = options.chainId ?? DEFAULT_CHAIN_ID;
    this.rpcUrl = options.rpcUrl;
    this.appUrl = resolveAppUrl({ appUrl: options.appUrl });
  }

  initialize(): void {
    const session = this.storage.load();
    if (!session) {
      this.logger.warn(
        "No AGW session found. Run the bootstrap flow before write operations.",
      );
      this.session = null;
      return;
    }

    this.session = session;
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

  getSessionReadiness(): SessionManagerReadiness {
    if (!this.session) {
      return "missing";
    }
    if (this.session.status === "revoked") {
      return "revoked";
    }
    return resolveSessionReadiness(this.session) ?? "missing";
  }

  setSession(session: AgwSessionData): void {
    this.session = session;
    this.storage.save(session);
    this.privyClient = null;
    this.abstractClient = null;
  }

  clearSession(): void {
    this.session = null;
    this.privyClient = null;
    this.abstractClient = null;
    this.storage.delete();
  }

  markSessionRevoked(
    updatedAtUnixSeconds = Math.floor(Date.now() / 1000),
  ): void {
    if (!this.session) {
      throw new Error("session is missing");
    }

    this.session = {
      ...this.session,
      status: "revoked",
      updatedAt: updatedAtUnixSeconds,
    };
    this.storage.save(this.session);
    this.storage.deleteAuthKeyfile();
    this.privyClient = null;
    this.abstractClient = null;
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

  getPrivyWalletClient(): PrivyWalletClient {
    const session = this.session;
    if (!session) {
      throw new Error("session is missing");
    }
    if (!isWriteReadySession(session)) {
      throw new Error(
        "write signer is not configured for this session. Re-run `agw auth init` and complete delegated access approval.",
      );
    }

    if (!this.privyClient) {
      this.privyClient = new PrivyWalletClient({
        appUrl: this.appUrl,
        signerConfig: {
          walletId: session.privyWalletId!,
          authKeyRef: session.privyAuthKeyRef!,
        },
      });
    }

    return this.privyClient;
  }

  async getAbstractClient(): Promise<AbstractClient> {
    if (this.abstractClient) return this.abstractClient;

    const session = this.session;
    if (!session) {
      throw new Error("session is missing");
    }
    if (!isWriteReadySession(session)) {
      throw new Error(
        "write signer is not configured for this session. Re-run `agw auth init` and complete delegated access approval.",
      );
    }
    if (!session.underlyingSignerAddress) {
      throw new Error(
        "session is missing underlyingSignerAddress. Re-run `agw auth init` to create a session with signer binding.",
      );
    }

    const privyClient = this.getPrivyWalletClient();
    const networkConfig = resolveNetworkConfig({
      chainId: session.chainId,
      rpcUrl: this.rpcUrl,
    });

    this.abstractClient = await createAgwAbstractClient({
      privyClient,
      signerAddress: session.underlyingSignerAddress as Address,
      accountAddress: session.accountAddress as Address,
      chain: networkConfig.chain,
      chainId: session.chainId,
      rpcUrl: networkConfig.rpcUrl!,
    });

    return this.abstractClient;
  }

  getStorageDir(): string {
    return this.storage.storageDir;
  }
}
