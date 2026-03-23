import { createHash } from 'node:crypto';

const PRIVY_API_BASE = 'https://api.privy.io';
const AGW_MCP_SIGNER_LABEL_PREFIX = 'AGW MCP';

export interface PrivyAdminConfig {
  appId: string;
  appSecret: string;
}

export interface PrivyAdditionalSigner {
  signerId: string;
  policyIds: string[];
}

export interface PrivyWalletRecord {
  id: string;
  address: string;
  chainType: string;
  additionalSigners: PrivyAdditionalSigner[];
}

export interface PrivyKeyQuorumRecord {
  id: string;
  displayName: string;
  createdAt: number;
  publicKeys: string[];
}

function resolvePrivyAdminConfig(): PrivyAdminConfig {
  const appId = process.env.PRIVY_APP_ID?.trim();
  const appSecret = process.env.PRIVY_APP_SECRET?.trim();

  if (!appId || !appSecret) {
    throw new Error('Missing Privy server credentials. Set PRIVY_APP_ID and PRIVY_APP_SECRET.');
  }

  return {
    appId,
    appSecret,
  };
}

function buildBasicAuth(config: PrivyAdminConfig): string {
  return Buffer.from(`${config.appId}:${config.appSecret}`).toString('base64');
}

function buildHeaders(config: PrivyAdminConfig, initHeaders?: HeadersInit): Record<string, string> {
  const normalizedInitHeaders: Record<string, string> = {};
  if (initHeaders instanceof Headers) {
    for (const [key, value] of initHeaders.entries()) {
      normalizedInitHeaders[key] = value;
    }
  } else if (Array.isArray(initHeaders)) {
    for (const [key, value] of initHeaders) {
      normalizedInitHeaders[key] = value;
    }
  } else if (initHeaders) {
    for (const [key, value] of Object.entries(initHeaders)) {
      if (value !== undefined) {
        normalizedInitHeaders[key] = value;
      }
    }
  }

  return {
    'Content-Type': 'application/json',
    Authorization: `Basic ${buildBasicAuth(config)}`,
    'privy-app-id': config.appId,
    ...normalizedInitHeaders,
  };
}

async function privyFetch<T>(path: string, init: RequestInit): Promise<T> {
  const config = resolvePrivyAdminConfig();
  const candidates = path.startsWith('/api/v1/')
    ? [path, path.replace('/api/v1/', '/v1/')]
    : path.startsWith('/v1/')
      ? [path, path.replace('/v1/', '/api/v1/')]
      : [path];

  let lastError: Error | null = null;

  for (const candidate of candidates) {
    const response = await fetch(`${PRIVY_API_BASE}${candidate}`, {
      ...init,
      headers: buildHeaders(config, init.headers),
    });

    if (response.ok) {
      if (response.status === 204) {
        return undefined as T;
      }

      return (await response.json()) as T;
    }

    let detail = response.statusText;
    try {
      const body = (await response.json()) as Record<string, unknown>;
      const errorBody = body.error as Record<string, unknown> | undefined;
      detail =
        (typeof errorBody?.message === 'string' && errorBody.message) ||
        (typeof body.message === 'string' && body.message) ||
        JSON.stringify(body);
    } catch {
      // Keep status text.
    }

    lastError = new Error(`Privy API error (${response.status}): ${detail}`);
    if (response.status !== 404) {
      throw lastError;
    }
  }

  throw lastError ?? new Error('Privy API request failed.');
}

function parsePositiveUnixSeconds(value: unknown): number {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) {
    return value;
  }
  if (typeof value === 'string' && /^\d+$/.test(value)) {
    return Number.parseInt(value, 10);
  }

  const timestamp = typeof value === 'string' ? Date.parse(value) : Number.NaN;
  if (!Number.isNaN(timestamp)) {
    return Math.floor(timestamp / 1000);
  }

  return Math.floor(Date.now() / 1000);
}

function normalizeWalletRecord(value: Record<string, unknown>): PrivyWalletRecord {
  const id = typeof value.id === 'string' ? value.id : '';
  const address = typeof value.address === 'string' ? value.address : '';
  const chainType = typeof value.chain_type === 'string' ? value.chain_type : '';
  const additionalSigners = Array.isArray(value.additional_signers)
    ? value.additional_signers.flatMap(entry => {
        if (!entry || typeof entry !== 'object') {
          return [];
        }

        const signerId = typeof (entry as { signer_id?: unknown }).signer_id === 'string'
          ? (entry as { signer_id: string }).signer_id
          : '';
        if (!signerId) {
          return [];
        }

        const overridePolicyIds = (entry as { override_policy_ids?: unknown }).override_policy_ids;
        const policyIds = Array.isArray(overridePolicyIds) && overridePolicyIds.every(item => typeof item === 'string')
          ? overridePolicyIds
          : [];
        return [{ signerId, policyIds }];
      })
    : [];

  if (!id || !address || !chainType) {
    throw new Error('Privy returned an invalid wallet record.');
  }

  return {
    id,
    address,
    chainType,
    additionalSigners,
  };
}

function normalizeKeyQuorumRecord(value: Record<string, unknown>): PrivyKeyQuorumRecord {
  const id = typeof value.id === 'string' ? value.id : '';
  const displayName = typeof value.display_name === 'string' && value.display_name.trim()
    ? value.display_name.trim()
    : `${AGW_MCP_SIGNER_LABEL_PREFIX} signer`;
  const publicKeys = Array.isArray(value.authorization_keys)
    ? value.authorization_keys.flatMap(entry => {
        if (!entry || typeof entry !== 'object') {
          return [];
        }
        const publicKey = (entry as { public_key?: unknown }).public_key;
        return typeof publicKey === 'string' && publicKey.trim() ? [publicKey.trim()] : [];
      })
    : [];

  if (!id || publicKeys.length === 0) {
    throw new Error('Privy returned an invalid signer record.');
  }

  return {
    id,
    displayName,
    createdAt: parsePositiveUnixSeconds(value.created_at),
    publicKeys,
  };
}

export function computeSignerFingerprint(publicKeyBase64: string): string {
  const digest = createHash('sha256').update(Buffer.from(publicKeyBase64, 'base64')).digest('hex');
  return `${digest.slice(0, 12)}:${digest.slice(-12)}`;
}

export function buildSignerLabel(fingerprint: string): string {
  return `${AGW_MCP_SIGNER_LABEL_PREFIX} ${fingerprint}`;
}

export async function findWalletByAddress(address: string): Promise<PrivyWalletRecord> {
  const userResult = await privyFetch<{ id: string }>('/v1/users/wallet/address', {
    method: 'POST',
    body: JSON.stringify({ address }),
  });

  const walletsResult = await privyFetch<{ data: Array<Record<string, unknown>> }>(
    `/v1/wallets?user_id=${encodeURIComponent(userResult.id)}&chain_type=ethereum`,
    {
      method: 'GET',
    },
  );

  const wallet = walletsResult.data
    .map(normalizeWalletRecord)
    .find(entry => entry.address.toLowerCase() === address.toLowerCase());

  if (!wallet) {
    throw new Error(`No Privy wallet found for address ${address}.`);
  }

  return wallet;
}

export async function getWalletById(walletId: string): Promise<PrivyWalletRecord> {
  const wallet = await privyFetch<Record<string, unknown>>(`/api/v1/wallets/${encodeURIComponent(walletId)}`, {
    method: 'GET',
  });

  return normalizeWalletRecord(wallet);
}

export async function getKeyQuorumById(signerId: string): Promise<PrivyKeyQuorumRecord> {
  const keyQuorum = await privyFetch<Record<string, unknown>>(
    `/api/v1/key_quorums/${encodeURIComponent(signerId)}`,
    {
      method: 'GET',
    },
  );

  return normalizeKeyQuorumRecord(keyQuorum);
}

export async function createKeyQuorum(params: {
  publicKey: string;
  displayName: string;
}): Promise<PrivyKeyQuorumRecord> {
  const keyQuorum = await privyFetch<Record<string, unknown>>('/api/v1/key_quorums', {
    method: 'POST',
    body: JSON.stringify({
      authorization_threshold: 1,
      display_name: params.displayName,
      public_keys: [params.publicKey],
    }),
  });

  return normalizeKeyQuorumRecord(keyQuorum);
}


export async function updateWalletWithSignature(params: {
  walletId: string;
  body: Record<string, unknown>;
  authorizationSignature: string;
  idempotencyKey?: string;
}): Promise<PrivyWalletRecord> {
  const wallet = await privyFetch<Record<string, unknown>>(`/api/v1/wallets/${encodeURIComponent(params.walletId)}`, {
    method: 'PATCH',
    headers: {
      'privy-authorization-signature': params.authorizationSignature,
      ...(params.idempotencyKey ? { 'privy-idempotency-key': params.idempotencyKey } : {}),
    },
    body: JSON.stringify(params.body),
  });

  return normalizeWalletRecord(wallet);
}

export async function listExistingAgwMcpSigners(wallet: PrivyWalletRecord) {
  const signers = await Promise.all(
    wallet.additionalSigners.map(async signer => {
      try {
        const keyQuorum = await getKeyQuorumById(signer.signerId);
        if (!keyQuorum.displayName.startsWith(AGW_MCP_SIGNER_LABEL_PREFIX)) {
          return null;
        }
        return {
          signerId: signer.signerId,
          signerLabel: keyQuorum.displayName,
          signerFingerprint: computeSignerFingerprint(keyQuorum.publicKeys[0]),
          signerCreatedAt: keyQuorum.createdAt,
        };
      } catch {
        return null;
      }
    }),
  );

  return signers.filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));
}
