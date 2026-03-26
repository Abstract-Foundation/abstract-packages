/**
 * Creates the default Privy wallet policy for AGW.
 *
 * Usage:
 *   npx tsx scripts/create-default-policy.ts [chainId]
 *
 * Reads PRIVY_APP_ID and PRIVY_APP_SECRET from .env.local (root).
 * Chain ID defaults to 2741 (Abstract mainnet). Pass 11124 for testnet.
 *
 * Outputs the policy ID to set as PRIVY_DEFAULT_POLICY_ID.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const PRIVY_API_BASE = 'https://api.privy.io';
const DEFAULT_MAX_VALUE_PER_USE = '10000000000000000'; // 0.01 ETH
const DEFAULT_EXPIRY_SECONDS = 30 * 24 * 60 * 60; // 30 days

function loadEnv(): { appId: string; appSecret: string } {
  const root = resolve(import.meta.dirname, '..');
  const candidates = [resolve(root, 'app', '.env.local'), resolve(root, '.env.local')];
  let content = '';
  for (const path of candidates) {
    try {
      content += '\n' + readFileSync(path, 'utf-8');
    } catch {
      // skip missing files
    }
  }
  if (!content.trim()) {
    throw new Error(`No .env.local found in ${candidates.join(' or ')}`);
  }

  const vars: Record<string, string> = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    vars[trimmed.slice(0, eqIdx).trim()] = trimmed.slice(eqIdx + 1).trim();
  }

  const appId = vars.PRIVY_APP_ID;
  const appSecret = vars.PRIVY_APP_SECRET;
  if (!appId || !appSecret) {
    throw new Error('Missing PRIVY_APP_ID or PRIVY_APP_SECRET in .env.local');
  }
  return { appId, appSecret };
}

function buildPolicyRules(chainId: number) {
  const expiresAt = Math.floor(Date.now() / 1000) + DEFAULT_EXPIRY_SECONDS;

  return [
    {
      name: 'deny-export-private-key',
      action: 'DENY',
      method: 'exportPrivateKey',
      conditions: [],
    },
    {
      name: 'allow-send-transaction',
      action: 'ALLOW',
      method: 'eth_sendTransaction',
      conditions: [
        { field_source: 'ethereum_transaction', field: 'chain_id', operator: 'eq', value: String(chainId) },
        { field_source: 'ethereum_transaction', field: 'value', operator: 'lte', value: DEFAULT_MAX_VALUE_PER_USE },
        { field_source: 'system', field: 'current_unix_timestamp', operator: 'lt', value: String(expiresAt) },
      ],
    },
    {
      name: 'allow-sign-transaction',
      action: 'ALLOW',
      method: 'eth_signTransaction',
      conditions: [
        { field_source: 'ethereum_transaction', field: 'chain_id', operator: 'eq', value: String(chainId) },
        { field_source: 'ethereum_transaction', field: 'value', operator: 'lte', value: DEFAULT_MAX_VALUE_PER_USE },
        { field_source: 'system', field: 'current_unix_timestamp', operator: 'lt', value: String(expiresAt) },
      ],
    },
    {
      name: 'allow-sign-typed-data',
      action: 'ALLOW',
      method: 'eth_signTypedData_v4',
      conditions: [
        { field_source: 'ethereum_typed_data_domain', field: 'chainId', operator: 'eq', value: String(chainId) },
        { field_source: 'system', field: 'current_unix_timestamp', operator: 'lt', value: String(expiresAt) },
      ],
    },
  ];
}

async function main() {
  const chainId = Number(process.argv[2]) || 2741;
  const { appId, appSecret } = loadEnv();
  const auth = Buffer.from(`${appId}:${appSecret}`).toString('base64');

  const body = {
    version: '1.0',
    name: `AGW Default (${chainId})`,
    chain_type: 'ethereum',
    rules: buildPolicyRules(chainId),
  };

  console.log(`Creating policy for chain ${chainId}...`);

  const res = await fetch(`${PRIVY_API_BASE}/v1/policies`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${auth}`,
      'privy-app-id': appId,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Privy API error (${res.status}): ${detail}`);
  }

  const policy = (await res.json()) as { id: string };

  console.log(`\nPolicy created successfully.`);
  console.log(`\n  PRIVY_DEFAULT_POLICY_ID=${policy.id}\n`);
  console.log(`Add this to your .env.local and Vercel env vars.`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
