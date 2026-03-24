import type { KeyObject } from "node:crypto";
import { AGW_HTTP_HEADERS } from "../config/runtime.js";
import { computeAuthorizationSignature, readAuthKeyfile } from "./auth.js";
import type {
  PrivySignerConfig,
  PrivyTransactionRequest,
  PrivyWalletRpcErrorResponse,
} from "./types.js";

const PRIVY_API_BASE = "https://api.privy.io";

export interface PrivyWalletClientConfig {
  signerConfig: PrivySignerConfig;
  appUrl: string;
  appId?: string;
  appSecret?: string;
}

export class PrivyWalletClient {
  private readonly appId?: string;
  private readonly appSecret?: string;
  private readonly walletId: string;
  private readonly appUrl: string;
  private authKey: KeyObject | null = null;
  private readonly authKeyRef: string;
  private runtimeConfigPromise: Promise<{ appId: string; mode: "proxy" | "direct" }> | null = null;

  constructor(config: PrivyWalletClientConfig) {
    this.appId = config.appId;
    this.appSecret = config.appSecret;
    this.walletId = config.signerConfig.walletId;
    this.authKeyRef = config.signerConfig.authKeyRef.value;
    this.appUrl = config.appUrl;
  }

  private getAuthKey(): KeyObject {
    if (!this.authKey) {
      this.authKey = readAuthKeyfile(this.authKeyRef);
    }
    return this.authKey;
  }

  private buildBasicAuth(appId: string, appSecret: string): string {
    return Buffer.from(`${appId}:${appSecret}`).toString("base64");
  }



  private async resolveRuntimeConfig(): Promise<{ appId: string; mode: "proxy" | "direct" }> {
    if (this.runtimeConfigPromise) {
      return this.runtimeConfigPromise;
    }

    this.runtimeConfigPromise = (async () => {
      if (this.appId && this.appSecret) {
        return {
          appId: this.appId,
          mode: "direct" as const,
        };
      }

      const explicitAppId = process.env.AGW_PRIVY_APP_ID?.trim();
      if (explicitAppId) {
        return {
          appId: explicitAppId,
          mode: "proxy" as const,
        };
      }

      const response = await fetch(new URL("/api/session/callback-key", this.appUrl), {
        method: "GET",
        headers: {
          Accept: "application/json",
          ...AGW_HTTP_HEADERS,
        },
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch hosted runtime config (${response.status} ${response.statusText}).`);
      }
      const body = (await response.json()) as { privyAppId?: unknown };
      if (typeof body.privyAppId !== "string" || !body.privyAppId.trim()) {
        throw new Error("Hosted runtime config is missing `privyAppId`.");
      }

      return {
        appId: body.privyAppId.trim(),
        mode: "proxy" as const,
      };
    })();

    return this.runtimeConfigPromise;
  }

  private async rpc(
    method: string,
    caip2: string,
    params: Record<string, unknown>,
  ): Promise<string> {
    const url = `${PRIVY_API_BASE}/v1/wallets/${this.walletId}/rpc`;
    const includeChainFields = method !== "eth_signTypedData_v4";
    const privyBody: Record<string, unknown> = { method, params };
    if (includeChainFields) {
      privyBody.caip2 = caip2;
      privyBody.chain_type = "ethereum";
    }
    const runtimeConfig = await this.resolveRuntimeConfig();

    const signature = computeAuthorizationSignature(this.getAuthKey(), {
      url,
      method: "POST",
      body: privyBody,
      appId: runtimeConfig.appId,
    });

    const response = runtimeConfig.mode === "direct"
      ? await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${this.buildBasicAuth(runtimeConfig.appId, this.appSecret!)}`,
            "privy-app-id": runtimeConfig.appId,
            "privy-authorization-signature": signature,
          },
          body: JSON.stringify(privyBody),
        })
      : await fetch(new URL("/api/session/rpc", this.appUrl), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...AGW_HTTP_HEADERS,
          },
          body: JSON.stringify({
            walletId: this.walletId,
            method,
            caip2,
            params,
            authorizationSignature: signature,
          }),
        });

    if (!response.ok) {
      let errorDetail: string;
      try {
        const errorBody = (await response.json()) as Record<string, unknown>;
        const nested = errorBody.error;
        if (typeof nested === "string") {
          errorDetail = nested;
        } else if (nested && typeof nested === "object" && "message" in nested) {
          errorDetail = (nested as PrivyWalletRpcErrorResponse["error"]).message;
        } else {
          errorDetail = JSON.stringify(errorBody);
        }
      } catch {
        errorDetail = response.statusText;
      }
      throw new Error(`Privy wallet RPC failed (${response.status}): ${errorDetail}`);
    }

    const result = (await response.json()) as Record<string, unknown>;
    const data = result.data as Record<string, unknown> | undefined;
    if (!data) {
      throw new Error(`Privy RPC ${method}: unexpected response shape: ${JSON.stringify(result)}`);
    }
    const value =
      (data.signature as string | undefined) ??
      (data.signed_transaction as string | undefined) ??
      (data.result as string | undefined);
    if (typeof value !== "string") {
      throw new Error(
        `Privy RPC ${method}: no signature/result in response: ${JSON.stringify(data)}`,
      );
    }
    return value;
  }

  async sendTransaction(chainId: number, transaction: PrivyTransactionRequest): Promise<string> {
    return this.rpc("eth_sendTransaction", `eip155:${chainId}`, { transaction });
  }

  async signMessage(chainId: number, message: string): Promise<string> {
    return this.rpc("personal_sign", `eip155:${chainId}`, {
      message,
      encoding: "utf-8",
    });
  }

  async signTypedData(chainId: number, typedData: string | Record<string, unknown>): Promise<string> {
    const parsed = typeof typedData === "string" ? JSON.parse(typedData) : typedData;
    if (parsed.primaryType && !parsed.primary_type) {
      parsed.primary_type = parsed.primaryType;
      delete parsed.primaryType;
    }
    return this.rpc("eth_signTypedData_v4", `eip155:${chainId}`, {
      typed_data: parsed,
    });
  }

  async signTransaction(chainId: number, transaction: PrivyTransactionRequest): Promise<string> {
    return this.rpc("eth_signTransaction", `eip155:${chainId}`, { transaction });
  }

  getWalletId(): string {
    return this.walletId;
  }
}

export function resolvePrivyAppCredentials(): { appId: string; appSecret: string } {
  const appId = process.env.PRIVY_APP_ID?.trim();
  const appSecret = process.env.PRIVY_APP_SECRET?.trim();

  if (!appId) {
    throw new Error("PRIVY_APP_ID environment variable is required.");
  }
  if (!appSecret) {
    throw new Error("PRIVY_APP_SECRET environment variable is required.");
  }

  return { appId, appSecret };
}
