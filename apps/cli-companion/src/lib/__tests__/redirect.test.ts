import { describe, expect, it } from 'vitest';
import { buildRedirectUrl, fromBase64Url, isLoopbackCallbackUrl } from '../redirect';

describe('redirect helpers', () => {
  it('builds loopback redirect with session payload', () => {
    const url = buildRedirectUrl('http://127.0.0.1:8787/cb/test', {
      accountAddress: '0x1111111111111111111111111111111111111111',
      chainId: 11124,
      expiresAt: 1_900_000_000,
      sessionConfig: { signer: '0x2222222222222222222222222222222222222222' },
    });

    const parsed = new URL(url);
    const session = parsed.searchParams.get('session');
    expect(session).toBeTruthy();
    expect(JSON.parse(fromBase64Url(session!))).toMatchObject({ chainId: 11124 });
  });

  it('rejects non-loopback callback urls', () => {
    expect(() =>
      buildRedirectUrl('https://evil.example/callback', {
        accountAddress: '0x1111111111111111111111111111111111111111',
        chainId: 11124,
        expiresAt: 1_900_000_000,
        sessionConfig: {},
      }),
    ).toThrow('Only loopback');

    expect(isLoopbackCallbackUrl('http://localhost:8787/cb')).toBe(true);
    expect(isLoopbackCallbackUrl('https://localhost:8787/cb')).toBe(false);
    expect(isLoopbackCallbackUrl('http://user:pass@127.0.0.1:8787/cb')).toBe(false);
  });
});
