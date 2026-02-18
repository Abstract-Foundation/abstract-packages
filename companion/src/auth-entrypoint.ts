export interface BuildCompanionAuthUrlOptions {
  callbackUrl: string;
  chainId: number;
  authBaseUrl?: string;
  state?: string;
}

export const DEFAULT_AUTH_BASE_URL = "https://portal.abs.xyz/login";
export const DEFAULT_CALLBACK_URL = "http://127.0.0.1:8787/callback";
export const DEFAULT_CHAIN_ID = 11124;

function parsePositiveInteger(value: number, fieldName: string): number {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`Invalid ${fieldName}. Expected a positive integer.`);
  }

  return value;
}

export function buildCompanionAuthUrl(options: BuildCompanionAuthUrlOptions): string {
  const authBaseUrl = options.authBaseUrl?.trim() || DEFAULT_AUTH_BASE_URL;
  const callbackUrl = options.callbackUrl?.trim();

  if (!callbackUrl || !URL.canParse(callbackUrl)) {
    throw new Error("Invalid callbackUrl. Expected an absolute URL.");
  }

  parsePositiveInteger(options.chainId, "chainId");

  const url = new URL(authBaseUrl);
  url.searchParams.set("redirect_uri", callbackUrl);
  url.searchParams.set("chain_id", String(options.chainId));

  if (options.state?.trim()) {
    url.searchParams.set("state", options.state.trim());
  }

  url.searchParams.set("source", "agw-mcp-companion");
  return url.toString();
}
