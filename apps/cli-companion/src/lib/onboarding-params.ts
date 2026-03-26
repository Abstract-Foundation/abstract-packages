import { isSupportedChainId, resolveChain, type SupportedChainId } from './chains';
import { SUPPORTED_CHAIN_IDS } from './config';
import { isLoopbackCallbackUrl } from './redirect';

export interface OnboardingParams {
  action: 'init';
  callbackUrl: string;
  chainId: SupportedChainId;
  authPublicKey: string;
}

export interface RevokeParams {
  action: 'revoke';
  callbackUrl: string;
  chainId: SupportedChainId;
  accountAddress: string;
  walletId: string;
  signerId: string;
  signerLabel?: string;
  signerFingerprint?: string;
}

export interface OnboardingValidationResult {
  ok: boolean;
  error?: string;
  params?: OnboardingParams;
}

export interface RevokeValidationResult {
  ok: boolean;
  error?: string;
  params?: RevokeParams;
}

const BASE64_PATTERN = /^[A-Za-z0-9+/=]+$/;

function parseSharedParams(searchParams: URLSearchParams): {
  callbackUrl: string;
  chainId: SupportedChainId;
} | { error: string } {
  const callbackUrl = searchParams.get('callback_url');
  const chainIdRaw = searchParams.get('chain_id');

  if (!callbackUrl || !chainIdRaw) {
    return {
      error: 'Missing required parameters: callback_url, chain_id.',
    };
  }

  if (!isLoopbackCallbackUrl(callbackUrl)) {
    return {
      error: 'Invalid callback_url. Use a loopback URL (localhost, 127.0.0.1, or [::1]).',
    };
  }
  try {
    const parsedCallbackUrl = new URL(callbackUrl);
    if (parsedCallbackUrl.searchParams.has('session')) {
      return {
        error: 'Invalid callback_url. Query parameter `session` is reserved.',
      };
    }
  } catch {
    return {
      error: 'Invalid callback_url. Use a loopback URL (localhost, 127.0.0.1, or [::1]).',
    };
  }

  if (!/^\d+$/.test(chainIdRaw)) {
    return {
      error: 'Invalid chain_id. Expected an integer chain id.',
    };
  }

  const chainId = Number.parseInt(chainIdRaw, 10);
  if (!isSupportedChainId(chainId)) {
    return {
      error: `Unsupported chain_id. Supported values are: ${SUPPORTED_CHAIN_IDS.join(', ')}.`,
    };
  }

  resolveChain(chainId);

  return {
    callbackUrl,
    chainId,
  };
}

export function parseOnboardingParams(searchParams: URLSearchParams): OnboardingValidationResult {
  const shared = parseSharedParams(searchParams);
  if ('error' in shared) {
    return {
      ok: false,
      error: shared.error,
    };
  }

  const authPublicKey = searchParams.get('auth_pubkey');
  if (!authPublicKey) {
    return {
      ok: false,
      error: 'Missing required parameter: auth_pubkey.',
    };
  }
  if (!BASE64_PATTERN.test(authPublicKey)) {
    return {
      ok: false,
      error: 'Invalid auth_pubkey. Expected base64-encoded DER public key.',
    };
  }

  return {
    ok: true,
    params: {
      action: 'init',
      callbackUrl: shared.callbackUrl,
      chainId: shared.chainId,
      authPublicKey,
    },
  };
}

export function parseRevokeParams(searchParams: URLSearchParams): RevokeValidationResult {
  const shared = parseSharedParams(searchParams);
  if ('error' in shared) {
    return {
      ok: false,
      error: shared.error,
    };
  }

  const walletId = searchParams.get('wallet_id');
  const signerId = searchParams.get('signer_id');
  const accountAddress = searchParams.get('account_address');
  if (!walletId || !signerId || !accountAddress) {
    return {
      ok: false,
      error: 'Missing required parameters: account_address, wallet_id, signer_id.',
    };
  }

  const signerLabel = searchParams.get('signer_label') ?? undefined;
  const signerFingerprint = searchParams.get('signer_fingerprint') ?? undefined;

  return {
    ok: true,
    params: {
      action: 'revoke',
      callbackUrl: shared.callbackUrl,
      chainId: shared.chainId,
      accountAddress,
      walletId,
      signerId,
      signerLabel,
      signerFingerprint,
    },
  };
}
