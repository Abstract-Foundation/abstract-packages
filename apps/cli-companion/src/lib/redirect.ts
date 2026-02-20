import type { SessionBundle } from './session-config';

const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

function toBase64Url(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export function fromBase64Url(input: string): string {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
  const pad = '='.repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(base64 + pad);
  const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function isLoopbackCallbackUrl(callbackUrl: string): boolean {
  try {
    const parsed = new URL(callbackUrl);
    if (parsed.protocol !== 'http:') {
      return false;
    }
    if (!LOOPBACK_HOSTS.has(parsed.hostname)) {
      return false;
    }
    if (parsed.username || parsed.password) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function buildRedirectUrl(callbackUrl: string, bundle: SessionBundle): string {
  if (!isLoopbackCallbackUrl(callbackUrl)) {
    throw new Error('Invalid callback_url. Only loopback http URLs are allowed.');
  }

  const json = JSON.stringify(bundle);
  const encoded = toBase64Url(json);
  const url = new URL(callbackUrl);
  url.searchParams.set('session', encoded);
  return url.toString();
}
