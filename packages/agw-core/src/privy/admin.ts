const PRIVY_API_BASE = "https://api.privy.io";

export interface PrivyAdminConfig {
  appId: string;
  appSecret: string;
}

function buildBasicAuth(appId: string, appSecret: string): string {
  return Buffer.from(`${appId}:${appSecret}`).toString("base64");
}

function buildHeaders(config: PrivyAdminConfig): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Authorization: `Basic ${buildBasicAuth(config.appId, config.appSecret)}`,
    "privy-app-id": config.appId,
  };
}

function buildPathCandidates(path: string): string[] {
  if (path.startsWith("/api/v1/")) {
    return [path, path.replace("/api/v1/", "/v1/")];
  }
  if (path.startsWith("/v1/")) {
    return [path, path.replace("/v1/", "/api/v1/")];
  }
  return [path];
}

async function privyFetch<T>(config: PrivyAdminConfig, path: string, init: RequestInit): Promise<T> {
  let lastError: Error | null = null;

  for (const candidate of buildPathCandidates(path)) {
    const response = await fetch(`${PRIVY_API_BASE}${candidate}`, {
      ...init,
      headers: { ...buildHeaders(config), ...init.headers },
    });

    if (response.ok) {
      return response.json() as Promise<T>;
    }

    let detail: string;
    try {
      const body = await response.json();
      detail = body.error?.message ?? body.message ?? body.error ?? JSON.stringify(body);
    } catch {
      detail = response.statusText;
    }

    lastError = new Error(`Privy API error (${response.status}): ${detail}`);
    if (response.status !== 404) {
      throw lastError;
    }
  }

  throw lastError ?? new Error("Privy API request failed.");
}

export interface PrivyWalletAdditionalSigner {
  signerId: string;
  policyIds: string[];
}

export interface PrivyWalletRecord {
  id: string;
  address: string;
  chainType: string;
  additionalSigners: PrivyWalletAdditionalSigner[];
}

export interface PrivyKeyQuorumRecord {
  id: string;
  displayName: string;
  createdAt: number;
  publicKeys: string[];
}

function parsePositiveUnixSeconds(value: unknown): number {
  if (typeof value === "number" && Number.isInteger(value) && value > 0) {
    return value;
  }
  if (typeof value === "string" && /^\d+$/.test(value)) {
    return Number.parseInt(value, 10);
  }
  const timestamp = typeof value === "string" ? Date.parse(value) : Number.NaN;
  if (!Number.isNaN(timestamp)) {
    return Math.floor(timestamp / 1000);
  }
  return Math.floor(Date.now() / 1000);
}

function normalizeWalletRecord(value: Record<string, unknown>): PrivyWalletRecord {
  const address = typeof value.address === "string" ? value.address : "";
  const id = typeof value.id === "string" ? value.id : "";
  const chainType = typeof value.chain_type === "string" ? value.chain_type : "";
  const additionalSigners = Array.isArray(value.additional_signers)
    ? value.additional_signers.flatMap(entry => {
        if (!entry || typeof entry !== "object") {
          return [];
        }
        const signerId = typeof (entry as { signer_id?: unknown }).signer_id === "string"
          ? (entry as { signer_id: string }).signer_id
          : "";
        if (!signerId) {
          return [];
        }
        const overridePolicyIds = (entry as { override_policy_ids?: unknown }).override_policy_ids;
        const policyIds = Array.isArray(overridePolicyIds) && overridePolicyIds.every(item => typeof item === "string")
          ? overridePolicyIds
          : [];
        return [{ signerId, policyIds }];
      })
    : [];

  if (!id || !address || !chainType) {
    throw new Error("Privy API returned an invalid wallet record.");
  }

  return {
    id,
    address,
    chainType,
    additionalSigners,
  };
}

function normalizeKeyQuorumRecord(value: Record<string, unknown>): PrivyKeyQuorumRecord {
  const id = typeof value.id === "string" ? value.id : "";
  const displayName = typeof value.display_name === "string" && value.display_name.trim()
    ? value.display_name.trim()
    : "AGW MCP signer";
  const publicKeys = Array.isArray(value.authorization_keys)
    ? value.authorization_keys.flatMap(entry => {
        if (!entry || typeof entry !== "object") {
          return [];
        }
        const publicKey = (entry as { public_key?: unknown }).public_key;
        return typeof publicKey === "string" && publicKey.trim() ? [publicKey.trim()] : [];
      })
    : [];

  if (!id || publicKeys.length === 0) {
    throw new Error("Privy API returned an invalid signer record.");
  }

  return {
    id,
    displayName,
    createdAt: parsePositiveUnixSeconds(value.created_at),
    publicKeys,
  };
}

export async function findWalletByAddress(
  config: PrivyAdminConfig,
  address: string,
): Promise<string> {
  const userResult = await privyFetch<{ id: string }>(config, "/v1/users/wallet/address", {
    method: "POST",
    body: JSON.stringify({ address }),
  });

  const walletsResult = await privyFetch<{
    data: Array<{ id: string; address: string; chain_type: string }>;
  }>(config, `/v1/wallets?user_id=${encodeURIComponent(userResult.id)}&chain_type=ethereum`, {
    method: "GET",
  });

  const wallet = walletsResult.data?.find(
    entry => entry.address.toLowerCase() === address.toLowerCase(),
  );
  if (!wallet?.id) {
    throw new Error(`No Privy wallet found for address ${address}.`);
  }

  return wallet.id;
}

export async function getWalletById(
  config: PrivyAdminConfig,
  walletId: string,
): Promise<PrivyWalletRecord> {
  const walletResult = await privyFetch<Record<string, unknown>>(config, `/api/v1/wallets/${encodeURIComponent(walletId)}`, {
    method: "GET",
  });

  return normalizeWalletRecord(walletResult);
}

export async function getKeyQuorumById(
  config: PrivyAdminConfig,
  signerId: string,
): Promise<PrivyKeyQuorumRecord> {
  const keyQuorumResult = await privyFetch<Record<string, unknown>>(
    config,
    `/api/v1/key_quorums/${encodeURIComponent(signerId)}`,
    {
      method: "GET",
    },
  );

  return normalizeKeyQuorumRecord(keyQuorumResult);
}
