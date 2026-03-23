import { describe, expect, it } from 'vitest';
import { parseOnboardingParams, parseRevokeParams } from '../onboarding-params';

describe('onboarding params', () => {
  it('accepts valid loopback + supported chain params', () => {
    const result = parseOnboardingParams(
      new URLSearchParams({
        callback_url: 'http://127.0.0.1:8787/cb/abc',
        chain_id: '11124',
        auth_pubkey: 'dGVzdA==',
      }),
    );

    expect(result.ok).toBe(true);
    expect(result.params?.chainId).toBe(11124);
    expect(result.params?.authPublicKey).toBe('dGVzdA==');
  });

  it('rejects unsupported chain ids', () => {
    const result = parseOnboardingParams(
      new URLSearchParams({
        callback_url: 'http://127.0.0.1:8787/cb/abc',
        chain_id: '1',
        auth_pubkey: 'dGVzdA==',
      }),
    );

    expect(result.ok).toBe(false);
    expect(result.error).toContain('Unsupported chain_id');
  });

  it('rejects non-loopback callback urls', () => {
    const result = parseOnboardingParams(
      new URLSearchParams({
        callback_url: 'http://example.com/cb',
        chain_id: '11124',
        auth_pubkey: 'dGVzdA==',
      }),
    );

    expect(result.ok).toBe(false);
    expect(result.error).toContain('Invalid callback_url');
  });

  it('accepts ipv6 loopback callback urls', () => {
    const result = parseOnboardingParams(
      new URLSearchParams({
        callback_url: 'http://[::1]:8787/cb/abc',
        chain_id: '2741',
        auth_pubkey: 'dGVzdA==',
      }),
    );

    expect(result.ok).toBe(true);
    expect(result.params?.chainId).toBe(2741);
  });

  it('rejects callback urls that pre-set the session query parameter', () => {
    const result = parseOnboardingParams(
      new URLSearchParams({
        callback_url: 'http://127.0.0.1:8787/cb/abc?session=malicious',
        chain_id: '11124',
        auth_pubkey: 'dGVzdA==',
      }),
    );

    expect(result.ok).toBe(false);
    expect(result.error).toContain('reserved');
  });

  it('rejects onboarding params without auth_pubkey', () => {
    const result = parseOnboardingParams(
      new URLSearchParams({
        callback_url: 'http://127.0.0.1:8787/cb/abc',
        chain_id: '11124',
      }),
    );

    expect(result.ok).toBe(false);
    expect(result.error).toContain('auth_pubkey');
  });

  it('accepts valid revoke params', () => {
    const result = parseRevokeParams(
      new URLSearchParams({
        callback_url: 'http://127.0.0.1:8787/cb/abc',
        chain_id: '11124',
        account_address: '0x6Ce3942732c17CB3E8c7bd49169DEe48c520212C',
        wallet_id: 'wallet_123',
        signer_id: 'quorum_456',
      }),
    );

    expect(result.ok).toBe(true);
    expect(result.params?.accountAddress).toBe('0x6Ce3942732c17CB3E8c7bd49169DEe48c520212C');
    expect(result.params?.walletId).toBe('wallet_123');
    expect(result.params?.signerId).toBe('quorum_456');
  });
});
