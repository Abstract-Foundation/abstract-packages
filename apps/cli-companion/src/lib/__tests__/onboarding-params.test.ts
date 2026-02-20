import { describe, expect, it } from 'vitest';
import { parseOnboardingParams } from '../onboarding-params';

describe('onboarding params', () => {
  it('accepts valid loopback + supported chain params', () => {
    const result = parseOnboardingParams(
      new URLSearchParams({
        callback_url: 'http://127.0.0.1:8787/cb/abc',
        chain_id: '11124',
        signer: '0x1111111111111111111111111111111111111111',
      }),
    );

    expect(result.ok).toBe(true);
    expect(result.params?.chainId).toBe(11124);
  });

  it('rejects unsupported chain ids', () => {
    const result = parseOnboardingParams(
      new URLSearchParams({
        callback_url: 'http://127.0.0.1:8787/cb/abc',
        chain_id: '1',
        signer: '0x1111111111111111111111111111111111111111',
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
        signer: '0x1111111111111111111111111111111111111111',
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
        signer: '0x1111111111111111111111111111111111111111',
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
        signer: '0x1111111111111111111111111111111111111111',
      }),
    );

    expect(result.ok).toBe(false);
    expect(result.error).toContain('reserved');
  });
});
