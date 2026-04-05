import { NextResponse } from "next/server";
import type { SessionPolicyMeta } from "@/lib/policy-types";
import { buildRedirectUrl, isLoopbackCallbackUrl } from "@/lib/redirect";
import {
  buildSignedCallbackPayload,
  signCallbackPayload,
  verifySignedServerPayload,
} from "@/lib/server/callback-attestation";
import { getKeyQuorumById, getWalletById } from "@/lib/server/privy-api";
import type { DelegatedCapabilitySummary } from "@/lib/session-config";

interface FinalizeInitRequestBody {
  callbackUrl?: string;
  provisionAttestation?: string;
}

interface ProvisionAttestationPayload {
  kind: "provision";
  nonce: string;
  accountAddress: string;
  underlyingSignerAddress: string;
  chainId: number;
  authPublicKey: string;
  walletId: string;
  signerId: string;
  policyIds: string[];
  signerFingerprint: string;
  signerLabel: string;
  signerCreatedAt: number;
  policyMeta: SessionPolicyMeta;
  capabilitySummary: DelegatedCapabilitySummary;
  iss: string;
  iat: number;
  exp: number;
}

function extractCallbackState(callbackUrl: string): string {
  const url = new URL(callbackUrl);
  const state = url.searchParams.get("state");
  if (!state?.trim()) {
    throw new Error("callbackUrl is missing required `state` parameter.");
  }
  return state.trim();
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as FinalizeInitRequestBody;
    if (!body.callbackUrl || !isLoopbackCallbackUrl(body.callbackUrl)) {
      return NextResponse.json(
        { error: "Invalid callbackUrl." },
        { status: 400 },
      );
    }
    if (!body.provisionAttestation?.trim()) {
      return NextResponse.json(
        { error: "Missing required field: provisionAttestation." },
        { status: 400 },
      );
    }

    const provision = verifySignedServerPayload<ProvisionAttestationPayload>(
      body.provisionAttestation,
    );
    if (provision.kind !== "provision") {
      return NextResponse.json(
        { error: "Invalid provision attestation." },
        { status: 400 },
      );
    }

    const callbackState = extractCallbackState(body.callbackUrl);
    const wallet = await getWalletById(provision.walletId);
    if (
      wallet.address.toLowerCase() !==
      provision.underlyingSignerAddress.toLowerCase()
    ) {
      throw new Error(
        `Provisioned wallet ${wallet.id} does not match the expected underlying signer address.`,
      );
    }

    const attachedSigner = wallet.additionalSigners.find(
      (entry) => entry.signerId === provision.signerId,
    );
    if (!attachedSigner) {
      throw new Error(
        `Signer ${provision.signerId} is not attached to wallet ${wallet.id}.`,
      );
    }

    const expectedPolicyIds = [...provision.policyIds].sort();
    const attachedPolicyIds = [...attachedSigner.policyIds].sort();
    if (
      expectedPolicyIds.length !== attachedPolicyIds.length ||
      expectedPolicyIds.some(
        (policyId, index) => policyId !== attachedPolicyIds[index],
      )
    ) {
      throw new Error(
        `Signer ${provision.signerId} policy ids do not match the expected remote wallet binding.`,
      );
    }

    const signer = await getKeyQuorumById(provision.signerId);
    if (!signer.publicKeys.includes(provision.authPublicKey)) {
      throw new Error(
        `Signer ${provision.signerId} is not bound to the expected device public key.`,
      );
    }

    const signedPayload = buildSignedCallbackPayload({
      version: 2 as const,
      action: "init" as const,
      state: callbackState,
      accountAddress: provision.accountAddress,
      underlyingSignerAddress: provision.underlyingSignerAddress,
      chainId: provision.chainId,
      walletId: provision.walletId,
      signerType: "device_authorization_key" as const,
      signerId: provision.signerId,
      policyIds: [...provision.policyIds],
      signerFingerprint: provision.signerFingerprint,
      signerLabel: signer.displayName,
      signerCreatedAt: signer.createdAt,
      policyMeta: provision.policyMeta,
      capabilitySummary: provision.capabilitySummary,
    });
    const token = signCallbackPayload(signedPayload);

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
