import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { getDefaultPolicyId } from '@/lib/config';
import { buildDefaultPolicyMeta, buildDefaultCapabilitySummary } from '@/lib/server/default-policy';
import {
  buildSignerLabel,
  computeSignerFingerprint,
  createKeyQuorum,
  findWalletByAddress,
  listExistingAgwMcpSigners,
} from '@/lib/server/privy-api';
import { buildSignedCallbackPayload, signCallbackPayload } from '@/lib/server/callback-attestation';
import type { ProvisionedSignerResult } from '@/lib/session-config';

interface ProvisionRequestBody {
  agwAccountAddress?: string;
  signerAddress?: string;
  chainId?: number;
  authPublicKey?: string;
}

const ADDRESS_PATTERN = /^0x[a-fA-F0-9]{40}$/;
const BASE64_PATTERN = /^[A-Za-z0-9+/=]+$/;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ProvisionRequestBody;

    if (!body.agwAccountAddress || !ADDRESS_PATTERN.test(body.agwAccountAddress)) {
      return NextResponse.json({ error: 'Invalid agwAccountAddress.' }, { status: 400 });
    }
    if (!body.signerAddress || !ADDRESS_PATTERN.test(body.signerAddress)) {
      return NextResponse.json({ error: 'Invalid signerAddress.' }, { status: 400 });
    }
    if (!Number.isInteger(body.chainId) || body.chainId! <= 0) {
      return NextResponse.json({ error: 'Invalid chainId.' }, { status: 400 });
    }
    if (!body.authPublicKey || !BASE64_PATTERN.test(body.authPublicKey)) {
      return NextResponse.json({ error: 'Invalid authPublicKey.' }, { status: 400 });
    }

    const chainId = body.chainId as number;
    const wallet = await findWalletByAddress(body.signerAddress);
    const existingSigners = await listExistingAgwMcpSigners(wallet);
    const signerFingerprint = computeSignerFingerprint(body.authPublicKey);
    const signerLabel = buildSignerLabel(signerFingerprint);
    const signer = await createKeyQuorum({
      publicKey: body.authPublicKey,
      displayName: signerLabel,
    });

    const policyId = getDefaultPolicyId();
    const policyMeta = buildDefaultPolicyMeta();
    const capabilitySummary = buildDefaultCapabilitySummary(chainId);

    const provisionAttestation = signCallbackPayload(
      buildSignedCallbackPayload({
        kind: 'provision' as const,
        nonce: randomUUID(),
        accountAddress: body.agwAccountAddress,
        underlyingSignerAddress: body.signerAddress,
        chainId,
        authPublicKey: body.authPublicKey,
        walletId: wallet.id,
        signerId: signer.id,
        policyIds: [policyId],
        signerFingerprint,
        signerLabel,
        signerCreatedAt: signer.createdAt,
        policyMeta,
        capabilitySummary,
      }, 30 * 60),
    );
    const result: ProvisionedSignerResult = {
      walletId: wallet.id,
      agwAccountAddress: body.agwAccountAddress,
      signerAddress: body.signerAddress,
      signerType: 'device_authorization_key',
      signerId: signer.id,
      provisionAttestation,
      policyIds: [policyId],
      signerFingerprint,
      signerLabel,
      signerCreatedAt: signer.createdAt,
      policyMeta,
      capabilitySummary,
      existingSigners,
    };

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
