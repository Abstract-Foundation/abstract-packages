import { createPrivateKey } from 'node:crypto';
import { afterEach, describe, expect, it } from 'vitest';
import {
  buildSignedCallbackPayload,
  getCallbackSigningPublicKey,
  signCallbackPayload,
  verifySignedServerPayload,
} from '../server/callback-attestation';

const originalPrivateKey = process.env.AGW_MCP_CALLBACK_SIGNING_PRIVATE_KEY;
const originalPublicKey = process.env.AGW_MCP_CALLBACK_SIGNING_PUBLIC_KEY;
const originalIssuer = process.env.AGW_MCP_CALLBACK_SIGNING_ISSUER;

declare global {
  // eslint-disable-next-line no-var
  var __agwMcpCallbackSigner:
    | {
        issuer: string;
        publicKeyBase64: string;
        privateKey: ReturnType<typeof createPrivateKey>;
      }
    | undefined;
}

function resetSignerCache() {
  delete globalThis.__agwMcpCallbackSigner;
  delete process.env.AGW_MCP_CALLBACK_SIGNING_PRIVATE_KEY;
  delete process.env.AGW_MCP_CALLBACK_SIGNING_PUBLIC_KEY;
  delete process.env.AGW_MCP_CALLBACK_SIGNING_ISSUER;
}

afterEach(() => {
  resetSignerCache();

  if (originalPrivateKey !== undefined) {
    process.env.AGW_MCP_CALLBACK_SIGNING_PRIVATE_KEY = originalPrivateKey;
  }
  if (originalPublicKey !== undefined) {
    process.env.AGW_MCP_CALLBACK_SIGNING_PUBLIC_KEY = originalPublicKey;
  }
  if (originalIssuer !== undefined) {
    process.env.AGW_MCP_CALLBACK_SIGNING_ISSUER = originalIssuer;
  }
});

describe('callback attestation', () => {
  it('signs and verifies init callback payloads with freshness metadata', () => {
    resetSignerCache();
    process.env.AGW_MCP_CALLBACK_SIGNING_ISSUER = 'agw-test';

    const payload = buildSignedCallbackPayload({
      version: 2 as const,
      action: 'init' as const,
      state: 'test-state',
      accountAddress: '0x1111111111111111111111111111111111111111',
      underlyingSignerAddress: '0x2222222222222222222222222222222222222222',
      chainId: 2741,
      walletId: 'wallet_123',
      signerType: 'device_authorization_key' as const,
      signerId: 'signer_123',
      policyIds: ['policy_123'],
      signerFingerprint: 'aa11bb22',
      signerLabel: 'Signer',
      signerCreatedAt: 1_800_000_000,
      policyMeta: {
        version: 1 as const,
        mode: 'guided' as const,
        presetId: 'payments' as const,
        presetLabel: 'Payments',
        enabledTools: ['get_session_status'],
        selectedAppIds: [],
        selectedContractAddresses: [],
        unverifiedAppIds: [],
        warnings: [],
        generatedAt: 1_800_000_000,
      },
      capabilitySummary: {
        chainId: 2741,
        expiresAt: 1_800_003_600,
        feeLimit: '1',
        maxValuePerUse: '1',
        enabledTools: ['get_session_status'],
        notes: [],
      },
    });

    expect(payload.iss).toBe('agw-test');
    expect(typeof payload.iat).toBe('number');
    expect(typeof payload.exp).toBe('number');

    const token = signCallbackPayload(payload);
    const verified = verifySignedServerPayload<typeof payload>(token);

    expect(verified).toEqual(payload);
    expect(getCallbackSigningPublicKey().issuer).toBe('agw-test');
  });

  it('rejects tampered signed payloads', () => {
    resetSignerCache();
    const payload = buildSignedCallbackPayload({
      version: 2 as const,
      action: 'revoke' as const,
      state: 'test-state',
      accountAddress: '0x1111111111111111111111111111111111111111',
      underlyingSignerAddress: '0x2222222222222222222222222222222222222222',
      chainId: 2741,
      walletId: 'wallet_123',
      signerType: 'device_authorization_key' as const,
      signerId: 'signer_123',
      revokedAt: 1_800_000_000,
    });

    const token = signCallbackPayload(payload);
    const [header, encodedPayload, signature] = token.split('.');
    const tamperedPayload = Buffer.from(
      JSON.stringify({
        ...JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8')),
        walletId: 'wallet_999',
      }),
      'utf8',
    ).toString('base64url');

    expect(() => verifySignedServerPayload(`${header}.${tamperedPayload}.${signature}`)).toThrow(
      'Invalid signed token signature.',
    );
  });
});
