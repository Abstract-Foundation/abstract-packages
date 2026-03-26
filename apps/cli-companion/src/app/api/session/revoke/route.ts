import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { buildRedirectUrl, isLoopbackCallbackUrl } from '@/lib/redirect';
import { buildSignedCallbackPayload, signCallbackPayload } from '@/lib/server/callback-attestation';
import { computeSignerFingerprint, getKeyQuorumById, getWalletById, updateWalletWithSignature } from '@/lib/server/privy-api';

interface RevokeRequestBody {
  accountAddress?: string;
  walletId?: string;
  signerId?: string;
  callbackUrl?: string;
  chainId?: number;
  authorizationSignature?: string;
}

async function buildRevokePatchBody(walletId: string, signerId: string) {
  const wallet = await getWalletById(walletId);
  const nextAdditionalSigners = wallet.additionalSigners
    .filter(entry => entry.signerId !== signerId)
    .map(entry => ({
      signer_id: entry.signerId,
      override_policy_ids: entry.policyIds,
    }));

  if (nextAdditionalSigners.length === wallet.additionalSigners.length) {
    throw new Error(`Signer ${signerId} is not attached to wallet ${walletId}.`);
  }

  return {
    wallet,
    patchBody: {
      additional_signers: nextAdditionalSigners,
    },
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const walletId = searchParams.get('wallet_id');
    const signerId = searchParams.get('signer_id');
    if (!walletId || !signerId) {
      return NextResponse.json({ error: 'Missing required query params: wallet_id, signer_id.' }, { status: 400 });
    }

    const { wallet, patchBody } = await buildRevokePatchBody(walletId, signerId);
    const signer = await getKeyQuorumById(signerId);
    return NextResponse.json({
      walletId: wallet.id,
      accountAddress: wallet.address,
      patchBody,
      signerLabel: signer.displayName,
      signerFingerprint: computeSignerFingerprint(signer.publicKeys[0]),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RevokeRequestBody;
    if (!body.accountAddress || !body.walletId || !body.signerId || !body.authorizationSignature || !body.callbackUrl || !body.chainId) {
      return NextResponse.json(
        { error: 'Missing required fields: accountAddress, walletId, signerId, callbackUrl, chainId, authorizationSignature.' },
        { status: 400 },
      );
    }
    if (!isLoopbackCallbackUrl(body.callbackUrl)) {
      return NextResponse.json({ error: 'Invalid callbackUrl.' }, { status: 400 });
    }

    const { patchBody } = await buildRevokePatchBody(body.walletId, body.signerId);

    const updatedWallet = await updateWalletWithSignature({
      walletId: body.walletId,
      authorizationSignature: body.authorizationSignature,
      idempotencyKey: randomUUID(),
      body: patchBody,
    });
    if (updatedWallet.additionalSigners.some(entry => entry.signerId === body.signerId)) {
      throw new Error(`Signer ${body.signerId} is still attached to wallet ${updatedWallet.id}.`);
    }

    const callbackState = new URL(body.callbackUrl).searchParams.get('state');
    if (!callbackState || !callbackState.trim()) {
      return NextResponse.json({ error: 'callbackUrl is missing required `state` parameter.' }, { status: 400 });
    }

    const token = signCallbackPayload(
      buildSignedCallbackPayload({
        version: 2 as const,
        action: 'revoke' as const,
        state: callbackState.trim(),
        accountAddress: body.accountAddress,
        underlyingSignerAddress: updatedWallet.address,
        chainId: body.chainId,
        walletId: updatedWallet.id,
        signerType: 'device_authorization_key' as const,
        signerId: body.signerId,
        revokedAt: Math.floor(Date.now() / 1000),
      }),
    );

    return NextResponse.json({
      redirectUrl: buildRedirectUrl(body.callbackUrl, token),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
