import { computePublicKeyFingerprint, writeAuthKeyfile } from "../privy/auth.js";
import { resolveDefaultStorageDir } from "../session/storage.js";
import type { AgwSessionData } from "../session/types.js";
import type { PrivySignerInitBundlePayload } from "./callback.js";

export interface MaterializeSessionFromBundleOptions {
  chainId: number;
  authKeyfilePath: string;
  nowUnixSeconds?: number;
}

export interface VerifiedPrivySignerBinding {
  walletId: string;
  signerId: string;
  signerLabel: string;
  signerFingerprint: string;
  signerCreatedAt: number;
  policyIds: string[];
}

export function resolveStorageDir(homeDir?: string): string {
  return homeDir ?? resolveDefaultStorageDir();
}

export function writeAuthKey(privateKeyDer: Buffer, storageDir: string): string {
  return writeAuthKeyfile(privateKeyDer, storageDir);
}

export function buildKeyFingerprint(publicKeyBase64: string): string {
  return computePublicKeyFingerprint(publicKeyBase64);
}

export function materializeSessionFromBundle(
  bundle: PrivySignerInitBundlePayload,
  options: MaterializeSessionFromBundleOptions,
): AgwSessionData {
  if (bundle.chainId !== options.chainId) {
    throw new Error(`Signer bundle chain id (${bundle.chainId}) does not match requested chain id (${options.chainId}).`);
  }

  const now = options.nowUnixSeconds ?? Math.floor(Date.now() / 1000);

  return {
    accountAddress: bundle.accountAddress,
    underlyingSignerAddress: bundle.underlyingSignerAddress,
    chainId: bundle.chainId,
    createdAt: now,
    updatedAt: now,
    status: "active",
    policyMeta: bundle.policyMeta,
    privyWalletId: bundle.walletId,
    privySignerBinding: {
      type: bundle.signerType,
      canonicalType: "key_quorum",
      id: bundle.signerId,
      policyIds: [...bundle.policyIds],
      fingerprint: bundle.signerFingerprint,
      label: bundle.signerLabel,
      createdAt: bundle.signerCreatedAt,
    },
    privyPolicyIds: [...bundle.policyIds],
    privySignerId: bundle.signerId,
    privySignerType: bundle.signerType,
    privySignerFingerprint: bundle.signerFingerprint,
    privySignerLabel: bundle.signerLabel,
    privySignerCreatedAt: bundle.signerCreatedAt,
    capabilitySummary: bundle.capabilitySummary,
    privyPolicyId: bundle.policyIds[0],
    privyQuorumId: bundle.signerId,
    privyAuthKeyRef: {
      kind: "keyfile",
      value: options.authKeyfilePath,
    },
  };
}
