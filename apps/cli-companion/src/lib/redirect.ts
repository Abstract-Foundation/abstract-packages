const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

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

export function buildRedirectUrl(callbackUrl: string, sessionToken: string): string {
  if (!isLoopbackCallbackUrl(callbackUrl)) {
    throw new Error('Invalid callback_url. Only loopback http URLs are allowed.');
  }
  if (!sessionToken.trim()) {
    throw new Error('Invalid session token. Expected a non-empty string.');
  }

  const url = new URL(callbackUrl);
  url.searchParams.set('session', sessionToken);
  return url.toString();
}
