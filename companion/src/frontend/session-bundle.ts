import { type Address, type Hex } from "viem";
import { LimitType, LimitZero, type SessionConfig } from "@abstract-foundation/agw-client/sessions";

interface CompanionCallPolicy {
  target: string;
  selector?: string;
}

interface CompanionTransferPolicy {
  target: string;
  maxValuePerUse: string;
}

interface CompanionSessionPolicyConfig {
  feeLimit: string;
  maxValuePerUse: string;
  callPolicies: CompanionCallPolicy[];
  transferPolicies: CompanionTransferPolicy[];
}

export interface CompanionPolicyPayload {
  expiresAt: number;
  sessionConfig: CompanionSessionPolicyConfig;
}

export interface SessionBundle {
  accountAddress: string;
  chainId: number;
  expiresAt: number;
  sessionConfig: Record<string, unknown>;
  sessionSignerRef: {
    kind: "raw";
    value: string;
  };
}

export function toSdkSessionConfig(
  signerAddress: Address,
  payload: CompanionPolicyPayload,
): SessionConfig {
  const { sessionConfig } = payload;

  return {
    signer: signerAddress,
    expiresAt: BigInt(payload.expiresAt),
    feeLimit: {
      limitType: LimitType.Lifetime,
      limit: BigInt(sessionConfig.feeLimit),
      period: BigInt(0),
    },
    callPolicies: sessionConfig.callPolicies.map((cp) => ({
      target: cp.target as Address,
      selector: (cp.selector ?? "0x00000000") as Hex,
      valueLimit: sessionConfig.maxValuePerUse !== "0"
        ? { limitType: LimitType.Lifetime, limit: BigInt(sessionConfig.maxValuePerUse), period: BigInt(0) }
        : LimitZero,
      maxValuePerUse: BigInt(sessionConfig.maxValuePerUse),
      constraints: [],
    })),
    transferPolicies: sessionConfig.transferPolicies.map((tp) => ({
      target: tp.target as Address,
      maxValuePerUse: BigInt(tp.maxValuePerUse),
      valueLimit: {
        limitType: LimitType.Lifetime,
        limit: BigInt(tp.maxValuePerUse),
        period: BigInt(0),
      },
    })),
  };
}

function serializeSessionConfig(config: SessionConfig): Record<string, unknown> {
  return {
    signer: config.signer,
    expiresAt: config.expiresAt.toString(),
    feeLimit: {
      limitType: config.feeLimit.limitType,
      limit: config.feeLimit.limit.toString(),
      period: config.feeLimit.period.toString(),
    },
    callPolicies: config.callPolicies.map((cp) => ({
      target: cp.target,
      selector: cp.selector,
      valueLimit: {
        limitType: cp.valueLimit.limitType,
        limit: cp.valueLimit.limit.toString(),
        period: cp.valueLimit.period.toString(),
      },
      maxValuePerUse: cp.maxValuePerUse.toString(),
      constraints: cp.constraints.map((c) => ({
        index: c.index.toString(),
        condition: c.condition,
        refValue: c.refValue,
        limit: {
          limitType: c.limit.limitType,
          limit: c.limit.limit.toString(),
          period: c.limit.period.toString(),
        },
      })),
    })),
    transferPolicies: config.transferPolicies.map((tp) => ({
      target: tp.target,
      maxValuePerUse: tp.maxValuePerUse.toString(),
      valueLimit: {
        limitType: tp.valueLimit.limitType,
        limit: tp.valueLimit.limit.toString(),
        period: tp.valueLimit.period.toString(),
      },
    })),
  };
}

export function buildSessionBundle(
  accountAddress: Address,
  sessionConfig: SessionConfig,
  sessionSignerPrivateKey: Hex,
  chainId: number,
): SessionBundle {
  return {
    accountAddress,
    chainId,
    expiresAt: Number(sessionConfig.expiresAt),
    sessionConfig: serializeSessionConfig(sessionConfig),
    sessionSignerRef: {
      kind: "raw",
      value: sessionSignerPrivateKey,
    },
  };
}
