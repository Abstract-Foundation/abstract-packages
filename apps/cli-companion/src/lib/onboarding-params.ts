import type { Address } from 'viem';
import { isAddress } from 'viem';
import { isSupportedChainId, resolveChain, type SupportedChainId } from './chains';
import { SUPPORTED_CHAIN_IDS } from './config';
import { isLoopbackCallbackUrl } from './redirect';

export interface OnboardingParams {
  callbackUrl: string;
  chainId: SupportedChainId;
  signerAddress: Address;
}

export interface OnboardingValidationResult {
  ok: boolean;
  error?: string;
  params?: OnboardingParams;
}

export function parseOnboardingParams(searchParams: URLSearchParams): OnboardingValidationResult {
  const callbackUrl = searchParams.get('callback_url');
  const chainIdRaw = searchParams.get('chain_id');
  const signerRaw = searchParams.get('signer');

  if (!callbackUrl || !chainIdRaw || !signerRaw) {
    return {
      ok: false,
      error: 'Missing required parameters: callback_url, chain_id, signer.',
    };
  }

  if (!isLoopbackCallbackUrl(callbackUrl)) {
    return {
      ok: false,
      error: 'Invalid callback_url. Use a loopback URL (localhost, 127.0.0.1, or [::1]).',
    };
  }
  try {
    const parsedCallbackUrl = new URL(callbackUrl);
    if (parsedCallbackUrl.searchParams.has('session')) {
      return {
        ok: false,
        error: 'Invalid callback_url. Query parameter `session` is reserved.',
      };
    }
  } catch {
    return {
      ok: false,
      error: 'Invalid callback_url. Use a loopback URL (localhost, 127.0.0.1, or [::1]).',
    };
  }

  if (!/^\d+$/.test(chainIdRaw)) {
    return {
      ok: false,
      error: 'Invalid chain_id. Expected an integer chain id.',
    };
  }

  const chainId = Number.parseInt(chainIdRaw, 10);
  if (!isSupportedChainId(chainId)) {
    return {
      ok: false,
      error: `Unsupported chain_id. Supported values are: ${SUPPORTED_CHAIN_IDS.join(', ')}.`,
    };
  }

  if (!isAddress(signerRaw)) {
    return {
      ok: false,
      error: 'Invalid signer address. Expected 0x-prefixed EVM address.',
    };
  }

  resolveChain(chainId);

  return {
    ok: true,
    params: {
      callbackUrl,
      chainId,
      signerAddress: signerRaw,
    },
  };
}
